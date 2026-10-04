Glitter 2K Viewer: website version
==================================

index.html  – main viewer with your settings baked in (no control panel).
clean.html  – Clean version (no effects) for the easter egg.
model.glb   – the model. Keep it in the same folder as the HTML files.
PROMPT.txt  – paste this into your AI coding tool to add the viewer to your site.

Website behavior
- Drag to rotate, scroll or pinch to zoom. Visitors can't upload or swap the model.
- Note: while the cursor is over the viewer, the scroll wheel zooms instead of scrolling the page.
- The effect scales with the viewer's height (tuned for 900px tall), so it looks the same at any size.
- It stops drawing when it's off screen or the tab is hidden, to save battery.

Change a setting later
Open index.html in a text editor and edit the numbers inside window.VIEWER_CONFIG near the bottom
(for example "bg" for the background color, or "autorotate": false).
