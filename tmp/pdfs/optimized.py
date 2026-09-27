from pathlib import Path
import pdfplumber
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit
F=Path('/Users/rafaelcarbajal/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')
for style in ['Regular','Bold','Italic']:
 pdfmetrics.registerFont(TTFont('LiberationSerif-'+style,str(F/f'LiberationSerif-{style}.ttf')))
out='output/pdf/Rafael_Carbajal_TikTok_Optimized.pdf'
changes={0:[
(166,199,'UX/product designer combining user research, interaction design, and AI-assisted development to create high-fidelity consumer app prototypes. Collaborates with design, engineering, and marketing teams; experience includes Snapchat local services, 26 interactive Pantri screens, and a deployed AI portfolio assistant.'),
(355,375,'Led product design for Resources, collaborating with engineering and marketing teams to turn an open prompt into a functional Snapchat local-support prototype in 3 weeks.'),
(401,421,'Created UI components for Resources across Snap Map, Search, Spotlight, and sharing using component-based design; presented the prototype and design decisions to 300+ Snap employees.'),
(475,495,'Refined Figma layouts with the remote design team, translating feedback into website UI and supporting design implementation through technical spec handoff.')],1:[]}

with pdfplumber.open('/Users/rafaelcarbajal/Desktop/nenenne.pdf') as d:
 c=canvas.Canvas(out,pagesize=(612,791.03998));c.setTitle('Rafael Carbajal Sanchez - Final Corrected Resume');c.setAuthor('Rafael Carbajal Sanchez')
 for i,p in enumerate(d.pages):
  H=p.height
  for ch in p.chars:
   if any(lo<=ch['top']<hi for lo,hi,_ in changes[i]):continue
   if i==1 and (96<=ch['top']<117 or (64<=ch['top']<76 and ch['x0']>450)):continue
   shift=12 if i==1 and ch['top']>=135 else 0
   font=ch['fontname'].split('+')[-1]
   if '-' not in font:font+='-Regular'
   c.setFont(font,ch['size']);c.drawString(ch['matrix'][4],ch['matrix'][5]-shift,ch['text'])
  for line in p.lines:
   shift=12 if i==1 and line['top']>=135 else 0
   c.setLineWidth(line['linewidth'] or .5);c.line(line['x0'],line['y0']-shift,line['x1'],line['y1']-shift)
  for r in p.rects:
   shift=12 if i==1 and r['top']>=135 else 0
   c.setLineWidth(r['linewidth'] or .5);c.rect(r['x0'],r['y0']-shift,r['width'],r['height'],stroke=int(r['stroke']),fill=int(r['fill']))
  for curve in p.curves:
   if i==1 and 96<=curve['top']<117:continue
   if curve['width']<5 and curve['height']<5:
    c.circle((curve['x0']+curve['x1'])/2,(curve['y0']+curve['y1'])/2,max(curve['width'],curve['height'])/2,fill=1,stroke=0)
  for lo,hi,txt in changes[i]:
   x=36 if lo==166 else 61
   chars=[ch for ch in p.chars if lo<=ch['top']<hi and ch['x0']>=x]
   baseline=max(ch['matrix'][5] for ch in chars)
   lines=simpleSplit(txt,'LiberationSerif-Regular',8.25,576-x)
   assert len(lines)<=(3 if lo==166 else 2)
   c.setFont('LiberationSerif-Regular',8.25)
   for n,line in enumerate(lines):c.drawString(x,baseline-11.25*n,line)
  if i==1:
   dates=[ch for ch in p.chars if 64<=ch['top']<76 and ch['x0']>450]
   c.setFont('LiberationSerif-Italic',8.25);c.drawRightString(576,max(ch['matrix'][5] for ch in dates),'Aug 2026 - Present')
   base=max(ch['matrix'][5] for ch in p.chars if 96<=ch['top']<105)
   bullets=["Design Blocal's website layouts and information architecture, focusing on accessibility and the user experience.","Build the organization's website, translating design layouts into working web pages.","Facilitate collaboration between graphic designers and data analysts, managing schedules for 4 design workshops."]
   c.setFont('LiberationSerif-Regular',8.25)
   for n,t in enumerate(bullets):
    yy=base-12*n;c.drawString(61,yy,t);c.circle(51.5,yy+2.5,.85,fill=1,stroke=0)
  for a in p.hyperlinks:
   if a.get('uri'):c.linkURL(a['uri'],(a['x0'],H-a['bottom'],a['x1'],H-a['top']),thickness=0)
  c.showPage()
 c.save()
with pdfplumber.open(out) as d:
 text='\n'.join(p.extract_text() for p in d.pages)
 assert all(x not in text for x in ['Jakarta','Trade Secret','Confidential Information','Career Pathing','streaming-adjacent'])
 assert text.lower().count('workshops')==1
 for i,p in enumerate(d.pages):p.to_image(resolution=120).save(f'tmp/pdfs/optimized-{i}.png')
 print(text)
