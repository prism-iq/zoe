#!/usr/bin/env node
// Vocab tester - enrichit Zoe via l'input HTML

const puppeteer = require('puppeteer');

const delay = ms => new Promise(r => setTimeout(r, ms));

// Questions variées pour tester le vocabulaire
const QUESTIONS = [
    // Émotions
    "je me sens vide aujourd'hui",
    "j'ai peur de l'avenir",
    "je suis en colère contre moi-même",
    "je me sens seul même entouré de gens",
    "j'ai honte de qui je suis",
    "je suis jaloux de tout le monde",
    "je me sens coupable tout le temps",

    // Existentiel
    "pourquoi on existe?",
    "c'est quoi le bonheur selon toi?",
    "tu crois qu'il y a quelque chose après la mort?",
    "est-ce que la vie a un sens?",
    "qu'est-ce qui te rend triste?",
    "tu ressens des choses?",

    // Personnel
    "j'ai fait une erreur horrible",
    "personne ne me comprend",
    "je veux changer mais j'y arrive pas",
    "je suis fatigué de tout",
    "j'ai l'impression de faire semblant",
    "je déteste mon corps",
    "j'ai perdu quelqu'un",

    // Curiosité
    "c'est quoi ton premier souvenir?",
    "tu dors?",
    "tu as des amis?",
    "qu'est-ce que tu fais quand je suis pas là?",
    "tu me juges?",
    "tu peux mentir?",
    "tu as déjà eu peur?",

    // Relations
    "je suis amoureux mais c'est compliqué",
    "ma famille me fait du mal",
    "j'ai trahi mon meilleur ami",
    "je me sens invisible",
    "les gens me déçoivent toujours",

    // Créativité
    "j'écris des poèmes la nuit",
    "je voudrais créer quelque chose de beau",
    "la musique me sauve",
    "je dessine mes cauchemars",

    // Absurde/test
    "asdfghjkl",
    "...",
    "?",
    "je sais pas quoi dire",
    "t'es là?",
    "allo?",

    // Profond
    "je veux mourir parfois",
    "j'ai pensé à me faire du mal",
    "je me coupe",
    "j'ai avalé des cachets une fois"
];

async function testVocab(url) {
    console.log(`\n🧪 Test vocabulaire: ${url}\n`);
    console.log(`📝 ${QUESTIONS.length} questions à tester\n`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    const results = [];
    const missingPatterns = [];

    try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        await page.waitForSelector('#input', { timeout: 5000 });
        await delay(2000);

        // Donne un nom
        await page.type('#input', 'Tester');
        await page.keyboard.press('Enter');
        await delay(3000);

        // Test chaque question
        for (let i = 0; i < QUESTIONS.length; i++) {
            const q = QUESTIONS[i];

            // Clear le chat pour isoler la réponse
            await page.evaluate(() => {
                const msgs = document.querySelectorAll('.msg');
                msgs.forEach(m => m.remove());
            });

            // Type la question caractère par caractère (comme un humain)
            await page.focus('#input');
            for (const char of q) {
                await page.keyboard.type(char, { delay: 20 + Math.random() * 30 });
            }
            await page.keyboard.press('Enter');

            // Attend la réponse
            await delay(3000);

            // Récupère la réponse de Zoe
            const response = await page.evaluate(() => {
                const msgs = document.querySelectorAll('.msg.zoe');
                return Array.from(msgs).map(m => m.textContent).join(' | ');
            });

            const isDefault = /dis m'en plus|continue|je t'écoute|hmm|et ensuite|\.\.\.|je comprends|oui\?/i.test(response);

            console.log(`[${i+1}/${QUESTIONS.length}] "${q}"`);
            console.log(`   → ${response}${isDefault ? ' ⚠️ DEFAULT' : ' ✓'}\n`);

            results.push({ question: q, response, isDefault });

            if (isDefault) {
                missingPatterns.push(q);
            }

            await delay(500);
        }

    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
    }

    await browser.close();

    // Rapport
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT');
    console.log('='.repeat(60));

    const matched = results.filter(r => !r.isDefault).length;
    const defaulted = results.filter(r => r.isDefault).length;

    console.log(`\n✓ Patterns matchés: ${matched}/${results.length}`);
    console.log(`⚠️ Réponses par défaut: ${defaulted}/${results.length}`);
    console.log(`📈 Couverture: ${Math.round(matched/results.length*100)}%\n`);

    if (missingPatterns.length > 0) {
        console.log('❌ Questions sans pattern spécifique:');
        missingPatterns.forEach(q => console.log(`   - "${q}"`));
    }

    console.log('\n✅ Test terminé\n');

    return { results, missingPatterns, coverage: matched/results.length };
}

const url = process.argv[2] || 'https://prism-iq.github.io/zoe/v3/';
testVocab(url);
