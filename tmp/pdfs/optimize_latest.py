from pathlib import Path
s=Path('tmp/pdfs/fix_final.py').read_text()
s=s.replace('Rafael_Carbajal_Final_Corrected.pdf','Rafael_Carbajal_TikTok_Optimized.pdf').replace('/Users/rafaelcarbajal/Desktop/nininini.pdf','/Users/rafaelcarbajal/Desktop/nenenne.pdf').replace('tmp/pdfs/final-fixed-','tmp/pdfs/optimized-')
a=s.index('changes=');b=s.index('\nwith pdfplumber.open',a)
s=s[:a]+'''changes={0:[
(166,199,'UX/product designer combining user research, interaction design, and AI-assisted development to create high-fidelity consumer app prototypes. Collaborates with design, engineering, and marketing teams; experience includes Snapchat local services, 26 interactive Pantri screens, and a deployed AI portfolio assistant.'),
(355,375,'Led product design for Resources, collaborating with engineering and marketing teams to turn an open prompt into a functional Snapchat local-support prototype in 3 weeks.'),
(401,421,'Created UI components for Resources across Snap Map, Search, Spotlight, and sharing using component-based design; presented the prototype and design decisions to 300+ Snap employees.'),
(475,495,'Refined Figma layouts with the remote design team, translating feedback into website UI and supporting design implementation through technical spec handoff.')],1:[]}
''' +s[b:]
s=s.replace("if any(lo<=ch['top']<hi for lo,hi,_ in changes[i]):continue", "if any(lo<=ch['top']<hi for lo,hi,_ in changes[i]):continue\n   if i==1 and (96<=ch['top']<117 or (64<=ch['top']<76 and ch['x0']>450)):continue\n   shift=12 if i==1 and ch['top']>=135 else 0")
s=s.replace("ch['matrix'][5],ch['text'])","ch['matrix'][5]-shift,ch['text'])")
s=s.replace("c.setLineWidth(line['linewidth'] or .5);c.line(line['x0'],line['y0'],line['x1'],line['y1'])", "shift=12 if i==1 and line['top']>=135 else 0\n   c.setLineWidth(line['linewidth'] or .5);c.line(line['x0'],line['y0']-shift,line['x1'],line['y1']-shift)")
s=s.replace("c.setLineWidth(r['linewidth'] or .5);c.rect(r['x0'],r['y0'],", "shift=12 if i==1 and r['top']>=135 else 0\n   c.setLineWidth(r['linewidth'] or .5);c.rect(r['x0'],r['y0']-shift,")
s=s.replace("if i==1 and 131<=curve['top']<141:continue", "if i==1 and 96<=curve['top']<117:continue")
s=s.replace("chars=[ch for ch in p.chars if lo<=ch['top']<hi and ch['x0']>=60]", "x=36 if lo==166 else 61\n   chars=[ch for ch in p.chars if lo<=ch['top']<hi and ch['x0']>=x]")
s=s.replace("8.25,515)","8.25,576-x)").replace('assert len(lines)<=2','assert len(lines)<=(3 if lo==166 else 2)').replace('c.drawString(61,baseline-11.25*n,line)','c.drawString(x,baseline-11.25*n,line)')
s=s.replace('  for a in p.hyperlinks:', '''  if i==1:
   dates=[ch for ch in p.chars if 64<=ch['top']<76 and ch['x0']>450]
   c.setFont('LiberationSerif-Italic',8.25);c.drawRightString(576,max(ch['matrix'][5] for ch in dates),'Aug 2026 - Present')
   base=max(ch['matrix'][5] for ch in p.chars if 96<=ch['top']<105)
   bullets=["Design Blocal's website layouts and information architecture, focusing on accessibility and the user experience.","Build the organization's website, translating design layouts into working web pages.","Facilitate collaboration between graphic designers and data analysts, managing schedules for 4 design workshops."]
   c.setFont('LiberationSerif-Regular',8.25)
   for n,t in enumerate(bullets):
    yy=base-12*n;c.drawString(61,yy,t);c.circle(51.5,yy+2.5,.85,fill=1,stroke=0)
  for a in p.hyperlinks:''')
s=s.replace("assert all(x not in text for x in ['Jakarta','Trade Secret','Confidential Information','Supported 1 website'])", "assert all(x not in text for x in ['Jakarta','Trade Secret','Confidential Information','Career Pathing','streaming-adjacent'])")
Path('tmp/pdfs/optimized.py').write_text(s)
