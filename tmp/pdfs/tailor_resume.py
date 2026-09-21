from pathlib import Path
import pdfplumber
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit
F=Path('/Users/rafaelcarbajal/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')
for family in ['Sans','Serif']:
 for style in ['Regular','Bold','Italic','BoldItalic']:
  pdfmetrics.registerFont(TTFont(f'Liberation{family}-{style}',str(F/f'Liberation{family}-{style}.ttf')))
source='/Users/rafaelcarbajal/Desktop/Generic_Resume.pdf'
out='output/pdf/Rafael_Carbajal_TikTok_Creative_Design_Intern_2027.pdf'
replacements=[
(222,248,'Led UX for Resources, a Snapchat local-support concept, partnering with engineering and marketing to take an open prompt to a functional prototype in three weeks.'),
(416,442,'Translated Figma designs into an end-to-end React prototype for Pantri, connecting onboarding, meal planning, a digital pantry, and meal completion with simulated purchase and freshness data.'),
(469,495,'Built low- and high-fidelity prototypes to test meal-plan micro-interactions and recovery paths for substitutions, quantity changes, and skipped meals without restarting the weekly plan.'),
(530,555.5,'Designed and deployed Nibble, an AI portfolio assistant with conversational routing and contextual case-study links; handled 250+ visitor questions in its first four weeks.'),
(556,582,'Designed context selection and response states to guide visitors to relevant projects; Vercel reporting showed project views per visit rising from 1.6 to 2.3 in the first four weeks after launch.')]
with pdfplumber.open(source) as d:
 p=d.pages[0];c=canvas.Canvas(out,pagesize=(612,792));c.setTitle('Rafael Carbajal Sanchez - TikTok Creative Design Intern 2027');c.setAuthor('Rafael Carbajal Sanchez')
 for ch in p.chars:
  if 58<=ch['top']<70:continue
  if any(lo<=ch['top']<hi for lo,hi,_ in replacements):continue
  name=ch['fontname'].split('+')[-1]
  if name=='OpenSymbol':
   c.circle(ch['x0']+3,792-ch['top']-5,1.5,stroke=0,fill=1);continue
  if '-' not in name:name+='-Regular'
  c.setFont(name,ch['size']);c.drawString(ch['matrix'][4],ch['matrix'][5],ch['text'])
 c.setFont('LiberationSans-Regular',11)
 subtitle=[ch for ch in p.chars if 58<=ch['top']<70]
 c.drawCentredString(306,subtitle[0]['matrix'][5],'UX / Product Designer | Available June 2027')
 seen=set()
 for line in p.lines:
  key=(line['x0'],line['y0'],line['x1'],line['y1'])
  if key in seen:continue
  seen.add(key);c.setLineWidth(line['linewidth']);c.line(*key)
 for lo,hi,txt in replacements:
  original=[ch for ch in p.chars if lo<=ch['top']<hi and ch['fontname'].endswith('LiberationSans')]
  baseline=max(ch['matrix'][5] for ch in original)
  lines=simpleSplit(txt,'LiberationSans-Regular',11,572.4-67)
  assert len(lines)<=2,(lo,lines)
  c.circle(55.5,baseline+3.2,1.5,stroke=0,fill=1)
  c.setFont('LiberationSans-Regular',11)
  for i,line in enumerate(lines):c.drawString(67,baseline-i*13.97,line)
  print(lo,lines)
 for a in p.hyperlinks:
  if a.get('uri'):c.linkURL(a['uri'],(a['x0'],792-a['bottom'],a['x1'],792-a['top']),relative=0,thickness=0)
 c.showPage();c.save()
with pdfplumber.open(out) as d:
 assert len(d.pages)==1
 p=d.pages[0];p.to_image(resolution=140).save('tmp/pdfs/tailored.png')
 print(p.extract_text())
 print('links',len(p.hyperlinks),'bottom',max(ch['bottom'] for ch in p.chars))
