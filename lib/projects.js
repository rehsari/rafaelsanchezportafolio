/* ═══════════════════════════════════════════════════════════════════════════
   NIBBLE-LM PROJECT BRAIN
   Structured knowledge base for the portfolio assistant.
   Every field is grounded in what's on rafaelsanchez.design.
   Use `null` when data is genuinely absent. Never invent.

   When adding a new project:
   1. Add its slug + PROJECTS entry to index.html
   2. Add a matching entry below with the same slug as `id`
   3. Redeploy
═══════════════════════════════════════════════════════════════════════════ */

export const PROJECTS_BRAIN = [
  {
    id: "herway",
    title: "HER—WAY",
    one_liner: "A community-based transit safety app for low-income women where safety comes from being surrounded by people who understand the same concerns, not from external systems.",
    type: ["interaction design", "ux design", "service design"],
    year: 2025,
    duration: "16 weeks",
    role: ["UX / UI Designer"],
    team: null,
    tools: ["Figma", "Adobe CC"],
    context: "Academic Mobility Project, Fall 2025",
    problem: "Generic transit apps don't account for gender. For low-income women, public transportation isn't just inconvenient, it's unsafe. Safety depends on clarity about threats and the perception of who else is around, both shaped by what users hear indirectly rather than actual risk alone.",
    approach: [
      "On-device identity verification so documents are checked locally and never stored",
      "Community-first safety model where riders share real-time alerts and connect with others on the same route",
      "Safety-weighted routing that prioritizes feeling safe and socially present over speed",
      "Flexible screen structure so users can move through the app without being forced into one flow"
    ],
    key_decisions: [
      { decision: "Made community the safety layer instead of institutions", reason: "Real safety for this user group comes from being surrounded by people with shared concerns, not from external authorities" },
      { decision: "Routed by safety, not shortest path", reason: "Feeling safe matters more than saving three minutes" },
      { decision: "Kept ID and face verification local-only", reason: "Community had to be gated for trust, but storing biometric data would break the same trust it was meant to build" }
    ],
    outcomes: [
      { claim: "Functional prototype that reframes the commute from a source of stress into something community-supported", metric: null }
    ],
    challenges: [
      "Designing for concerns Rafael doesn't personally experience required stepping outside his assumptions",
      "Balancing gated community access with privacy expectations"
    ],
    reflection: [
      "Listening became central. Understanding where concerns come from even when they aren't obvious.",
      "Changed how he thinks about safety, not just reducing risk but how an experience feels in the moment."
    ],
    skills_proven: ["ux research", "interaction design", "service design", "accessibility design", "privacy-first design", "community design"],
    adjacent_skills: ["systems thinking", "product strategy", "trust and safety"],
    not_demonstrated: ["shipped native mobile app", "large-scale user base"],
    interesting_details: [
      "The core insight was that safety in this context is shaped more by perception of who's around than by actual risk data",
      "Rafael intentionally designed for a user group whose experience he doesn't share, which pushed the project's research phase harder than usual"
    ]
  },

  /* PARTIAL — Overview, Context and the first of three final artifacts are written.
     Videos 2 and 3 and the research/testing visuals are still pending. */
  {
    id: "resources",
    title: "RESOURCES ON SNAPCHAT",
    one_liner: "A Snapchat feature that connects users with nearby support organizations by starting from the problem someone recognizes rather than the name of a program they would have to already know.",
    type: ["product strategy", "interaction design", "prototyping"],
    year: 2026,
    duration: "3-week sprint",
    role: ["UX Designer"],
    team: "Alex Nguyen, Daniel Lee, Lezette Flores, Vita Medina",
    tools: ["Figma", "Adobe CC"],
    context: "Snap Inc. contractor · Snap Design Academy, Summer 2026",
    problem: "Local support already exists at scale but people do not know it is there. In 2025 the U.S. 211 network made 19 million referrals across housing, food, utilities, mental health and legal support. Discovery, not supply, was the gap.",
    approach: [
      "Used Snap Map as the surface because 450M+ people already use it monthly and it is built around people, places and discovery",
      "Organized support by broad social issue first, then let users narrow into specific types of help, so no one needs to know an organization's name to start",
      "Opened a simplified organization page inside Snapchat surfacing what the org provides, who it may help and how to contact it",
      "Added testimonials from people who used a resource as a human signal, deliberately not framed as ratings",
      "Grounded the concept in two rounds of conversations with S.P.Y. and St. Joseph Center, first to generate directions and then to test the feature",
      "Tested the experience with users throughout the sprint"
    ],
    key_decisions: [
      { decision: "Started from the need rather than the organization", reason: "Expecting someone to know the name of a program or organization assumes knowledge the person in need usually does not have" },
      { decision: "Used housing security as the primary scenario", reason: "It intersects with many other needs, making it a useful way to pressure-test a system meant to scale beyond one issue" },
      { decision: "Designed testimonials as testimony, not ratings", reason: "A rating turns support organizations into ranked services; a testimonial adds a human signal to information that otherwise feels institutional" },
      { decision: "Built the feature natively into Snapchat instead of as a separate destination", reason: "The value came from meeting people on a surface they already use, not from making them go somewhere new" }
    ],
    outcomes: [
      { claim: "Moved from an open prompt to a functional prototype in three weeks", metric: null },
      { claim: "Presented live to Snap employees", metric: "300+" }
    ],
    challenges: null,
    reflection: null,
    skills_proven: ["product strategy", "interaction design", "prototyping", "cross-functional collaboration", "stakeholder research"],
    adjacent_skills: ["service design", "information architecture", "social impact design"],
    not_demonstrated: ["shipped production feature", "public launch", "measured referral outcomes"],
    interesting_details: [
      "The premise was that the support already exists and the design problem was visibility, not provision",
      "The concept was validated with real service providers, S.P.Y. and St. Joseph Center, rather than only with end users",
      "Worked across design, engineering and marketing inside a three-week sprint at Snap"
    ]
  },

  {
    id: "pixelgame",
    title: "CALLISTO'S ASCENT",
    one_liner: "A narrative retro platformer built entirely around a single visual decision (red and black) that prioritizes world-building and atmosphere over complex mechanics.",
    type: ["game design", "concept art", "interaction design", "visual identity"],
    year: null,
    duration: "Ongoing",
    role: ["UX Designer", "Concept Artist"],
    team: "Solo, seeking collaborators",
    tools: ["Figma", "Unreal", "After Effects", "ChatGPT", "Procreate"],
    context: "Personal Project",
    problem: "An ambitious game concept quickly hit scope creep. Complex systems and mechanics weren't feasible as a solo project across art, design, and code.",
    approach: [
      "Shifted focus to a small, complete demo that communicates through visuals, tone, and interaction",
      "All art made by hand in Procreate using pixel-texture brushes",
      "Story conveyed through environment and color rather than complex mechanics",
      "SNES-style aesthetic locked as the visual anchor"
    ],
    key_decisions: [
      { decision: "Scoped down from a full game to a complete demo", reason: "A finished small thing is more valuable than an unfinished big thing" },
      { decision: "Let visuals carry the experience", reason: "With limited space for mechanics, environment, color, and movement became the main communication tools" },
      { decision: "Locked palette to red and black", reason: "A single strong visual decision gave the whole project coherence with almost no overhead" }
    ],
    outcomes: [
      { claim: "Visual identity and all assets fully developed", metric: null },
      { claim: "Playable prototype in progress", metric: null }
    ],
    challenges: [
      "Solo scope across art, code, and design made every ambitious feature a tradeoff",
      "Features had to be simplified or cut to prioritize finishing"
    ],
    reflection: [
      "Working within constraints made each decision more intentional.",
      "Ideas grow beyond what's realistic quickly. Stepping back to focus on what can be built well is a skill in itself.",
      "Opening the project to collaborators instead of keeping it fully individual is the way it grows further."
    ],
    skills_proven: ["game design", "concept art", "pixel art", "character design", "creative direction", "world building"],
    adjacent_skills: ["creative coding", "systems thinking", "narrative design"],
    not_demonstrated: ["shipped commercial game", "team leadership", "game engine programming at production scale"],
    interesting_details: [
      "The whole visual identity leans on a single color decision that removes a huge class of downstream choices",
      "Juno Merced (see her own entry) is the main character concept for this project"
    ]
  },

  {
    id: "quickqueue",
    title: "QUICK QUEUE",
    one_liner: "A universal queueing app that makes wait time visible so people can decide whether to stay, leave, or plan around waiting instead of losing their spot.",
    type: ["interaction design", "ux design", "product design", "visual identity"],
    year: null,
    duration: "3 weeks",
    role: ["UX / Product Designer"],
    team: null,
    tools: ["Figma", "Principle"],
    context: "Product Design Case Study",
    problem: "Waiting in line at the DMV, stores, and services is dead time. People can't step away, take calls, or grab food without losing their spot. Existing solutions handle specific contexts like banks or Disney parks, but no one designed for the general queue.",
    approach: [
      "Idea came from sitting at the DMV, focused on real needs in the actual moment",
      "Prioritized time visibility over just showing position in line",
      "Studied food ordering and delivery apps to make transitions feel natural",
      "Added a lock screen widget inspired by ride-sharing so users don't need to open the app",
      "Included Q-Points, a gamification layer that turns idle time into something earned"
    ],
    key_decisions: [
      { decision: "Framed the product around visible wait time, not queue position", reason: "The real problem wasn't waiting, it was uncertainty about when the wait would end" },
      { decision: "Added a lock screen widget", reason: "At-a-glance tracking removes the need to open the app during the actual wait" },
      { decision: "Introduced Q-Points gamification", reason: "Emerged from user feedback that idle time felt wasted without any payoff" }
    ],
    outcomes: [
      { claim: "72% of DMV visitors found it very or somewhat useful", metric: "72%" },
      { claim: "80% responded positively to the concept", metric: "80%" },
      { claim: "Tested with 20 real DMV visitors", metric: "20 users" }
    ],
    challenges: [
      "No prior category to reference for a universal queue product"
    ],
    reflection: [
      "Design is about finding solutions, which starts with understanding what people are actually going through.",
      "Small decisions in flow and structure have big impact on everyday tools."
    ],
    skills_proven: ["ux research", "user testing", "interaction design", "gamification design", "visual identity", "typography"],
    adjacent_skills: ["product design", "widget design", "native mobile patterns"],
    not_demonstrated: ["shipped consumer app", "backend systems", "engineering handoff"],
    interesting_details: [
      "The idea came from a real DMV visit, not a brief",
      "User feedback directly produced two of the shipped features (the widget and Q-Points)"
    ]
  },

  {
    id: "shiroiblock",
    title: "SHIROI BLACK",
    one_liner: "A fashion brand identity built on contrast, where blackletter typography drawn by hand meets atmospheric photography and 3D garment visualization.",
    type: ["visual identity", "brand design", "typography"],
    year: null,
    duration: "3 weeks",
    role: ["Visual Designer"],
    team: null,
    tools: ["Blender", "Adobe InDesign", "Photoshop", "Illustrator", "Procreate", "Calligraphy Tools"],
    context: "Visual Identity project",
    problem: "A personal interest in blackletter typography needed direction. How to make hand-drawn gothic letterforms into more than a lettering exercise, and how to combine typography, photography, and 3D into a single cohesive brand.",
    approach: [
      "Started with hand-drawn gothic letterforms using a fountain pen",
      "In-studio photography for tone and texture",
      "3D garment visualization in Blender to treat the identity as objects, not flat visuals",
      "System built across Photoshop, InDesign, Procreate, and Blender"
    ],
    key_decisions: [
      { decision: "Started from personal interest instead of a market brief", reason: "Following instinct before knowing where it leads produced more interesting results than starting from a target audience" },
      { decision: "Preserved the irregularities in hand-drawn strokes", reason: "The roughness gave the brand personality that refined lettering would have flattened" },
      { decision: "Moved into 3D", reason: "To treat the identity as objects in different formats rather than flat visuals on a page" }
    ],
    outcomes: [
      { claim: "72% of testers said they would wear the designs", metric: "72%" },
      { claim: "80% responded to the typography-photography fusion", metric: "80%" },
      { claim: "Tested with 20 people across four groups", metric: "20 users" }
    ],
    challenges: [
      "Creative freedom without a brief meant constraints had to be self-imposed",
      "Getting multiple disciplines (typography, photography, 3D) to feel cohesive required more iteration than expected"
    ],
    reflection: [
      "Design doesn't follow a straight path. The most interesting outcomes come from following instinct before knowing where it leads.",
      "Creative freedom is harder in a different way. No constraints means having to create your own."
    ],
    skills_proven: ["brand identity", "typography", "hand lettering", "photography", "art direction", "3D design", "visual systems"],
    adjacent_skills: ["fashion design", "packaging design"],
    not_demonstrated: ["client brand work", "production fashion manufacturing", "retail rollout"],
    interesting_details: [
      "The lettering was drawn by hand with a fountain pen before any digital work",
      "Rafael intentionally preserved imperfections that most designers would clean up"
    ]
  },

  {
    id: "junomerced",
    title: "JUNO MERCED",
    one_liner: "Character concept art for a 19-year-old Vanguard recruit whose incomplete sense of self is intentionally reflected in armor that's functional but not yet fully hers.",
    type: ["illustration", "concept art", "character design"],
    year: 2024,
    duration: null,
    role: ["Concept Artist"],
    team: null,
    tools: ["Procreate", "Photoshop"],
    context: "Character concept art for Callisto's Ascent",
    problem: "Needed to design a character whose visual language would communicate an in-between state. Capable but uncertain. Someone still figuring out who they are.",
    approach: [
      "Front and back turnarounds to lock silhouette",
      "Facial studies to anchor expression range",
      "Armor design that reads as functional but not yet fully hers"
    ],
    key_decisions: [
      { decision: "Made every design choice serve the in-between state", reason: "Character psychology had to be visible in the form itself, not just the backstory" }
    ],
    outcomes: [
      { claim: "Character visual identity established with clear turnarounds and facial anchors for the broader Callisto's Ascent project", metric: null }
    ],
    challenges: null,
    reflection: null,
    skills_proven: ["character design", "illustration", "concept art", "visual storytelling"],
    adjacent_skills: ["world building", "character animation reference"],
    not_demonstrated: ["character rigging", "3D character modeling", "animation"],
    interesting_details: [
      "The character's incompleteness is embedded in the armor design, not just her backstory"
    ]
  },

  {
    id: "velisar",
    title: "VELISAR",
    one_liner: "A generative art piece simulating wind cycles on a fictional desert planet, where five atmospheric phases transition using different interpolation strategies to create the feeling of settling versus building.",
    type: ["creative coding", "generative design", "interactive art"],
    year: null,
    duration: "2 weeks",
    role: ["Creative Coder"],
    team: null,
    tools: ["p5.js", "Perlin Noise", "Particle Systems"],
    context: "Generative Art: Sandwind Calendar",
    problem: "Creating a generative art experience that feels organic and responds to user interaction while maintaining visual coherence across multiple independent systems.",
    approach: [
      "Single configuration array defines five Drifts (phases) with sky color, particle density, wind speed, glitter intensity",
      "Three visual systems (wind ribbons, sand particles, glitter crystals) run independently using Perlin noise flow fields",
      "Color and atmosphere use eased interpolation to feel like settling",
      "Wind speed uses linear interpolation to feel like building pressure",
      "Clicking creates a pressure wave that expands outward and pushes ribbons"
    ],
    key_decisions: [
      { decision: "Used different interpolation strategies for different atmospheric properties", reason: "Eased for settling and linear for building pressure creates distinct emotional textures within one piece" },
      { decision: "Ran three visual systems independently without cross-talk", reason: "Independent systems layered over the same time base produce coherence without coupling" },
      { decision: "Made the whole piece config-driven", reason: "Adding a new phase becomes a data change, not a code change" }
    ],
    outcomes: [
      { claim: "Interactive generative art piece with 5 explorable wind phases and mouse-disturbed particle systems", metric: null }
    ],
    challenges: null,
    reflection: null,
    skills_proven: ["creative coding", "generative design", "particle systems", "p5.js", "procedural generation", "interactive art"],
    adjacent_skills: ["motion design", "shader concepts", "tool architecture"],
    not_demonstrated: ["WebGL shaders", "production-scale generative work", "3D generative"],
    interesting_details: [
      "Three visual systems run in parallel and never talk to each other on purpose",
      "The distinction between eased and linear interpolation is doing all the emotional work"
    ]
  },

  {
    id: "flipsketch",
    title: "FLIPSKETCH",
    one_liner: "A browser drawing tool inspired by Flipnote Studio that captures lo-fi hand-drawn aesthetics through a jitter system that gives strokes the quality of traditional animation cels.",
    type: ["creative coding", "tool design", "interaction design"],
    year: null,
    duration: "2 weeks",
    role: ["Creative Coder", "Tool Designer"],
    team: null,
    tools: ["p5.js", "Custom Bitmap Font Renderer"],
    context: "Drawing tool with Fibonacci UI System",
    problem: "Creating a drawing tool that feels analog and hand-made rather than digital, capturing the raw aesthetic of Flipnote Studio without external drawing libraries.",
    approach: [
      "Custom jitter system built entirely in p5.js",
      "Every stroke gets a tiny random offset that refreshes every four frames",
      "Offset stays consistent within a single frame across the whole canvas, then jumps",
      "Minimal toolbar, paper-textured canvas, color options via keyboard (B/G/W, R for rainbow)"
    ],
    key_decisions: [
      { decision: "Used a shared random seed that advances on fixed intervals", reason: "The stepped rhythm makes output feel like animation frames instead of smooth digital lines" },
      { decision: "Kept the toolbar minimal and paper-textured", reason: "The interface had to disappear so the aesthetic could carry the experience" },
      { decision: "Skipped external drawing libraries", reason: "Building the renderer from scratch was the only way to get the exact stepped-jitter feel" }
    ],
    outcomes: [
      { claim: "Interactive drawing tool with customizable colors and the distinctive lo-fi aesthetic of hand-drawn animation", metric: null }
    ],
    challenges: null,
    reflection: null,
    skills_proven: ["creative coding", "tool design", "p5.js", "custom rendering", "generative systems", "interaction design"],
    adjacent_skills: ["animation", "bitmap graphics", "UI micro-interactions"],
    not_demonstrated: ["production tool shipping", "plugin architecture", "cross-browser optimization"],
    interesting_details: [
      "The whole aesthetic comes from one technical decision: a shared random seed that jumps every four frames",
      "No external drawing library was used, the renderer is built from scratch in p5.js"
    ]
  },

  {
    id: "cloudcup",
    title: "CLOUDCUP 2.0",
    one_liner: "A redesign of a specialty coffee brand for in-flight use, where the same brief from three years ago gets approached with better understanding of audience, hierarchy, and intent.",
    type: ["visual identity", "brand design", "ux design", "web design"],
    year: null,
    duration: "5 weeks",
    role: ["Visual Designer", "UI Designer"],
    team: null,
    tools: ["Figma", "Adobe Illustrator"],
    context: "Visual Identity and Website Redesign",
    problem: "Airplane coffee fails because cabin pressure and humidity aren't considered in typical coffee design. CloudCup is a specialty brand made for in-flight use. The original design felt unfinished despite having the right idea.",
    approach: [
      "B2B pitch site structured as a designed argument, not a store",
      "Site architecture follows procurement flow: Hero, Problem, Blends, Program, Proof, Ask",
      "Deep teal with gold accents, avoiding obvious aviation references while feeling premium and technical",
      "Logo doubles as espresso swirl, cup ring, or airplane shape",
      "Rebuilt under the same PRD from three years ago to measure improvement"
    ],
    key_decisions: [
      { decision: "Rebuilt under the same original constraints", reason: "Using the same brief made the difference in understanding visible instead of hidden by scope changes" },
      { decision: "Removed the AI-generated visuals from the original brief", reason: "They looked uncanny and unprofessional for a B2B audience, replaced with grounded shapes and real images" },
      { decision: "Structured the site as an argument rather than a catalog", reason: "The goal is to convince airlines to partner, not to sell cups, so information order matters more than content volume" }
    ],
    outcomes: [
      { claim: "Premium, structured site that presents a clear business case for airline partnership", metric: null }
    ],
    challenges: [
      "Resisting the urge to add more content and focusing on what to remove"
    ],
    reflection: [
      "Less about the final result and more about the difference between now and three years ago.",
      "Design is not about adding more but knowing what to remove.",
      "The difference isn't style, it's how the problem is understood."
    ],
    skills_proven: ["brand identity", "ux design", "visual hierarchy", "B2B design", "logo design", "web design", "information architecture"],
    adjacent_skills: ["product strategy", "service design", "content design"],
    not_demonstrated: ["shipped commercial product", "manufacturing", "in-flight service deployment"],
    interesting_details: [
      "The whole project is an intentional rebuild of the same brief three years later to measure growth",
      "The logo is designed to read three different ways depending on context"
    ]
  },

  {
    id: "signify",
    title: "SIGNIFY AR",
    one_liner: "An on-device AR system that recognizes American Sign Language gestures and translates them, making communication accessible without an interpreter or external server.",
    type: ["interaction design", "accessibility design", "creative coding"],
    year: null,
    duration: "4 weeks",
    role: ["UX Designer", "Developer"],
    team: null,
    tools: ["Figma", "Claude Code", "Illustrator", "MediaPipe", "JavaScript"],
    context: "Accessibility, ASL Translation",
    problem: "Over 10 million people in the US live with speech, voice, or language disorders. Many rely on ASL, which most people don't understand. Interpreters cost $50-$150 per hour. Interactions that take seconds for most people require planning or get avoided entirely.",
    approach: [
      "Hand tracking system built with MediaPipe and JavaScript, running entirely on-device",
      "Started as a playful hand-tracking experiment, pivoted to accessibility once the application became clear",
      "Scope reduced to a smaller stable set of gestures, prioritizing consistency over range",
      "Expanded beyond signing to include live translation and transcription for different contexts"
    ],
    key_decisions: [
      { decision: "Kept the model local instead of using a server", reason: "Accessibility tools should work offline, protect data, and feel immediate without server delays interrupting communication flow" },
      { decision: "Narrowed scope to fewer, more reliable gestures", reason: "Reliability matters more than range in communication, an unreliable translator is worse than a limited one" },
      { decision: "Started with a playful experiment before locking direction", reason: "Starting without a fixed outcome let the interaction guide development toward the accessibility application" },
      { decision: "Expanded beyond signing into translation and transcription", reason: "User feedback showed the same interaction pattern was useful across multiple communication contexts" }
    ],
    outcomes: [
      { claim: "On-device gesture recognition system with live translation and transcription capabilities", metric: null },
      { claim: "Prototype complete with clear direction for next steps", metric: null }
    ],
    challenges: [
      "Approaching communication as a system to optimize didn't fit how ASL actually works",
      "ASL is continuous, expressive, and shaped by context in ways hard to reduce to discrete gestures"
    ],
    reflection: [
      "Realized he was approaching communication too much like a system to optimize.",
      "ASL doesn't fit that mindset. It's continuous, expressive, shaped by context.",
      "Not just a tool that translates, but an interaction that respects how communication already happens."
    ],
    skills_proven: ["accessibility design", "interaction design", "ux design", "on-device machine learning integration", "gesture recognition", "prototyping"],
    adjacent_skills: ["computer vision", "native mobile", "AR interaction patterns"],
    not_demonstrated: ["shipped accessibility product", "clinical validation", "ML model training from scratch"],
    interesting_details: [
      "The project started as a playful hand-tracking experiment before pivoting to accessibility",
      "The whole system runs on-device, which is unusual for gesture recognition and is a deliberate accessibility choice",
      "Built partly with Claude Code, which shows Rafael's willingness to use AI tools in his own workflow"
    ]
  },

  {
    id: "glitterbomb",
    title: "GLITTERBOMB Y2K",
    one_liner: "A 3D character inspired by late 90s and early 2000s console games, featuring chunky geometry, oversaturated color, and CRT screen distortion applied in post.",
    type: ["3D design", "character design", "illustration"],
    year: 2026,
    duration: null,
    role: ["3D Artist"],
    team: null,
    tools: ["Blender", "Procreate"],
    context: "3D Character Design and Rendering",
    problem: "Creating a 3D character that captures the specific visual language of an era (chunky geometry, oversaturated colors, characteristic attitude) while maintaining readable silhouette and proportions.",
    approach: [
      "Concept locked on paper in Procreate before moving into geometry",
      "Blender modeling using readable shapes and exaggerated proportions matching that era",
      "UV unwrapped and textured in Procreate, brought back into Blender",
      "Final render styled after old CRT screens with color fringing, film grain, and bleed in post"
    ],
    key_decisions: [
      { decision: "Locked silhouette on paper before touching 3D", reason: "Decisions made in geometry are much harder to change than decisions made on paper" },
      { decision: "Matched design logic to the reference era instead of updating it", reason: "Adding modern sophistication would break the very thing that makes it read as Y2K" },
      { decision: "Added CRT distortion in post rather than in-shader", reason: "Post-processing gave finer control over the exact visual noise texture" }
    ],
    outcomes: [
      { claim: "Fully rendered 3D character with distinctive Y2K aesthetic and CRT post-processing effects", metric: null }
    ],
    challenges: null,
    reflection: null,
    skills_proven: ["3D modeling", "character design", "texturing", "concept art", "post-processing", "visual effects"],
    adjacent_skills: ["rigging concepts", "game asset design", "animation reference"],
    not_demonstrated: ["character rigging", "character animation", "real-time engine integration"],
    interesting_details: [
      "The green hair and pointed silhouette are specifically designed to survive the CRT distortion layered on top",
      "Silhouette was locked on paper first because rework in geometry is much more expensive"
    ]
  },

  {
    id: "modulecraft",
    title: "MODULECRAFT",
    one_liner: "A fully recyclable cardboard chair with no glue, screws, or tools required, where interlocking rib structure distributes weight and material limits shape the visual identity.",
    type: ["product design", "3D design", "visual identity", "industrial design"],
    year: null,
    duration: "4 weeks",
    role: ["Product Designer"],
    team: null,
    tools: ["Adobe Illustrator", "Laser cutter"],
    context: "Product Design, Sustainable Furniture",
    problem: "Furniture in transitional spaces like dorms and temporary housing feels expensive for temporary use and creates waste. What if a chair cost almost nothing and could be recycled when done?",
    approach: [
      "Chair designed entirely from interlocking corrugated cardboard panels",
      "Ribs slot into each other, structure gets more stable under load",
      "No glue, screws, or tools",
      "Started with hand sketches for proportions and joint geometry",
      "Tested early versions by hand, then used laser cutter for precision",
      "Prototype built from recycled cardboard"
    ],
    key_decisions: [
      { decision: "Prototyped early and often at small scale before full size", reason: "Structural issues in physical objects have to be caught early because they compound" },
      { decision: "Limited system to interlocking pieces with no adhesives", reason: "Connections themselves have to create strength, which forced better joint design" },
      { decision: "Let ergonomics define form", reason: "Comfort and durability came from user feedback as the top priorities, which shaped proportions and angles" }
    ],
    outcomes: [
      { claim: "Working chair from recycled corrugated cardboard that holds adult body weight", metric: null },
      { claim: "Flat-packs for storage", metric: null },
      { claim: "Estimated production cost of $6.30 at scale", metric: "$6.30 per unit" }
    ],
    challenges: [
      "Ideas simple on paper become complex when they must hold weight and stay stable",
      "Working within physical constraints meant every choice had to contribute to structure"
    ],
    reflection: [
      "Showed how different it is to design something that has to physically work.",
      "Prototyping was the only way to understand what actually worked.",
      "Less room for guesswork, more focus on testing."
    ],
    skills_proven: ["product design", "industrial design", "materials engineering", "prototyping", "ergonomics", "sustainability design", "laser cutting"],
    adjacent_skills: ["manufacturing design", "packaging design", "furniture design"],
    not_demonstrated: ["mass production tooling", "supply chain", "retail rollout"],
    interesting_details: [
      "Holds a full adult and costs $6.30 to produce at scale",
      "The structure gets more stable under load, not less",
      "The visual identity of the chair is inseparable from the material constraint. The grid of intersecting cardboard IS the design"
    ]
  },

  {
    id: "throughlens",
    title: "THROUGH THE LENS",
    one_liner: "A personal photography project spanning three years of capturing landscapes and moments, edited for tone and atmosphere.",
    type: ["photography", "visual storytelling"],
    year: null,
    duration: "2023-2026, ongoing",
    role: ["Photographer", "Editor"],
    team: null,
    tools: ["Camera", "Lightroom"],
    context: "Personal Photography",
    problem: null,
    approach: [
      "Ongoing personal photography practice",
      "Images captured and edited in Lightroom",
      "Curated gallery of six photographs across landscape, urban, and geometric subjects"
    ],
    key_decisions: null,
    outcomes: [
      { claim: "Body of six curated photographs spanning 2023 to 2026", metric: "6 photos" }
    ],
    challenges: null,
    reflection: null,
    skills_proven: ["photography", "color grading", "composition", "post-processing", "visual storytelling"],
    adjacent_skills: ["art direction", "mood boarding", "editorial thinking"],
    not_demonstrated: ["commercial photography", "editorial shoots", "studio lighting", "photojournalism"],
    interesting_details: [
      "This is personal creative practice, not a problem-solving project. Rafael describes it as something he does in his free time"
    ]
  },

  {
    id: "pantri",
    title: "PANTRI",
    one_liner: "A grocery system that turns receipts into an adaptive meal plan, tracking what you bought, estimating how long it lasts, and recommending recipes based on your actual pantry.",
    type: ["product design", "interaction design", "AI experience design", "smart packaging"],
    year: 2026,
    duration: "6 weeks",
    role: ["Product Designer"],
    team: "Cory Cantrell, Tyler Lin",
    tools: ["Figma", "React"],
    context: "Product Design, Spring 2026",
    problem: "Planning meals, buying groceries, storing food and deciding what to cook are treated as separate moments. Grocery stores already record what leaves at checkout, but once the receipt prints that information stops helping the person who bought it. 29% of food in the U.S. went unsold or uneaten in 2024 and the average American spent $762 on food that went uneaten.",
    approach: [
      "Interviewed thirteen customers who regularly meal-prep, inside grocery stores, about the tools they already used rather than the app they wished existed",
      "Receipt data from grocery store partnerships auto-fills a digital pantry so users never scan items manually",
      "Meal plan is generated first so users react to a plan instead of starting with an empty calendar",
      "When the final purchase differs from the planned list, Pantri offers to adjust the rest of the week",
      "Ethylene-responsive stickers give climacteric fruits a visual ripeness countdown; everything else uses approximate freshness windows",
      "Designed and tested in Figma, then rebuilt as a functional React prototype with the store connection and sticker data simulated"
    ],
    key_decisions: [
      { decision: "Made the receipt the input instead of the user", reason: "Manual scanning would make Pantri another chore, and research showed maintenance is exactly where existing systems die" },
      { decision: "Made receipt access a requirement rather than an optional toggle", reason: "Without that data Pantri required manual entry and lost the one thing that made it different; a reduced version that did not solve the problem was worse than being direct about the tradeoff" },
      { decision: "Left calorie tracking out", reason: "It introduced more sensitive information, more complexity, and a different relationship with food than the product was designed for" },
      { decision: "Scoped the ripeness sticker to climacteric fruits only", reason: "Not every fruit continues ripening after harvest, so the ethylene signal only works for bananas, avocados, apples, mangoes and kiwis" },
      { decision: "Picked sticker colors from what the sensing material allowed, then tested the order", reason: "The palette was constrained by the chemistry, so focus groups tested whether people could rank the stages and whether they stayed distinguishable for color-vision deficiencies" }
    ],
    outcomes: [
      { claim: "Functional React prototype covering most of the experience, with the grocery store connection and sticker data simulated", metric: null },
      { claim: "Not connected to a live grocery partner, so no reduction in food waste can be claimed yet", metric: null }
    ],
    challenges: [
      "Receipt data shows what someone bought but not how they will use it",
      "Food does not expire on schedule, and produce has no reliable expiration date",
      "Sticker colors could not be chosen freely; available transitions depended on the sensing material's reaction to ethylene",
      "Most of the design work lived in deviation states: substitutions, skipped meals, changed quantities, imperfect pantry data"
    ],
    reflection: [
      "The hardest part was deciding what the system could reasonably know, not designing the screens.",
      "Working with ambiguity meant deciding which unknowns the system could estimate, which needed a quick user decision, and which should stay outside the product.",
      "Making something feel simple does not mean the system is simple. Pantri only works if the difficult parts get handled without becoming the user's problem."
    ],
    skills_proven: ["interaction design", "prototyping", "user research", "AI experience design", "smart packaging", "React prototyping", "systems design"],
    adjacent_skills: ["service design", "privacy-first design", "accessibility design", "materials research"],
    not_demonstrated: ["live grocery partner integration", "shipped consumer product", "measured food-waste reduction", "production sticker manufacturing"],
    interesting_details: [
      "The whole product depends on one insight: grocery stores already have the data, they just never give it back to the shopper",
      "Part of the system lives on a fruit rather than a screen. The ethylene-responsive sticker was constrained by chemistry, not by a design palette",
      "Rafael cut calorie tracking even though the system already understood ingredients and portions, because it changed the product's relationship with food",
      "Built with a team of three: Rafael, Cory Cantrell and Tyler Lin"
    ]
  },

  /* PLACEHOLDER — case study not written yet. Fill in real data before relying on it. */
  {
    id: "dystopia",
    title: "DYSTOPIA-XX26",
    one_liner: "A visual identity project. The case study is not published yet.",
    type: ["visual identity"],
    year: null,
    duration: null,
    role: ["Visual Designer"],
    team: null,
    tools: null,
    context: "Visual Identity",
    problem: null,
    approach: null,
    key_decisions: null,
    outcomes: null,
    challenges: null,
    reflection: null,
    skills_proven: ["visual identity"],
    adjacent_skills: null,
    not_demonstrated: null,
    interesting_details: [
      "Marked Coming Soon on the site. No details are available yet, so don't speculate about what it is"
    ]
  }
];

/* Helper for the assistant to look up a project by id */
export function getProjectById(id) {
  return PROJECTS_BRAIN.find(p => p.id === id) || null;
}

/* Helper to list all project ids so the model knows what exists */
export const PROJECT_IDS = PROJECTS_BRAIN.map(p => p.id);
