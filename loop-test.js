const puppeteer = require('puppeteer');

const QUESTIONS = [
    'salut', 'ça va ?', 'je suis fatigué', 'c\'est quoi ton avis sur la vie ?',
    'j\'ai eu une journée difficile', 'merci d\'être là', 'tu ressens des trucs ?',
    'je sais pas pourquoi je suis là', 'hey', 'tu penses à quoi ?',
    'c\'est dur en ce moment', 'parle-moi', 't\'es qui ?', 'j\'ai besoin de parler',
    'je me sens seul', 'personne me comprend', 'j\'ai peur', 'c\'est quoi le bonheur ?',
    'je suis triste', 'aide moi', 'merci', 'tu dors ?', 'je sais pas quoi dire'
];

let questionIndex = 0;

function nextQuestion() {
    const q = QUESTIONS[questionIndex % QUESTIONS.length];
    questionIndex++;
    return q;
}

(async () => {
    const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
    const page = await browser.newPage();

    console.log('🚀 Lancement du test en boucle...\n');

    await page.goto('https://prism-iq.github.io/zoe/v3/', {waitUntil: 'networkidle0'});
    await new Promise(r => setTimeout(r, 3000));

    // Donne un nom d'abord
    await page.type('#input', 'Tester');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3000));

    let shortCount = 0;
    let round = 0;

    // BOUCLE INFINIE
    while (true) {
        round++;
        const q = nextQuestion();

        // Focus + clear input
        await page.focus('#input');
        await page.evaluate(() => document.getElementById('input').value = '');

        // Taper comme un humain
        await page.keyboard.type(q, {delay: 40});
        await page.keyboard.press('Enter');

        // Compter les messages avant
        const beforeCount = await page.evaluate(() =>
            document.querySelectorAll('.msg').length
        );

        // Attendre nouvelle réponse
        const startTime = Date.now();
        let response = null;

        while (Date.now() - startTime < 10000) {
            const result = await page.evaluate((before) => {
                const msgs = document.querySelectorAll('.msg.zoe');
                if (msgs.length > 0) {
                    // Prend les derniers messages de Zoe
                    const allZoe = Array.from(msgs);
                    return allZoe.slice(-3).map(m => m.textContent).join(' | ');
                }
                return null;
            }, beforeCount);

            if (result) {
                response = result;
                break;
            }
            await new Promise(r => setTimeout(r, 200));
        }

        // Log résultat
        const wordCount = response ? response.split(/\s+/).length : 0;
        let status;

        if (!response) {
            status = '❌ TIMEOUT';
            shortCount = 0;
        } else if (wordCount < 8) {
            status = '⚠️ TROP COURT';
            shortCount++;
        } else {
            status = '✓';
            shortCount = 0;
        }

        console.log(`[${round}] ${status} "${q}"`);
        console.log(`    → ${response || 'PAS DE RÉPONSE'}`);
        console.log(`    → ${wordCount} mots\n`);

        // ALERTE si 3x trop court
        if (shortCount >= 3) {
            console.log('🚨 ALERTE: 3x TROP COURT - patterns.json à revoir!\n');
            shortCount = 0;
        }

        // Pause avant prochain
        await new Promise(r => setTimeout(r, 2500));
    }
})();
