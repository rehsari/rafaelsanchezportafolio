from pathlib import Path
import pdfplumber
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
F=Path('/Users/rafaelcarbajal/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')
for suf in ['Regular','Bold','Italic']:
 pdfmetrics.registerFont(TTFont('S'+suf,str(F/f'LiberationSans-{suf}.ttf')))
pdfmetrics.registerFontFamily('SRegular',normal='SRegular',bold='SBold',italic='SItalic')
out='output/pdf/resume-1790031401153-updated.pdf';H=791.03998
c=canvas.Canvas(out,pagesize=(612,H));c.setTitle('Rafael Carbajal Sanchez - Updated Resume');c.setAuthor('Rafael Carbajal Sanchez');y=40

def p(t,font='SRegular',size=8.25,x=40,w=532,after=0):
 global y
 q=Paragraph(t,ParagraphStyle('s',fontName=font,fontSize=size,leading=12))
 _,h=q.wrap(w,1000);q.drawOn(c,x,H-y-h);y+=h+after

def row(t,right='',font='SBold',size=9.75):
 global y
 old=y;p(t,font,size,w=395)
 if right:c.setFont('SRegular',8.25);c.drawRightString(572,H-old-9,right)

def section(t):
 global y
 y+=18
 c.saveState();text=c.beginText(40,H-y-8);text.setFont('SBold',7.5);text.setCharSpace(1.65);text.textOut(t);c.drawText(text);c.restoreState()
 y+=13;c.setLineWidth(1);c.line(40,H-y,572,H-y);y+=10

def bullet(t):
 global y
 old=y;p(t,x=60,w=512,after=2)
 c.setFillColorRGB(0,0,0);path=c.beginPath();path.moveTo(52,H-old-3);path.lineTo(56,H-old-5.5);path.lineTo(52,H-old-8);path.close();c.drawPath(path,fill=1,stroke=0)

with pdfplumber.open('/Users/rafaelcarbajal/Downloads/resume-1790031401153.pdf') as d:
 full='\n'.join(p.extract_text() for p in d.pages)
 summary=full.split('SUMMARY\n')[1].split('\nEDUCATION')[0].replace('\n',' ')
 snap=full.split('▸ ')[1:4]
 snap=[v.split('\nUX Intern')[0].replace('\n',' ').strip() for v in snap]
c.setFont('SRegular',21);c.setFillColorRGB(.2,.2,.2);c.drawString(40,H-61,'RAFAEL CARBAJAL SANCHEZ');c.setFillColorRGB(0,0,0)
y=76;p('UX / Product Designer | Available June 2027',size=9,after=5)
p('<link href="mailto:ra.carbajalsa@gmail.com">ra.carbajalsa@gmail.com</link> · (424) 436-9220 · Los Angeles, CA',after=4)
p('<link href="https://rafaelsanchez.design">rafaelsanchez.design</link> · <link href="https://linkedin.com/in/rafael-carbajal-956485285">linkedin.com/in/rafael-carbajal-956485285</link> · <link href="https://rafaelsanchez.design">rafaelsanchez.design</link>')
section('SUMMARY');p(summary)
section('EDUCATION');row('Bachelor of Science (B.S.), Interaction Design','Santa Monica, CA');p('Santa Monica College · 2027','SItalic',after=3);p('Courses: Google UX Design Certificate, Coursera 2025')
section('PROFESSIONAL EXPERIENCE');row('Design Scholar (Contract)','Jun 2026 - Aug 2026');row('Snap Inc. | Snap Design Academy','Los Angeles, CA','SItalic',8.25);y+=4
for t in snap:bullet(t)
y+=9;row('UX Intern','Mar 2021 - Jan 2022');row('Plataforma Impact','Mexico City, Mexico (Remote)','SItalic',8.25);y+=4
for t in ['Contributed UX/UI design work to 3 websites, including a B2B specialty coffee brand.','Created Figma layouts and implemented front-end updates, collaborating with senior designers and engineering on a remote team.','Supported 1 website launch; the deployed site had a reported 33% sales increase.']:bullet(t)
section('SELECTED DESIGN PROJECTS');row('Pantri','January 2026 - May 2026');y+=4
for t in ['Used AI-assisted coding to build a high-fidelity React prototype with 26 interactive screens, covering onboarding, pantry tracking, meal planning, and completion with simulated data.','Interviewed 13 grocery shoppers in-store to shape flows around budgeting, produce selection, substitutions, and changing routines, using user behavior insights to guide product design decisions.','Tested Pantri in 3 rounds with 5 participants per round; prototyped recovery paths for substitutions, quantity changes, and skipped meals so users could adjust plans without restarting.']:bullet(t)
y+=9;row('Nibble','June 2026 - August 2026');y+=4
for t in ['Launched an AI portfolio assistant with conversational routing and contextual case-study links; handled 250+ visitor questions in its first 4 weeks.','Developed context selection and response states to guide visitors to relevant projects; Vercel reporting showed project views per visit rising from 1.6 to 2.3 in the first 4 weeks after launch.','Guided 52% of Nibble users to recommended project pages through contextual case-study links.']:bullet(t)
print('PAGE1 BOTTOM',y);assert y<760
c.showPage();y=25
section('VOLUNTEER EXPERIENCE');row('UX Designer (Volunteer)','Aug 2026 - Present');row('Blocal','Los Angeles, CA','SItalic',8.25);y+=4
for t in ["Designing and building Blocal's website with a focus on user experience, accessibility, and clear information architecture.",'Facilitating workshops between graphic designers and data analysts.','Coordinating schedules for 4 workshops with designers.']:bullet(t)
section('SKILLS');top=y
for label,items,x,yy in [('Design:',['End-to-end product design','interaction and UI design','high-fidelity prototyping','UI components','user flows','wireframing','information architecture','accessibility'],40,top),('Research:',['User interviews','usability testing','field research','research synthesis'],306,top),('Development:',['AI-assisted coding (vibe coding)','React','JavaScript','HTML/CSS'],40,top+108),('Tools:',['Figma','Claude Code','Adobe Illustrator','Photoshop','InDesign'],306,top+108)]:
 y=yy;p(label,'SBold',x=x,w=260)
 for item in items:p(item,x=x,w=260)
c.showPage();c.save()
with pdfplumber.open(out) as d:
 assert len(d.pages)==2
 text='\n'.join(p.extract_text() for p in d.pages)
 for term in ['33%','26 interactive screens','5 participants','4 workshops','52%']:assert term in text,term
 for i,pg in enumerate(d.pages):pg.to_image(resolution=110).save(f'tmp/pdfs/new-updated-{i}.png')
 print(text)
