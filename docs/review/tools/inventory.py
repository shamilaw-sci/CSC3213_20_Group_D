"""Refresh inventory facts without changing baseline evidence or review decisions.

Review-assistant tooling, not student-authored application code. Python 3 stdlib
only. Original Stage 1 evidence is read-only. No application modules are loaded.
"""

import argparse
import collections
import csv
import datetime
import hashlib
import io
import json
import os
import pathlib
import re
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[3]
GENERATED_ROOT = 'docs/review/evidence/'
TRACKER_PATH = 'docs/review/FILE_REVIEW_TRACKER.csv'
REVIEW_ROOTS = ('docs/review/', 'docs/viva/', 'docs/final-review/')
BASE_COLUMNS = [
    'path', 'file_category', 'module_or_shared_responsibility',
    'original_author_evidence_status', 'applicable_review_categories',
    'review_status', 'documentation_reference', 'verification_status',
    'exclusion_reason', 'git_state_at_start', 'sha256_at_start',
]
CURRENT_COLUMNS = [
    'baseline_path', 'current_file_category', 'current_module_classification',
    'classification_status', 'current_git_state', 'current_sha256',
    'presence_status', 'current_read_error', 'current_author_evidence',
    'ownership_decision', 'prior_paths', 'rename_evidence',
    'verification_applicability',
]


def git(root, *args):
    """Read Git metadata without modifying refs, index, files or configuration."""
    result = subprocess.run(['git', '-c', 'core.quotepath=false', *args], cwd=root,
                            capture_output=True, check=True)
    return result.stdout.decode('utf-8', 'surrogateescape')


def is_generated(path):
    """Identify outputs whose contents must never feed their own inventory."""
    return path.startswith(GENERATED_ROOT) or path == TRACKER_PATH


def category(path):
    """Classify formats; generated evidence receives metadata-only accounting."""
    p = pathlib.PurePosixPath(path)
    if is_generated(path):
        return 'Generated review evidence'
    if '/.vite/' in path or '/__pycache__/' in path:
        return 'Generated cache'
    if p.name.endswith('lock.json'):
        return 'Lockfile'
    if p.suffix.lower() in ('.png', '.jpeg', '.jpg'):
        return 'Binary asset'
    if p.suffix.lower() == '.svg':
        return 'Vector asset'
    if p.suffix.lower() == '.md':
        return 'Documentation'
    if '/migrations/' in path and p.suffix == '.sql':
        return 'Database migration'
    if p.name == '.gitkeep':
        return 'Directory placeholder'
    if '/tests/' in path:
        return 'Maintained regression tests'
    if '/tools/' in path or '/scripts/' in path:
        return 'Verification tooling'
    if p.name.startswith('.') or p.suffix == '.json' or p.name.endswith('config.js'):
        return 'Configuration'
    if p.suffix in ('.js', '.jsx', '.mjs', '.py', '.css', '.html'):
        return 'Handwritten source'
    return 'Other / inspect'


def responsibility(path):
    """Prefer directory contracts; keep filename-only inferences provisional."""
    lower = path.lower()
    if lower.startswith(REVIEW_ROOTS):
        return 'Review / viva documentation and tooling', 'Provisional directory classification'
    match = re.search(r'^backend/src/modules/([^/]+)/', lower)
    if not match:
        match = re.search(r'^frontend/src/pages/([^/]+)/', lower)
    if match:
        return match[1], 'Provisional directory classification; feature may cross modules'
    if 'auditlog' in lower:
        return 'Audit logging', 'Provisional filename classification'
    names = [name for name in ('appointment', 'prescription', 'laboratory', 'pharmacy',
             'emergency', 'hospital', 'interaction', 'payment', 'doctor', 'auth', 'admin',
             'patient') if name in lower]
    if len(names) == 1:
        return names[0], 'Provisional filename classification'
    if len(names) > 1:
        return 'Shared / ' + ', '.join(names), 'Ambiguous filename; module decision pending'
    layer = path.split('/')[0] if '/' in path else 'Project'
    return f'{layer} / shared foundations', 'Provisional shared classification'


def read_file(root, path):
    """Read tracked source safely; missing/unreadable files become facts, not crashes."""
    file = root / path
    if is_generated(path):
        return {'sha256': '', 'text': '', 'error': '', 'exists': file.is_file()}
    try:
        if file.is_symlink() or not file.resolve().is_relative_to(root.resolve()):
            return {'sha256': '', 'text': '', 'error': 'Symlink/external path not followed', 'exists': file.exists()}
        data = file.read_bytes()
        text = '' if category(path) == 'Binary asset' else data.decode('utf-8', 'replace')
        return {'sha256': hashlib.sha256(data).hexdigest(), 'text': text, 'error': '', 'exists': True}
    except OSError as error:
        return {'sha256': '', 'text': '', 'error': type(error).__name__, 'exists': file.exists()}


def author_header(text):
    """Extract opening author declarations without asserting their correctness."""
    return ' | '.join(re.findall(r'(?:@author\s+|--\s*Author:\s*)([^\r\n]+)', text[:4500]))


def parse_renames(raw):
    """Parse NUL-delimited Git name-status; copies never transfer review history."""
    fields = raw.split('\0')
    result, index = {}, 0
    while index < len(fields) and fields[index]:
        status = fields[index]
        index += 1
        if status.startswith(('R', 'C')):
            old, new = fields[index:index + 2]
            index += 2
            if status.startswith('R'):
                result[old] = (new, f'Git {status} rename')
        else:
            index += 1
    return result


def merge_rows(existing, tracked, baseline, facts, states, rename_edges=None):
    """Merge current facts while preserving all review fields and historical rows.

    Renames need a Git edge or unique exact-content match; duplicates stay
    ambiguous. Unknown/custom CSV columns are retained verbatim.
    """
    tracked = set(tracked)
    rows = {row['path']: dict(row) for row in existing}
    if len(rows) != len(existing):
        raise ValueError('Duplicate tracker paths; refusing lossy refresh')
    renames = {}
    for old, (new, evidence) in (rename_edges or {}).items():
        visited = {old}
        while new in (rename_edges or {}) and new not in visited:
            visited.add(new)
            new, next_evidence = rename_edges[new]
            evidence += '; ' + next_evidence
        if old in rows and old not in tracked and new in tracked and new not in rows:
            renames[old] = (new, evidence)
    old_hashes, new_hashes = collections.defaultdict(list), collections.defaultdict(list)
    destinations = {new for new, _ in renames.values()}
    for old, row in rows.items():
        digest = row.get('current_sha256') or row.get('sha256_at_start')
        if (old not in tracked and old not in renames and digest and not is_generated(old)
                and not facts.get(old, {}).get('exists', False)):
            old_hashes[digest].append(old)
    for new in tracked - rows.keys() - destinations:
        digest = facts[new]['sha256']
        if digest and not is_generated(new):
            new_hashes[digest].append(new)
    for digest, old_paths in old_hashes.items():
        if len(old_paths) == len(new_hashes[digest]) == 1:
            renames[old_paths[0]] = (new_hashes[digest][0], 'Unique exact-content move; inferred, not a Git author claim')
    for old, (new, evidence) in renames.items():
        row = rows.pop(old)
        prior = json.loads(row.get('prior_paths') or '[]')
        prior.append(old)
        row.update(path=new, prior_paths=json.dumps(list(dict.fromkeys(prior))), rename_evidence=evidence,
                   baseline_path=row.get('baseline_path') or (old if old in baseline['sha256'] else ''))
        rows[new] = row
    for path in sorted(tracked | rows.keys()):
        fact = facts.get(path, {'exists': False, 'sha256': '', 'text': '', 'error': ''})
        cat = category(path)
        module, confidence = responsibility(path)
        if path not in rows:
            exclusion = {
                'Generated review evidence': 'Generated evidence accounted for by path only; no content hashing/parsing',
                'Generated cache': 'Generated cache; no manual comment edits',
                'Binary asset': 'Binary asset; no source comment edits',
                'Lockfile': 'Generated dependency resolution; no source comment edits',
                'Directory placeholder': 'Directory marker; no executable behavior',
            }.get(cat, '')
            rows[path] = dict.fromkeys(BASE_COLUMNS, '')
            rows[path].update(path=path, file_category=cat, module_or_shared_responsibility=module,
                original_author_evidence_status='Pending ownership investigation; no author inferred',
                applicable_review_categories='Documentation accuracy; provenance; check safety' if path.startswith(REVIEW_ROOTS)
                    else 'Behavior; permissions; validation; wording/UI where applicable; commenting; ownership',
                review_status='Pending individual review (new inventory row)',
                documentation_reference='docs/review/PROGRESS.md',
                verification_status='Not individually verified', exclusion_reason=exclusion,
                git_state_at_start=('unstaged' if path in baseline.get('unstaged', []) else
                    'untracked' if path in baseline.get('preexisting_untracked', []) else 'clean')
                    if path in baseline['sha256'] else '',
                sha256_at_start=baseline['sha256'].get(path, ''))
        row = rows[path]
        previous_hash = row.get('current_sha256') or row.get('sha256_at_start')
        baseline_path = row.get('baseline_path') or (path if path in baseline['sha256'] else '')
        row.update(baseline_path=baseline_path, current_file_category=cat,
                   current_module_classification=module, classification_status=confidence,
                   current_git_state='Generated output; contents not evaluated' if is_generated(path) else states.get(path, 'clean'),
                   current_sha256=fact['sha256'], current_read_error=fact['error'],
                   current_author_evidence=author_header(fact['text']) or 'No author header detected; not an authorship decision')
        row.setdefault('ownership_decision', '')
        row.setdefault('prior_paths', '[]')
        row.setdefault('rename_evidence', '')
        if path not in tracked:
            row['presence_status'] = 'No longer tracked; historical record retained'
        elif not fact['exists']:
            row['presence_status'] = 'Missing from working tree; still tracked'
        else:
            row['presence_status'] = 'Tracked and present'
        if is_generated(path):
            row['verification_applicability'] = 'Generated output; prior notes preserved; contents excluded from refresh inputs'
        elif not fact['exists']:
            row['verification_applicability'] = 'Historical verification only; file missing/deleted'
        elif previous_hash and previous_hash != fact['sha256']:
            row['verification_applicability'] = 'Content changed since recorded hash; retain notes as historical until reverified'
        else:
            row.setdefault('verification_applicability', 'Prior notes retained; check scope/source snapshot before reuse')
    return [rows[path] for path in sorted(rows)]


def atomic_write(path, data):
    """Replace one file atomically after complete serialization and fsync."""
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=path.name + '.', suffix='.tmp', dir=path.parent)
    try:
        with os.fdopen(descriptor, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def csv_bytes(rows, columns):
    """Serialize a complete CSV before any destination is touched."""
    stream = io.StringIO(newline='')
    writer = csv.DictWriter(stream, fieldnames=columns, lineterminator='\n')
    writer.writeheader()
    writer.writerows(rows)
    return stream.getvalue().encode('utf-8')


def save_tracker(path, data, expected):
    """Keep a recoverable copy and reject concurrent edits before replacement."""
    current = path.read_bytes() if path.exists() else b''
    if current != expected:
        raise RuntimeError('Tracker changed concurrently; no tracker write performed')
    if data == current:
        return
    if current:
        backup = path.parent / 'evidence/tracker-backups' / (hashlib.sha256(current).hexdigest() + '.csv')
        backup.parent.mkdir(parents=True, exist_ok=True)
        if not backup.exists():
            atomic_write(backup, current)
        elif backup.read_bytes() != current:
            raise RuntimeError('Backup content mismatch; no tracker write performed')
    if (path.read_bytes() if path.exists() else b'') != expected:
        raise RuntimeError('Tracker changed during backup; no tracker write performed')
    atomic_write(path, data)


def capture(root=ROOT):
    """Refresh mutable reports, leaving every original Stage 1 evidence file intact."""
    root = pathlib.Path(root).resolve()
    out = root / 'docs/review'
    baseline_bytes = (out / 'evidence/initial-state.json').read_bytes()
    baseline = json.loads(baseline_bytes)
    tracker = out / 'FILE_REVIEW_TRACKER.csv'
    original = tracker.read_bytes() if tracker.exists() else b''
    existing = list(csv.DictReader(io.StringIO(original.decode('utf-8')))) if original else []
    tracked = sorted(filter(None, git(root, 'ls-files', '-z').split('\0')))
    untracked = sorted(filter(None, git(root, 'ls-files', '--others', '--exclude-standard', '-z').split('\0')))
    facts = {path: read_file(root, path) for path in tracked}
    for row in existing:
        if row['path'] not in facts:
            facts[row['path']] = read_file(root, row['path'])
    states = {}
    for args, label in [(('diff', '--name-only', '-z'), 'unstaged'),
                        (('diff', '--cached', '--name-only', '-z'), 'staged')]:
        for path in filter(None, git(root, *args).split('\0')):
            states[path] = states.get(path, '') + ('; ' if path in states else '') + label
    current = out / 'evidence/inventory-current.json'
    previous_head = json.loads(current.read_text(encoding='utf-8'))['head'] if current.exists() else baseline['head']
    edges = {}
    for args in [('diff', '--name-status', '-z', '-M', previous_head, 'HEAD'),
                 ('diff', '--cached', '--name-status', '-z', '-M'), ('diff', '--name-status', '-z', '-M')]:
        edges.update(parse_renames(git(root, *args)))
    rows = merge_rows(existing, tracked, baseline, facts, states, edges)
    columns = list(dict.fromkeys(BASE_COLUMNS + list(existing[0] if existing else []) + CURRENT_COLUMNS))
    tracker_data = csv_bytes(rows, columns)
    deliverables = []
    for path in untracked:
        if path.startswith(REVIEW_ROOTS) and not is_generated(path) and category(path) != 'Generated cache':
            fact = read_file(root, path)
            deliverables.append(dict(path=path, category=category(path), current_sha256=fact['sha256'],
                                     status='Untracked review deliverable; not yet in tracked inventory'))
    imports = []
    for path, fact in facts.items():
        if path in tracked and path.endswith(('.js', '.jsx', '.mjs')) and not is_generated(path):
            for specifier in sorted(set(re.findall(r'''(?:require\(\s*|from\s+|import\s*)['"]([^'"]+)['"]''', fact['text']))):
                imports.append(dict(path=path, import_specifier=specifier,
                                    evidence='Static literal import; does not prove runtime reachability'))
    summary = dict(format_version=2, refreshed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                   head=git(root, 'rev-parse', 'HEAD').strip(), branch=git(root, 'branch', '--show-current').strip(),
                   baseline_head=baseline['head'], baseline_tracked_count=baseline['tracked_count'],
                   current_tracked_count=len(tracked), tracker_row_count=len(rows),
                   historical_row_count=sum(row['presence_status'].startswith('No longer') for row in rows),
                   missing_tracked_paths=[row['path'] for row in rows if row['presence_status'].startswith('Missing')],
                   untracked_review_deliverables=len(deliverables),
                   generated_evidence_policy='Tracked output paths are accounted for without hashing/parsing; untracked evidence trees/backups are excluded',
                   category_counts=dict(collections.Counter(category(path) for path in tracked)))
    payloads = {
        out / 'evidence/untracked-review-deliverables.csv': csv_bytes(deliverables,
            ['path', 'category', 'current_sha256', 'status']),
        out / 'evidence/source-imports-current.csv': csv_bytes(imports, ['path', 'import_specifier', 'evidence']),
    }
    if (out / 'evidence/initial-state.json').read_bytes() != baseline_bytes:
        raise RuntimeError('Baseline changed concurrently; refresh aborted')
    for path, data in payloads.items():
        atomic_write(path, data)
    save_tracker(tracker, tracker_data, original)
    # Advance the rename cursor only after successful tracker publication.
    # A failed tracker write must not hide committed moves on the next retry.
    atomic_write(current, (json.dumps(summary, indent=2) + '\n').encode())
    return summary


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=pathlib.Path, default=ROOT)
    args = parser.parse_args()
    try:
        print(json.dumps(capture(args.root), indent=2))
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'Inventory refresh aborted ({type(error).__name__}); original tracker remains recoverable.\n')
