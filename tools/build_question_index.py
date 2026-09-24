"""Resolve stable anchors and generate deterministic question/source navigation."""
import argparse, collections, hashlib, html, json, urllib.parse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REPO='https://github.com/sabareeshrao/Java-Practice-Project/blob/main/'
KINDS={'Direct code','Related code','Procedure','Version lab','Missing'}
def main(check=False):
    source=json.loads((ROOT/'interview/questions.json').read_text(encoding='utf-8'))
    questions=source['questions']
    mappings=json.loads((ROOT/'interview/mappings.json').read_text(encoding='utf-8'))
    ids={str(q['id']) for q in questions}
    assert len(ids)==len(questions)==2308, 'Question count or ID uniqueness changed'
    assert ids==set(mappings), 'Every original question needs exactly one mapping'
    assert sum(q['sheet']=='Additional' for q in questions)==300
    sources={}; rows=[]
    for q in questions:
        mapping=mappings[str(q['id'])]
        assert mapping['kind'] in KINDS and mapping['year'] in range(1,6)
        assert mapping['note'].strip() and mapping['evidence']
        evidence=[]
        for e in mapping['evidence']:
            path=ROOT/e['file']
            assert path.resolve().is_relative_to(ROOT.resolve()), 'Evidence path escapes repository'
            text=path.read_text(encoding='utf-8')
            lines=text.splitlines()
            matches=[i+1 for i,line in enumerate(lines) if e['anchor'] in line]
            assert len(matches)==1, f"Q{q['id']}: anchor must match exactly once: {e} ({matches})"
            line=matches[0]
            sources[e['file']]=text
            evidence.append(dict(e,line=line,sha256=hashlib.sha256(text.encode()).hexdigest()))
        rows.append({**q, **mapping, 'evidence': evidence})
    counts=collections.Counter(row['kind'] for row in rows)
    status='; '.join(f'{kind}: {counts[kind]}' for kind in sorted(KINDS))
    summary=[
        '# Question coverage','',
        f"All **{len(rows):,} questions** are indexed: 2,008 main + 300 Additional.",
        '',status+'.','',
        '**Full implementation of all 2,308 questions is not complete.** Direct code means a specific implementation has been selected; it is not a guarantee that every nuance or integration has an individual test. Related code is explicitly partial. Missing entries have no implementation.',
        '',
        'The initial mappings were bootstrapped from module routes plus curated IDs. Review and improve them one question at a time; do not promote broad topic links to direct evidence.',
        '',
        '| Module | Questions | Direct | Related | Procedure | Version lab | Missing |',
        '|---|---:|---:|---:|---:|---:|---:|']
    for module in dict.fromkeys(q['module'] for q in rows):
        group=[q for q in rows if q['module']==module]; c=collections.Counter(q['kind'] for q in group)
        summary.append('| '+module+' | '+str(len(group))+' | '+' | '.join(str(c[k]) for k in ['Direct code','Related code','Procedure','Version lab','Missing'])+' |')
    summary+=['','## Contribution backlog','','Filter QUESTION_INDEX.html by Related code or Missing. Each row preserves the question and gives a concrete source starting point. Add the missing behavior and a focused test, then refine the mapping.',
        '', '## Verification boundaries','',
        'Default Maven verification covers the Java 21 application and tests. Newer-JDK sources, external infrastructure and procedures have separate prerequisites. See VERIFICATION.md for executed checks.',
        '', '## Source provenance','',f"Workbook SHA-256: {source['sha256']}",'Original workbook and résumé are not redistributed.']
    markdown=['# Interview question → source index','',
        'For search and local line navigation, open QUESTION_INDEX.html. This file links to the main branch on GitHub.',
        '',status+'.','',
        '| ID | Year | Question | Evidence | Kind |',
        '|---|---:|---|---|---|']
    for q in rows:
        links='<br>'.join(f"[{e['file']}:{e['line']}]({REPO}{urllib.parse.quote(e['file'])}#L{e['line']})" for e in q['evidence'])
        question=q['question'].replace('|','&#124;').replace('\n',' ')
        markdown.append(f"| Q{q['id']:04d} | {q['year']} | {question} | {links} | {q['kind']} |")
    payload=json.dumps({'questions':rows,'sources':sources,'counts':dict(counts)},ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    template=(ROOT/'tools/index-template.html').read_text(encoding='utf-8')
    assert template.count('__PAYLOAD__')==1
    outputs={
        'QUESTION_INDEX.html':template.replace('__PAYLOAD__',payload),
        'QUESTION_INDEX.md':'\n'.join(markdown)+'\n',
        'docs/COVERAGE.md':'\n'.join(summary)+'\n',
        'interview/resolved-mappings.json':json.dumps(rows,ensure_ascii=False,indent=2)+'\n'}
    for name,content in outputs.items():
        path=ROOT/name
        if check:
            assert path.exists() and path.read_text(encoding='utf-8')==content, f'Stale generated output: {name}; run tools/build_question_index.py'
        else:
            path.parent.mkdir(parents=True,exist_ok=True);path.write_text(content,encoding='utf-8')
    print(('Checked' if check else 'Generated')+f' {len(rows)} question mappings and {len(sources)} source snapshots. '+status)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true')
    main(parser.parse_args().check)
