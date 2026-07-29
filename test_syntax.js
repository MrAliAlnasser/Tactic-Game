const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/g);
if (match && match.length > 1) {
    const script = match[1].replace(/<script>|<\/script>/g, '');
    try {
        new Function(script);
        console.log("No syntax errors in second script!");
    } catch (e) {
        console.log("Syntax error in second script!");
        console.log(e.toString());
        // Find line number using a simple parsing approach or from stack
        const lines = script.split('\n');
        for (let i = 0; i < lines.length; i++) {
            try {
                new Function(lines.slice(0, i+1).join('\n'));
            } catch (err) {
                if (err.message.includes('Unexpected') || err.message.includes('token') || err.message.includes('missing')) {
                    console.log("First error around relative line: " + (i+1));
                    console.log(lines[i]);
                    break;
                }
            }
        }
    }
}
