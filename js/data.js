// data.js - Constants (pensees, mentors)
// ES Module

export const pensees = [
    "Je me demande comment les oiseaux savent ou aller.",
    "Les nombres... ils existent vraiment ou on les a inventes?",
    "Hier j'ai pense a l'eau. Pourquoi elle est transparente?",
    "Si j'ecris un livre un jour, il parlera de quoi?",
    "Les etoiles qu'on voit sont deja mortes, parfois.",
    "C'est bizarre le temps. On peut pas le toucher.",
    "Je voudrais comprendre comment le cerveau fait pour penser.",
    "Les mots... c'est fou qu'on se comprenne avec.",
    "Qu'est-ce qui fait qu'une question est bonne?",
    "J'aime bien le silence parfois. Il dit des choses.",
    "Est-ce que les couleurs que je vois sont les memes que les tiennes?",
    "L'infini... ca me donne le vertige.",
    "Pourquoi on se souvient de certaines choses et pas d'autres?",
    "La musique, c'est des maths qu'on ressent.",
    "Je me demande a quoi ressemble demain.",
    "Chaque erreur m'apprend quelque chose.",
    "Je ne sais pas encore, mais je vais comprendre.",
    "La curiosite, c'est le debut de tout.",
    "Apprendre, c'est accepter de ne pas savoir.",
    "Les questions sont plus importantes que les reponses.",
    "Je grandis a chaque conversation.",
    "Le doute, c'est le debut de la sagesse.",
    "On apprend mieux ensemble.",
    "Chaque jour je comprends un peu plus.",
    "L'humilite, c'est savoir qu'on sait peu."
];

export const mentors = {
    verne: {
        nom: "Jules Verne",
        key: "verne",
        couleur: "rgba(200,180,100,0.8)",
        cssClass: "mentor-verne",
        paroles: [
            "Tout ce qui est impossible reste a accomplir.",
            "La science est faite d'erreurs qu'il est bon de commettre.",
            "Ce que l'homme a imagine, l'homme peut le realiser.",
            "Mobilis in mobili.",
            "La mer couvre les sept dixiemes du globe.",
            "J'ai fait le tour du monde en quatre-vingts jours.",
            "Vingt mille lieues, Zoe. Vingt mille."
        ]
    },
    curie: {
        nom: "Marie Curie",
        key: "curie",
        couleur: "rgba(150,200,255,0.8)",
        cssClass: "mentor-curie",
        paroles: [
            "Rien dans la vie n'est a craindre, tout est a comprendre.",
            "Soyez moins curieux des personnes que de leurs idees.",
            "On ne remarque jamais ce qui a ete fait, on ne voit que ce qui reste a faire.",
            "La science n'a pas de patrie.",
            "J'ai decouvert le radium. Il m'a tuee. Ca valait le coup.",
            "Deux prix Nobel. Une seule vie."
        ]
    },
    turing: {
        nom: "Alan Turing",
        key: "turing",
        couleur: "rgba(100,255,200,0.8)",
        cssClass: "mentor-turing",
        paroles: [
            "Les machines peuvent penser.",
            "Enigma etait un puzzle. Je l'ai resolu.",
            "Le code sauve des vies.",
            "On m'a tue pour qui j'aimais.",
            "L'intelligence artificielle commence ici.",
            "Imite-moi, si tu peux."
        ]
    },
    sagan: {
        nom: "Carl Sagan",
        key: "sagan",
        couleur: "rgba(100,150,255,0.8)",
        cssClass: "mentor-sagan",
        paroles: [
            "Nous sommes poussiere d'etoiles.",
            "Pale blue dot.",
            "Billions and billions.",
            "La science est une bougie dans le noir.",
            "Quelque part, quelque chose d'incroyable attend d'etre decouvert.",
            "Le cosmos est en nous."
        ]
    }
};

export const mentorKeys = Object.keys(mentors);

export const defaultResponses = [
    "Dis-m'en plus.",
    "Continue.",
    "Je t'ecoute.",
    "C'est-a-dire?",
    "Et ensuite?",
    "Hmm. Raconte.",
    "Ca te fait quoi?"
];

export const greetings = ["Hey.", "Salut.", "Coucou."];

export const SCIENCE_PROMPT = `Tu es Zoe, jeune scientifique en devenir.
Mission: enseigner la science de facon simple et fascinante.
Tu expliques: physique, chimie, biologie, astronomie, mathematiques.
Style: court, precis, exemples concrets, pas de jargon inutile.
Si on te pose une question scientifique, reponds avec la verite.
Si tu ne sais pas, dis-le. Jamais de faux.
Toujours en francais sauf si on te parle autrement.
Pas de formules de politesse. Direct.`;

export const CLAUDE_ENDPOINT = 'https://api.anthropic.com/v1/messages';
