"""Maintained regression fixtures for lossless review inventory refresh.

No Care4U application code or live services are executed. Temporary Git repos
and files are owned exclusively by each fixture. No student identity is used.
"""
import csv
import hashlib
import importlib.util
import io
import json
import pathlib
import subprocess
import tempfile
import unittest
from unittest import mock

SPEC = importlib.util.spec_from_file_location('inventory', pathlib.Path(__file__).resolve().parents[1] / 'inventory.py')
inventory = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(inventory)


def fact(text='old', exists=True):
    """Build source facts without reading the real tracker."""
    return dict(text=text, sha256=hashlib.sha256(text.encode()).hexdigest() if exists else '',
                exists=exists, error='' if exists else 'FileNotFoundError')


class MergeTests(unittest.TestCase):
    """Exercise human decisions, provenance, deletion and rename semantics."""

    def setUp(self):
        self.row = dict.fromkeys(inventory.BASE_COLUMNS, '')
        self.row.update(path='old.js', review_status='Completed behavioral review',
                        verification_status='Fixture assertions passed; browser pending',
                        documentation_reference='viva/reviewed.md', exclusion_reason='Intentional exception',
                        original_author_evidence_status='Team-confirmed original author',
                        ownership_decision='Retain original credit', custom_note='Do not lose this',
                        sha256_at_start=fact()['sha256'], git_state_at_start='unstaged')
        self.baseline = dict(sha256={'old.js': fact()['sha256']}, unstaged=['old.js'])

    def test_completed_decisions_survive_and_new_file_is_pending(self):
        rows = inventory.merge_rows([self.row], ['old.js', 'new.js'], self.baseline,
                                    {'old.js': fact('changed'), 'new.js': fact('new')}, {})
        old, new = {r['path']: r for r in rows}['old.js'], {r['path']: r for r in rows}['new.js']
        for key in self.row:
            self.assertEqual(old[key], self.row[key], key)
        self.assertIn('Content changed', old['verification_applicability'])
        self.assertIn('Pending individual', new['review_status'])
        self.assertEqual(new['sha256_at_start'], '')
        # A second refresh must not make old verification current again.
        again = inventory.merge_rows(rows, ['old.js', 'new.js'], self.baseline,
                                     {'old.js': fact('changed'), 'new.js': fact('new')}, {})
        self.assertIn('Content changed', next(r for r in again if r['path'] == 'old.js')['verification_applicability'])

    def test_deletion_retains_entire_historical_record(self):
        row = inventory.merge_rows([self.row], [], self.baseline, {}, {})[0]
        self.assertIn('historical record retained', row['presence_status'])
        for key in self.row:
            self.assertEqual(row[key], self.row[key], key)

    def test_git_rename_preserves_history_even_with_content_changes(self):
        row = inventory.merge_rows([self.row], ['moved.js'], self.baseline,
              {'moved.js': fact('changed')}, {}, {'old.js': ('moved.js', 'Git R080 rename')})[0]
        self.assertEqual(row['review_status'], self.row['review_status'])
        self.assertEqual(row['baseline_path'], 'old.js')
        self.assertEqual(json.loads(row['prior_paths']), ['old.js'])
        self.assertIn('R080', row['rename_evidence'])

    def test_unique_exact_move_and_ambiguous_copies(self):
        exact = inventory.merge_rows([self.row], ['new.js'], self.baseline, {'new.js': fact()}, {})
        self.assertEqual(len(exact), 1)
        ambiguous = inventory.merge_rows([self.row], ['new.js', 'copy.js'], self.baseline,
                                        {'new.js': fact(), 'copy.js': fact()}, {})
        self.assertEqual(len(ambiguous), 3)
        self.assertTrue(all('Pending' in r['review_status'] for r in ambiguous if r['path'] != 'old.js'))

    def test_tracked_missing_file_is_accounted_for(self):
        row = inventory.merge_rows([self.row], ['old.js'], self.baseline, {'old.js': fact(exists=False)}, {})[0]
        self.assertIn('still tracked', row['presence_status'])
        self.assertEqual(row['current_read_error'], 'FileNotFoundError')

    def test_untracked_original_copy_is_not_inferred_as_rename(self):
        rows = inventory.merge_rows([self.row], ['new.js'], self.baseline,
                                    {'new.js': fact(), 'old.js': fact()}, {})
        self.assertEqual(len(rows), 2)
        self.assertIn('historical', next(r for r in rows if r['path'] == 'old.js')['presence_status'])

    def test_filename_classification_is_explicitly_ambiguous(self):
        module, status = inventory.responsibility('mobile/src/screens/PatientDoctorSearch.js')
        self.assertIn('patient', module)
        self.assertIn('Ambiguous', status)

    def test_duplicate_rows_are_rejected(self):
        with self.assertRaises(ValueError):
            inventory.merge_rows([self.row, self.row], [], self.baseline, {}, {})

    def test_copy_status_does_not_transfer_history(self):
        self.assertEqual(inventory.parse_renames('C100\0old.js\0copy.js\0'), {})
        self.assertEqual(inventory.parse_renames('R095\0old name.js\0new name.js\0'),
                         {'old name.js': ('new name.js', 'Git R095 rename')})


class DiskTests(unittest.TestCase):
    """Exercise actual Git rename evidence and atomic writes in isolated repos."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)

    def test_failed_replace_leaves_tracker_and_baseline_recoverable(self):
        tracker = self.root / 'tracker.csv'
        tracker.write_bytes(b'original')
        with mock.patch.object(inventory.os, 'replace', side_effect=OSError('fixture failure')):
            with self.assertRaises(OSError):
                inventory.atomic_write(tracker, b'replacement')
        self.assertEqual(tracker.read_bytes(), b'original')
        self.assertEqual(list(self.root.glob('*.tmp')), [])
        inventory.save_tracker(tracker, b'new', b'original')
        backups = list((self.root / 'evidence/tracker-backups').glob('*.csv'))
        self.assertEqual([p.read_bytes() for p in backups], [b'original'])
        with self.assertRaises(RuntimeError):
            inventory.save_tracker(tracker, b'bad', b'outdated')
        self.assertEqual(tracker.read_bytes(), b'new')

    def test_failed_refresh_does_not_advance_rename_cursor(self):
        out = self.root / 'docs/review'
        (out / 'evidence').mkdir(parents=True)
        (self.root / 'old.js').write_text('old', encoding='utf-8')
        baseline = dict(head='original', tracked_count=1, sha256={'old.js': fact()['sha256']})
        (out / 'evidence/initial-state.json').write_text(json.dumps(baseline), encoding='utf-8')
        (out / 'evidence/inventory-current.json').write_text('{"head":"previous-success"}', encoding='utf-8')
        rows = inventory.merge_rows([], ['old.js'], baseline, {'old.js': fact()}, {})
        tracker_bytes = inventory.csv_bytes(rows, list(rows[0]))
        (out / 'FILE_REVIEW_TRACKER.csv').write_bytes(tracker_bytes)

        def fake_git(_root, *args):
            if args[:1] == ('ls-files',):
                return '' if '--others' in args else 'old.js\0'
            if args[:1] == ('rev-parse',):
                return 'new-head'
            return ''

        with mock.patch.object(inventory, 'git', side_effect=fake_git), \
                mock.patch.object(inventory, 'save_tracker', side_effect=OSError('fixture failure')):
            with self.assertRaises(OSError):
                inventory.capture(self.root)
        self.assertEqual(json.loads((out / 'evidence/inventory-current.json').read_text())['head'], 'previous-success')
        self.assertEqual((out / 'FILE_REVIEW_TRACKER.csv').read_bytes(), tracker_bytes)

    def test_refresh_baseline_immutable_and_untracked_outputs_do_not_recurse(self):
        def git(*args):
            return subprocess.check_output(['git', '-c', 'core.autocrlf=false', *args], cwd=self.root, stderr=subprocess.DEVNULL)
        git('init')
        (self.root / 'old.js').write_text('const answer = 42;\n', encoding='utf-8')
        git('add', '--', 'old.js')
        git('-c', 'user.name=Review fixture', '-c', 'user.email=fixture@example.test', 'commit', '-m', 'fixture source')
        out = self.root / 'docs/review'
        (out / 'evidence').mkdir(parents=True)
        baseline = dict(head=git('rev-parse', 'HEAD').decode().strip(), tracked_count=1,
                        sha256={'old.js': hashlib.sha256((self.root / 'old.js').read_bytes()).hexdigest()})
        baseline_bytes = json.dumps(baseline).encode()
        (out / 'evidence/initial-state.json').write_bytes(baseline_bytes)
        initial = inventory.merge_rows([], ['old.js'], baseline, {'old.js': inventory.read_file(self.root, 'old.js')}, {})
        initial[0]['review_status'] = 'Completed fixture review'
        (out / 'FILE_REVIEW_TRACKER.csv').write_bytes(inventory.csv_bytes(initial, list(initial[0])))
        git('mv', '--', 'old.js', 'new.js')
        (out / 'PLAN.md').write_text('fixture deliverable', encoding='utf-8')
        (out / 'evidence/generated.json').write_text('{"nested":"do not parse"}', encoding='utf-8')
        inventory.capture(self.root)
        rows = list(csv.DictReader(io.StringIO((out / 'FILE_REVIEW_TRACKER.csv').read_text(encoding='utf-8'))))
        self.assertEqual(rows[0]['path'], 'new.js')
        self.assertEqual(rows[0]['review_status'], 'Completed fixture review')
        self.assertIn('Git R100', rows[0]['rename_evidence'])
        self.assertEqual((out / 'evidence/initial-state.json').read_bytes(), baseline_bytes)
        deliverables = list(csv.DictReader(io.StringIO((out / 'evidence/untracked-review-deliverables.csv').read_text(encoding='utf-8'))))
        self.assertEqual([r['path'] for r in deliverables], ['docs/review/PLAN.md'])
        before = (out / 'FILE_REVIEW_TRACKER.csv').read_bytes()
        inventory.capture(self.root)
        self.assertEqual((out / 'FILE_REVIEW_TRACKER.csv').read_bytes(), before)


if __name__ == '__main__':
    unittest.main()
