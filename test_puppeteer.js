const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch({headless: 'new'});
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

        await page.goto('file:///' + __dirname.replace(/\\/g, '/') + '/index.html', {waitUntil: 'networkidle0'});
        
        await page.waitForTimeout(1000);
        
        // click start mission button
        await page.evaluate(() => {
            const btns = document.querySelectorAll('button');
            for (let btn of btns) {
                if (btn.textContent.includes('المهمة')) {
                    btn.click();
                }
            }
        });
        
        await page.waitForTimeout(1000);
        await browser.close();
    } catch(e) {
        console.log('SCRIPT ERROR:', e.message);
    }
})();
