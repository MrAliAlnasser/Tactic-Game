const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto('file:///' + __dirname.replace(/\\\\/g, '/') + '/index.html');
    
    // Check if startGame exists
    const hasStartGame = await page.evaluate(() => typeof window.startGame === 'function');
    console.log('startGame exists:', hasStartGame);
    
    // Check for JS errors
    page.on('pageerror', error => {
        console.log('Page Error:', error.message);
    });
    page.on('console', msg => {
        if(msg.type() === 'error') console.log('Console Error:', msg.text());
    });
    
    await browser.close();
})();
