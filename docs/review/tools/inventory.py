"""Stage 1 read-only repository inventory; writes only docs/review evidence.

Created by the review assistant on 2026-11-12. No student authorship claimed.
Run from the repository root with Python 3. No application modules are imported.
"""

import collections
import csv
import hashlib
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT = ROOT / 'docs/review'
EVIDENCE = OUT / 'evidence'
EVIDENCE.mkdir(parents=True, exist_ok=True)


def git(*args):
    """Return Git metadata without changing the index, worktree, or refs."""
    return subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8', 'replace')


def write_csv(path, rows, columns):
    """Write a UTF-8 CSV with a stable column order."""
    with path.open('w', newline='', encoding='utf-8') as stream:
        writer = csv.DictWriter(stream, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)


def responsibility(path):
    """Classify responsibility from actual module and feature paths."""
    p = path.lower()
    if '/auditlog' in p or 'auditlogpage' in p:
        return 'Audit logging'
    for name in ['health-content', 'appointment', 'prescription', 'laboratory', 'pharmacy',
                 'emergency', 'hospital', 'interaction', 'payment', 'order', 'doctor', 'auth', 'admin', 'patient']:
        if name in p and not p.startswith('docs/'):
            return {'auth': 'Authentication', 'health-content': 'Admin health content',
                    'interaction': 'Doctor / medicine interactions', 'order': 'Pharmacy / orders',
                    'payment': 'Appointment / sandbox payments'}.get(name, name.title())
    if p.startswith('backend/migrations/'):
        return 'Database / shared schema'
    if p.startswith('backend/'):
        return 'Backend / shared foundations'
    if p.startswith('frontend/'):
        return 'Web / shared foundations'
    if p.startswith('mobile/'):
        return 'Mobile / shared foundations'
    return 'Project / shared'


def category(path):
    """Distinguish source, tooling, documentation, generated files, and assets."""
    p = pathlib.PurePosixPath(path)
    if '/.vite/' in path:
        return 'Generated cache'
    if p.name.endswith('lock.json'):
        return 'Lockfile'
    if p.suffix.lower() in ['.png', '.jpeg', '.jpg']:
        return 'Binary asset'
    if p.suffix.lower() == '.svg':
        return 'Vector asset'
    if p.suffix == '.md':
        return 'Documentation'
    if '/migrations/' in path:
        return 'Database migration'
    if p.name == '.gitkeep':
        return 'Directory placeholder'
    if '/scripts/' in path:
        return 'Verification tooling'
    if p.name.startswith('.') or p.suffix == '.json' or p.name.endswith('config.js'):
        return 'Configuration'
    if p.suffix in ['.js', '.jsx', '.css', '.html']:
        return 'Handwritten source'
    return 'Other / inspect'


def capture():
    """Capture every tracked path, provisional origin evidence, and dependency edges."""
    tracked = sorted(filter(None, git('ls-files', '-z').split('\0')))
    untracked = sorted(filter(None, git('ls-files', '--others', '--exclude-standard', '-z').split('\0')))
    old_untracked = [p for p in untracked if not p.startswith(('docs/review/', 'docs/viva/'))]
    dirty = set(filter(None, git('diff', '--name-only', '-z').split('\0')))
    staged = set(filter(None, git('diff', '--cached', '--name-only', '-z').split('\0')))
    hashes = {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest()
              for p in tracked + old_untracked if (ROOT / p).is_file()}
    # Refuse to overwrite the first snapshot on reruns.
    snapshot = EVIDENCE / 'initial-state.json'
    if not snapshot.exists():
        snapshot.write_text(json.dumps({'date': '2026-11-12', 'timezone': 'Asia/Colombo',
            'head': git('rev-parse', 'HEAD').strip(), 'branch': git('branch', '--show-current').strip(),
            'tracked_count': len(tracked), 'unstaged': sorted(dirty), 'staged': sorted(staged),
            'preexisting_untracked': old_untracked, 'sha256': hashes}, indent=2) + '\n', encoding='utf-8')
    (EVIDENCE / 'git-refs.txt').write_text(git('for-each-ref',
        '--format=%(refname:short)|%(objectname)|%(upstream:short)|%(upstream:track)',
        'refs/heads', 'refs/remotes'), encoding='utf-8')
    status_path = EVIDENCE / 'initial-git-status.txt'
    if not status_path.exists():
        entry_lines = [line for line in git('status', '--porcelain=v2', '--branch',
            '--untracked-files=all').splitlines()
            if not any(prefix in line for prefix in ('docs/review/', 'docs/viva/'))]
        status_path.write_text('\n'.join(entry_lines) + '\n', encoding='utf-8')
    rows, origins, dependencies, env_names = [], [], [], collections.defaultdict(set)
    for path in tracked:
        cat = category(path)
        data = (ROOT / path).read_bytes()
        text = '' if cat == 'Binary asset' else data.decode('utf-8', 'replace')
        header = ' | '.join(re.findall(r'(?:@author\s+|--\s*Author:\s*)([^\r\n]+)', text[:4500]))
        # Follow renames and request copy detection; Git records repository introduction,
        # which may be an import/scaffold and is not proof of original human authorship.
        history = git('log', '--follow', '-M', '-C', '--find-copies-harder', '--diff-filter=A',
                      '--format=%H|%aN|%ad', '--date=short', '--', path).strip().splitlines()
        history = [line for line in history if line.strip()]
        origin = history[-1].split('|', 2) if history else ['', 'unknown', '']
        status = 'Provisional Git introduction; human authorship unconfirmed'
        if len(history) > 1:
            status += '; multiple addition candidates'
        if not header and cat in ['Handwritten source', 'Verification tooling', 'Database migration']:
            status += '; no author header detected'
        if path == 'frontend/README.md' or path.endswith(('/react.svg', '/vite.svg')):
            status += '; starter/template provenance'
        if path == 'README.md':
            status += '; initial stub does not establish current document authorship'
        origin_evidence = f'{origin[0][:12]} ({origin[1]}, {origin[2]}); header: {header or "none"}; {status}'
        origins.append({'path': path, 'introduction_commit': origin[0], 'git_author_identity': origin[1],
                        'author_date': origin[2], 'addition_candidates': len(history),
                        'current_author_header': header, 'status': status})
        excluded = {'Binary asset': 'Accounted for; visual relevance later; no comment edits',
                    'Generated cache': 'Generated Vite cache; no manual review/comment edits; hygiene decision pending',
                    'Lockfile': 'Generated dependency resolution; verify consistency, no comment edits',
                    'Directory placeholder': 'Empty directory marker; no behavior to review'}.get(cat, '')
        categories = {
            'Binary asset': 'asset provenance; visual relevance', 'Vector asset': 'asset provenance; accessibility; usage',
            'Generated cache': 'generated-file hygiene', 'Lockfile': 'reproducibility; dependency consistency',
            'Directory placeholder': 'repository structure', 'Documentation': 'implementation accuracy; ownership; viva; secret hygiene',
            'Database migration': 'schema prerequisites; constraints; compatibility; ownership; rollback safety',
            'Configuration': 'environment; security; reproducibility; deployment; ownership',
            'Verification tooling': 'check coverage; safety; failure reporting; commenting; ownership',
        }.get(cat, 'behavior; permissions; validation; error/loading states; commenting; ownership; simplification')
        if path.startswith(('frontend/', 'mobile/')) and cat == 'Handwritten source':
            categories += '; wording; UI consistency; accessibility; platform behavior'
        verification = 'Not executed individually; see BASELINE.md for check scope'
        if path.startswith('backend/') and path.endswith('.js'):
            verification = 'B01 syntax; see evidence/check-results.json for result; runtime unverified'
        elif path.startswith('frontend/') and path.endswith(('.js', '.jsx')):
            verification = 'B02 lint; B03 build scope; see evidence/check-results.json; runtime unverified'
        elif path.startswith('mobile/') and path.endswith('.js'):
            verification = 'B04 Babel parse; see evidence/check-results.json; device/runtime unverified'
        rows.append({'path': path, 'file_category': cat, 'module_or_shared_responsibility': responsibility(path),
            'original_author_evidence_status': origin_evidence, 'applicable_review_categories': categories,
            'review_status': 'Stage 1 inventoried; detailed review pending',
            'documentation_reference': 'docs/review/BASELINE.md; docs/review/OWNERSHIP.md',
            'verification_status': verification, 'exclusion_reason': excluded,
            'git_state_at_start': 'unstaged' if path in dirty else ('staged' if path in staged else 'clean'),
            'sha256_at_start': hashes[path]})
        if path.endswith(('.js', '.jsx')) and cat != 'Generated cache':
            for spec in sorted(set(re.findall(r'''(?:require\(\s*|from\s+|import\s*)['"]([^'"]+)['"]''', text))):
                if spec.startswith('.'):
                    base = (ROOT / path).parent / spec
                    candidates = [base, pathlib.Path(str(base) + '.js'), pathlib.Path(str(base) + '.jsx'), base / 'index.js', base / 'index.jsx']
                    resolved = next((c.resolve().relative_to(ROOT).as_posix() for c in candidates if c.is_file()), 'UNRESOLVED')
                else:
                    resolved = 'external package / built-in'
                dependencies.append({'from_path': path, 'import_specifier': spec, 'resolved_path': resolved})
            for name in re.findall(r'(?:process\.env|import\.meta\.env)\s*\.([A-Z][A-Z0-9_]*)', text):
                env_names[path.split('/')[0] if '/' in path else 'root'].add(name)
    write_csv(OUT / 'FILE_REVIEW_TRACKER.csv', rows, list(rows[0]))
    write_csv(EVIDENCE / 'ownership-history.csv', origins, list(origins[0]))
    write_csv(EVIDENCE / 'source-imports.csv', dependencies, list(dependencies[0]))
    summary = {'tracked_count': len(tracked), 'category_counts': dict(collections.Counter(r['file_category'] for r in rows)),
               'layer_counts': dict(collections.Counter(p.split('/')[0] if '/' in p else 'root' for p in tracked)),
               'unstaged_count': len(dirty), 'staged_count': len(staged), 'preexisting_untracked_count': len(old_untracked),
               'author_header_count': sum(bool(o['current_author_header']) for o in origins),
               'introduction_identity_counts': dict(collections.Counter(o['git_author_identity'] for o in origins)),
               'environment_variable_names_only': {k: sorted(v) for k, v in env_names.items()},
               'unresolved_relative_imports': [d for d in dependencies if d['resolved_path'] == 'UNRESOLVED']}
    (EVIDENCE / 'inventory-summary.json').write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in summary.items() if k != 'environment_variable_names_only'}, indent=2))


if __name__ == '__main__':
    capture()
