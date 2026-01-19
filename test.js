// Test Zoe chat - simule un utilisateur
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Ouvre le site
    await page.goto('http://localhost:8888/v2/');
    await page.waitForSelector('#input');

    console.log('Site chargé');

    // Attend le message de Zoe
    await page.waitForTimeout(2000);

    // Tape le nom
    await page.type('#input', 'Sara');
    await page.keyboard.press('Enter');
    console.log('Envoyé: Sara');

    await page.waitForTimeout(3000);

    // Pose une question
    await page.type('#input', 'qui es-tu?');
    await page.keyboard.press('Enter');
    console.log('Envoyé: qui es-tu?');

    await page.waitForTimeout(4000);

    // Lit les messages
    const messages = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.msg')).map(m => ({
            type: m.classList.contains('user') ? 'user' : 'zoe',
            text: m.textContent
        }));
    });

    console.log('\n=== CONVERSATION ===');
    messages.forEach(m => {
        console.log(`[${m.type}] ${m.text}`);
    });

    await browser.close();
})();
