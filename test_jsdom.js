const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const html = fs.readFileSync('index.html', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
try {
  dom.window.document.getElementById('btn-start').click();
  console.log("Clicked successfully!");
} catch (e) {
  console.log("Error during click:", e);
}
