from pathlib import Path
import pdfplumber
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
F=Path('/Users/rafaelcarbajal/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')
for fam in ['Sans','Serif']:
 for suffix in ['Regular','Bold','Italic','BoldItalic']:
  pdfmetrics.registerFont(TTFont(f'{fam}-{suffix}',str(F/f'Liberation{fam}-{suffix}.ttf')))
 pdfmetrics.registerFontFamily(f'{fam}-Regular',normal=f'{fam}-Regular',bold=f'{fam}-Bold',italic=f'{fam}-Italic',boldItalic=f'{fam}-BoldItalic')
out='output/pdf/Rafael_Carbajal_TikTok_Resume_Achievements.pdf'
c=canvas.Canvas(out,pagesize=(612,792));c.setTitle('Rafael Carbajal Sanchez - TikTok Creative Design Intern');c.setAuthor('Rafael Carbajal Sanchez')
L,R=39.7,572.4; y=34

def para(text,font='Sans-Regular',size=11,leading=13.4,x=L,width=None,after=0):
 global y
 p=Paragraph(text,ParagraphStyle('p',fontName=font,fontSize=size,leading=leading,textColor='black'))
 w,h=p.wrap(width or R-x,1000);p.drawOn(c,x,792-y-h);y+=h+after
 return h

def row(left,right='',font='Serif-Regular',size=11):
 global y
 para(left,font,size,13.6,width=420)
 if right:
  c.setFont('Serif-Regular',11);c.drawRightString(R,792-y+2.4,right)

def section(t):
 global y
 y+=4
 para(t,'Serif-Italic',11,13)
 c.setLineWidth(.75);c.line(L,792-y-1,R,792-y-1);y+=5

def bullet(t):
 global y
 base=y
 para(t,x=67,width=R-67,leading=13.4)
 c.setFont('Sans-Regular',11);c.drawString(53,792-base-10.1,'•')

c.setFont('Serif-Bold',19);c.drawCentredString(306,743,'RAFAEL CARBAJAL SANCHEZ')
c.setFont('Sans-Regular',11);c.drawCentredString(306,725,'UX / Product Designer | Available June 2027')
contact='ra.carbajalsa@gmail.com | (424) 436-9220 | Los Angeles, CA'
c.drawCentredString(306,711,contact)
y=89
para('<b>LinkedIn:</b> <u><link href="https://linkedin.com/in/rafael-carbajal-956485285">linkedin.com/in/rafael-carbajal-956485285</link></u>',width=345)
y=89
para('<b>Portfolio:</b> <u><link href="https://rafaelsanchez.design">rafaelsanchez.design</link></u>',x=416,width=R-416)
c.linkURL('mailto:ra.carbajalsa@gmail.com',(156,708,281,721),thickness=0)
section('SUMMARY')
para('UX/product designer combining user research, UI design, and AI-assisted coding to build high-fidelity consumer app prototypes. Experience includes Snapchat local services and a deployed AI assistant.')
section('EDUCATION')
row('<b>Santa Monica College</b> - <i>Santa Monica, CA</i>','Expected June 2027',size=11.5)
para('Bachelor of Science (B.S.) in Interaction Design','Serif-Regular',11,13.6)
row('Google UX Design Certificate, Coursera','2025')
section('PROFESSIONAL EXPERIENCE')
row('<b>Snap Inc. | Snap Design Academy</b> - <i>Los Angeles, CA</i>',size=11.5)
row('<b>Design Scholar (Contract)</b>','Jun - Aug 2026')
bullet('Led UX for Resources, a Snapchat local-support concept, partnering with engineering and marketing to take an open prompt to a functional prototype in 3 weeks.')
bullet('Conducted 2 rounds of partner research and feedback with SPY and St. Joseph Center; combined findings with usability testing to refine hierarchy, privacy, and service handoffs.')
bullet('Created UI components for Resources across Snap Map, Search, Spotlight, and sharing; presented the prototype and design decisions to 300+ Snap employees.')
y+=6
row('<b>Plataforma Impact</b> - <i>Mexico City, Mexico (Remote)</i>',size=11.5)
row('<b>UX Intern</b>','Mar 2021 - Jan 2022')
bullet('Contributed UX/UI design work to 3 websites, including a B2B specialty coffee brand.')
bullet('Created Figma layouts and implemented front-end updates with senior designers on a remote team.')
bullet('Supported 1 website launch; the deployed site recorded a reported 33% sales increase.')
section('SELECTED DESIGN PROJECTS')
row('<b>Pantri</b> | Grocery Planning App','Spring 2026',size=11.5)
bullet('Built a high-fidelity React prototype with 26 interactive screens using Figma and AI-assisted coding, covering onboarding, pantry tracking, meal planning, and completion with simulated data.')
bullet('Interviewed 13 grocery shoppers to shape flows around budgeting, substitutions, and produce selection.')
bullet('Tested Pantri in 3 rounds with 5 participants per round; prototyped recovery paths for substitutions, quantity changes, and skipped meals so users could adjust plans without restarting.')
y+=6
row('<b>Nibble</b> | AI Portfolio Assistant','Summer 2026',size=11.5)
bullet('Launched an AI portfolio assistant that answered 250+ visitor questions in its first 4 weeks.')
bullet('Built contextual project routing; project views per visit rose from 1.6 to 2.3 in the first 4 weeks.')
bullet('Guided 52% of Nibble users to recommended project pages through contextual case-study links.')
section('VOLUNTEER EXPERIENCE')
row('<b>Blocal</b> - <i>Los Angeles, CA</i>','Aug 2026 - Present',size=11.5)
row('<b>UX Designer (Volunteer)</b>')
bullet('Designing and building the website for Blocal, a Los Angeles organization.')
bullet('Facilitating workshops between graphic designers and data analysts.')
bullet('Coordinating schedules for 4 workshops with designers.')
section('SKILLS')
para('<b>Design:</b> End-to-end product design, interaction and UI design, high-fidelity prototyping, UI components, user flows, wireframing, information architecture, accessibility')
para('<b>Research:</b> User interviews, usability testing, field research, research synthesis')
para('<b>Development:</b> AI-assisted coding (vibe coding), React, JavaScript, HTML/CSS')
para('<b>Tools:</b> Figma, Claude Code, Adobe Illustrator, Photoshop, InDesign')
assert y<764,y
c.showPage();c.save();print('BOTTOM',y)
with pdfplumber.open(out) as d:
 assert len(d.pages)==1
 p=d.pages[0];p.to_image(resolution=135).save('tmp/pdfs/achievements.png')
 print(p.extract_text());print('LINKS',len(p.hyperlinks))
