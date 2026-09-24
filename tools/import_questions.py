"""Read the source workbook without modifying it. Only stdlib is required."""
import argparse, hashlib, json, zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def extract(path):
    with zipfile.ZipFile(path) as book:
        shared=[]
        if 'xl/sharedStrings.xml' in book.namelist():
            shared=[''.join(si.itertext()) for si in ET.fromstring(book.read('xl/sharedStrings.xml'))]
        relationships={el.attrib['Id']:el.attrib['Target'].lstrip('/') for el in ET.fromstring(book.read('xl/_rels/workbook.xml.rels'))}
        workbook=ET.fromstring(book.read('xl/workbook.xml'))
        questions=[]
        for sheet in workbook.find('s:sheets',NS):
            name=sheet.attrib['name']
            if name not in ('2000 Interview Questions','Additional'): continue
            target=relationships[sheet.attrib['{'+NS['r']+'}id']]
            if not target.startswith('xl/'): target='xl/'+target
            for row in ET.fromstring(book.read(target)).findall('.//s:sheetData/s:row',NS):
                if int(row.attrib['r'])==1: continue
                cells={}
                for cell in row:
                    column=''.join(c for c in cell.attrib['r'] if c.isalpha())
                    value=cell.find('s:v',NS)
                    kind=cell.attrib.get('t')
                    if kind=='inlineStr': text=''.join(cell.find('s:is',NS).itertext())
                    elif value is None: continue
                    elif kind=='s': text=shared[int(value.text)]
                    else: text=value.text
                    cells[column]=text
                if not cells.get('I'): continue
                questions.append({'id':int(cells['A']),'master_sequence':int(cells['B']),'sheet':name,
                    'row':int(row.attrib['r']),'level':cells['C'],'domain':cells['D'],'module':cells['E'],
                    'subtopic':cells['F'],'difficulty':cells['G'],'tags':cells.get('H',''),'question':cells['I']})
        assert len(questions)==2308, f'Expected 2308 questions; found {len(questions)}'
        assert len({q['id'] for q in questions})==len(questions)
        return {'source':'Java 2000.xlsx','sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'questions':questions}
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('workbook',type=Path);args=parser.parse_args()
    target=ROOT/'interview/questions.json';target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(extract(args.workbook),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Imported 2308 original questions with sheet and row provenance.')
