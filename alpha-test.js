#!/usr/bin/env node
// Alpha tester - simule des utilisateurs

const puppeteer = require('puppeteer');

const delay = ms => new Promise(r => setTimeout(r, ms));

const TESTS = [
    { name: 'Sara', messages: ['qui es-tu?', 'ça va?', 'merci'] },
    { name: 'Test', messages: ['je suis triste', 'aide moi'] },
    { name: 'Alex', messages: ['salut', 'c\'est quoi le sens de la vie?', 'bye'] }
];

async function test(url) {
    console.log(`\n🧪 Testing: ${url}\n`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    for (const t of TESTS) {
        console.log(`\n--- User: ${t.name} ---`);
        const page = await browser.newPage();

        try {
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
            await page.waitForSelector('#input', { timeout: 5000 });

            // Attend le message d'intro
            await delay(2000);

            // Envoie le nom
            await page.type('#input', t.name);
            await page.keyboard.press('Enter');
            console.log(`> ${t.name}`);
            await delay(2500);

            // Envoie les messages
            for (const msg of t.messages) {
                await page.type('#input', msg);
                await page.keyboard.press('Enter');
                console.log(`> ${msg}`);
                await delay(2500);
            }

            // Lit la conversation
            const convo = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.msg'))
                    .map(m => `[${m.classList.contains('user') ? 'user' : 'zoe'}] ${m.textContent}`)
                    .join('\n');
            });

            console.log('\nConversation:');
            console.log(convo);

        } catch (e) {
            console.error(`❌ Error: ${e.message}`);
        }

        await page.close();
    }

    await browser.close();
    console.log('\n✅ Tests done\n');
}

// URL par défaut ou argument
const url = process.argv[2] || 'https://prism-iq.github.io/zoe/v3/';
test(url);
