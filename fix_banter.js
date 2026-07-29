const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const correctBanter = 
    function buildBanterHTML(img1, name1, color1, msg1, img2, name2, color2, msg2) {
      return \\\
        <div style="display: flex; flex-direction: column; gap: 10px; padding-top: 5px; direction: rtl;">
          <div style="display: flex; align-items: flex-start; gap: 10px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; border-right: 3px solid \\\; text-align: right;">
             <img src="\\\" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 2px solid \\\; flex-shrink: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
             <div>
               <b style="color:\\\; font-size: 1.05em; display: block; margin-bottom: 3px;">\\\</b>
               <span style="font-size: 0.9em; line-height: 1.4; color: #ddd;">"\\\"</span>
             </div>
          </div>
          <div style="display: flex; align-items: flex-start; flex-direction: row-reverse; gap: 10px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; border-left: 3px solid \\\; text-align: left;">
             <img src="\\\" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 2px solid \\\; flex-shrink: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
             <div style="width: 100%;">
               <b style="color:\\\; font-size: 1.05em; display: block; margin-bottom: 3px;">\\\</b>
               <span style="font-size: 0.9em; line-height: 1.4; color: #ddd; display: block;" dir="rtl">"\\\"</span>
             </div>
          </div>
        </div>
      \\\;
    }
\.trim();

// find the broken one
const startIdx = html.indexOf('function buildBanterHTML');
if (startIdx !== -1) {
    let endIdx = html.indexOf('    // ===== SOUND SYSTEM =====', startIdx);
    if (endIdx === -1) endIdx = html.indexOf('function buildEnemyBanterHTML', startIdx);
    if (endIdx === -1) endIdx = html.indexOf('function', startIdx + 20); // fallback
    
    // Actually, let's just find the closing brace of buildBanterHTML. It's roughly 25 lines.
    const brokenBanter = html.substring(startIdx, html.indexOf('}', startIdx) + 50).match(/function buildBanterHTML[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*/)[0];
    html = html.replace(brokenBanter, correctBanter + '\n');
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Fixed buildBanterHTML");
} else {
    console.log("Could not find buildBanterHTML");
}
