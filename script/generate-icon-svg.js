// Generate the Git icon SVG using Paper.js boolean operations.
//
// Prerequisites:
//   npm install --no-save paper paperjs-offset
//
// Source geometry (on a 58x58 grid with origin at 0,0):
//   - Rounded rectangle background: (0,0) 58x58, corner radius 5
//   - Main branch: vertical line x=40.5, y=0..41, stroke-width 5
//   - Topic branch: diagonal (40.5,18) to (17.5,41), stroke-width 5
//   - Three circles at (40.5,18), (40.5,41), (17.5,41), all r=6
//
// The result is placed into a 78x78 viewBox via:
//   transform="translate(10 10) rotate(-45 29 29)"
// Design on 58x58, rotate -45 around the shape center, translate
// to center in 78x78 viewBox.

const paper = require('paper');
const { PaperOffset } = require('paperjs-offset');

const fs = require('fs');
const path = require('path');
const outDir = path.join(__dirname, '../static/images/logos/downloads');

function saveFile(filename, data) {
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, data);
  console.log(`Wrote ${outPath}`);
}


// ================================== Icon ===================================

// The path data of the git icon.
const iconGlyph = (() => {
  paper.setup(new paper.Size(78, 78));

  // Background: rounded rectangle
  const bg = new paper.Path.Rectangle({
    point: [0, 0],
    size: [58, 58],
    radius: 5,
  });

  // Branch lines (expand strokes into filled outlines)
  const mainBranch = new paper.Path.Line({ from: [40.5, 0], to: [40.5, 41] });
  const mainExp = PaperOffset.offsetStroke(mainBranch, 2.5, { cap: 'butt' });
  mainBranch.remove();

  const topicBranch = new paper.Path.Line({ from: [40.5, 18], to: [17.5, 41] });
  const topicExp = PaperOffset.offsetStroke(topicBranch, 2.5, { cap: 'butt' });
  topicBranch.remove();

  // Circles
  const branchPoint = new paper.Path.Circle({ center: [40.5, 18], radius: 6 });
  const mainStart   = new paper.Path.Circle({ center: [40.5, 41], radius: 6 });
  const topicStart  = new paper.Path.Circle({ center: [17.5, 41], radius: 6 });

  // Unite all graph elements
  let graph = mainExp.unite(topicExp);
  graph = graph.unite(branchPoint);
  graph = graph.unite(mainStart);
  graph = graph.unite(topicStart);

  // Subtract graph from background
  const icon = bg.subtract(graph);

  return icon.pathData;
})();

// Transform which converts the 58×58 square into a diamond (i.e. rotates it by
// 45° and centres it within 78×78 box).
const iconTransform = `translate(10 10) rotate(-45 29 29)`;

// Generates and saves the icon image file.
function generateIcon(variant, iconFill) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="92pt" height="92pt"` +
    ` viewBox="0 0 78 78"><path fill="${iconFill}"` +
    ` transform="${iconTransform}" d="${iconGlyph}"/></svg>`;
  saveFile(`Git-Icon-${variant}.svg`, svg);
}


// =========================== Variant definitions ===========================

const orange = '#f03c2e';
const black  = '#100f0d';
const white  = '#fff';

const iconVariants = {
  '1788C': { iconFill: orange },
  'Black': { iconFill: black },
  'White': { iconFill: white },
};


// ================================ Generate =================================

for (const [variant, { iconFill }] of Object.entries(iconVariants)) {
  generateIcon(variant, iconFill);
}
