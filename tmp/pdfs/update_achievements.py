from pathlib import Path
s=Path('tmp/pdfs/corrected.py').read_text()
s=s.replace('Rafael_Carbajal_TikTok_Resume_Corrected.pdf','Rafael_Carbajal_TikTok_Resume_Achievements.pdf').replace('tmp/pdfs/corrected.png','tmp/pdfs/achievements.png')
a="bullet('Created website layouts and UI for a B2B specialty coffee brand in Figma and implemented front-end updates, refining the work with senior designers on a remote team.')"
b="""bullet('Contributed UX/UI design work to 3 websites, including a B2B specialty coffee brand.')
bullet('Created Figma layouts and implemented front-end updates with senior designers on a remote team.')
bullet('Contributed to 1 deployed website that recorded a 33% sales increase.')"""
assert a in s;s=s.replace(a,b)
a=s.index("bullet('Used AI-assisted coding")
b=s.index('y+=6',a)
s=s[:a]+"""bullet('Built a high-fidelity React prototype with 26 interactive screens using Figma and AI-assisted coding, covering onboarding, pantry tracking, meal planning, and completion with simulated data.')
bullet('Interviewed 13 grocery shoppers to shape flows around budgeting, substitutions, and produce selection.')
bullet('Tested Pantri in 3 rounds with 5 participants per round; prototyped recovery paths for substitutions, quantity changes, and skipped meals so users could adjust plans without restarting.')
"""+s[b:]
a=s.index("bullet('Launched an AI portfolio")
b=s.index("section('VOLUNTEER",a)
s=s[:a]+"""bullet('Launched an AI portfolio assistant that answered 250+ visitor questions in its first 4 weeks.')
bullet('Built contextual project routing; project views per visit rose from 1.6 to 2.3 in the first 4 weeks.')
bullet('Guided 52% of Nibble users to recommended project pages through contextual case-study links.')
"""+s[b:]
s=s.replace("bullet('Designing and building the website for Blocal, a Los Angeles organization.')","""bullet('Designing and building the website for Blocal, a Los Angeles organization.')
bullet('Facilitating workshops between graphic designers and data analysts.')""")
Path('tmp/pdfs/achievements.py').write_text(s)
