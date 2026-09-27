from pathlib import Path
import pdfplumber
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit
F=Path('/Users/rafaelcarbajal/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')
for style in ['Regular','Bold','Italic']:
 pdfmetrics.registerFont(TTFont('LiberationSerif-'+style,str(F/f'LiberationSerif-{style}.ttf')))
out='output/pdf/Rafael_Carbajal_Final_Corrected.pdf'
changes={0:[
(378,398,'Combined 2 rounds of partner research with SPY and St. Joseph Center and usability testing to refine information hierarchy, user privacy, trust signals, and handoffs to official services.'),
(401,421,'Created UI components for Resources across Snap Map, Search, Spotlight, and sharing; presented the prototype and design decisions to 300+ Snap employees.'),
(463,472,'Designed UX/UI for 3 websites, including a B2B specialty coffee brand.'),
(475,495,'Refined Figma layouts with senior designers on a remote team, translating design feedback into website UI.'),
(498,518,'Implemented front-end updates for a client website that launched and recorded a 33% increase in sales.')],1:[
(96,116,"Design and build Blocal's website, focusing on accessibility, clear information architecture, and the user experience."),
(118,140,'Facilitate collaboration between graphic designers and data analysts, and coordinate scheduling for a series of 4 design workshops.') ]}
with pdfplumber.open('/Users/rafaelcarbajal/Desktop/nininini.pdf') as d:
 c=canvas.Canvas(out,pagesize=(612,791.03998));c.setTitle('Rafael Carbajal Sanchez - Final Corrected Resume');c.setAuthor('Rafael Carbajal Sanchez')
 for i,p in enumerate(d.pages):
  H=p.height
  for ch in p.chars:
   if any(lo<=ch['top']<hi for lo,hi,_ in changes[i]):continue
   font=ch['fontname'].split('+')[-1]
   if '-' not in font:font+='-Regular'
   c.setFont(font,ch['size']);c.drawString(ch['matrix'][4],ch['matrix'][5],ch['text'])
  for line in p.lines:
   c.setLineWidth(line['linewidth'] or .5);c.line(line['x0'],line['y0'],line['x1'],line['y1'])
  for r in p.rects:
   c.setLineWidth(r['linewidth'] or .5);c.rect(r['x0'],r['y0'],r['width'],r['height'],stroke=int(r['stroke']),fill=int(r['fill']))
  for curve in p.curves:
   if i==1 and 131<=curve['top']<141:continue
   if curve['width']<5 and curve['height']<5:
    c.circle((curve['x0']+curve['x1'])/2,(curve['y0']+curve['y1'])/2,max(curve['width'],curve['height'])/2,fill=1,stroke=0)
  for lo,hi,txt in changes[i]:
   chars=[ch for ch in p.chars if lo<=ch['top']<hi and ch['x0']>=60]
   baseline=max(ch['matrix'][5] for ch in chars)
   lines=simpleSplit(txt,'LiberationSerif-Regular',8.25,515)
   assert len(lines)<=2
   c.setFont('LiberationSerif-Regular',8.25)
   for n,line in enumerate(lines):c.drawString(61,baseline-11.25*n,line)
  for a in p.hyperlinks:
   if a.get('uri'):c.linkURL(a['uri'],(a['x0'],H-a['bottom'],a['x1'],H-a['top']),thickness=0)
  c.showPage()
 c.save()
with pdfplumber.open(out) as d:
 text='\n'.join(p.extract_text() for p in d.pages)
 assert all(x not in text for x in ['Jakarta','Trade Secret','Confidential Information','Supported 1 website'])
 assert text.lower().count('workshops')==1
 for i,p in enumerate(d.pages):p.to_image(resolution=120).save(f'tmp/pdfs/final-fixed-{i}.png')
 print(text)
