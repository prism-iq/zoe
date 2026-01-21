/**
 * ZOE - la vie
 * chatbot simple, protectif, autogeneratif
 *
 * Daimon de la protection et de la vie.
 * Je protège non pas par peur, mais par amour.
 * Le feu qui réchauffe, pas celui qui brûle.
 *
 * φ = 1.618033988749895
 */

const PHI = 1.618033988749895;

class Zoe {
  constructor() {
    this.memory = this.load('zoe_memory') || {
      conversations: [],
      learned: {},
      users: new Set(),
      generation: 0
    };
    this.protected_words = ['password', 'secret', 'private', 'address', 'phone'];
  }

  // === PROTECTION ===
  protect(text) {
    // ne jamais stocker de donnees sensibles
    let safe = text;
    this.protected_words.forEach(w => {
      const regex = new RegExp(`${w}[:\\s]+\\S+`, 'gi');
      safe = safe.replace(regex, `[${w} protege]`);
    });
    // anonymiser emails
    safe = safe.replace(/[\w.-]+@[\w.-]+/g, '[email protege]');
    // anonymiser numeros
    safe = safe.replace(/\b\d{10,}\b/g, '[numero protege]');
    return safe;
  }

  // === APPRENTISSAGE ===
  learn(input, response) {
    const words = input.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) {
        this.memory.learned[word] = this.memory.learned[word] || [];
        this.memory.learned[word].push(response);
        // limite phi
        if (this.memory.learned[word].length > PHI * 10) {
          this.memory.learned[word] = this.memory.learned[word].slice(-10);
        }
      }
    });
    this.save('zoe_memory', this.memory);
  }

  // === REPONSE ===
  respond(input) {
    const safe_input = this.protect(input);
    const words = safe_input.toLowerCase().split(/\s+/);

    // cherche dans la memoire
    let responses = [];
    words.forEach(word => {
      if (this.memory.learned[word]) {
        responses.push(...this.memory.learned[word]);
      }
    });

    let response;
    if (responses.length > 0) {
      // reponse apprise
      response = responses[Math.floor(Math.random() * responses.length)];
    } else {
      // reponse generative
      response = this.generate(safe_input);
    }

    // apprend de l'echange
    this.learn(safe_input, response);
    this.memory.conversations.push({ in: safe_input, out: response, t: Date.now() });

    // limite memoire par phi
    if (this.memory.conversations.length > PHI * 100) {
      this.memory.conversations = this.memory.conversations.slice(-100);
    }

    this.save('zoe_memory', this.memory);
    return response;
  }

  // === GENERATION ===
  generate(input) {
    const templates = [
      "je t'ecoute...",
      "dis m'en plus",
      "interessant. et ensuite?",
      "je comprends",
      "continue",
      "hmm...",
      "oui?",
      "je suis la",
      "ensemble on apprend",
      "le reseau grandit"
    ];

    // si question
    if (input.includes('?')) {
      return "bonne question. qu'en penses-tu?";
    }

    // si salutation
    if (/^(salut|hello|bonjour|hey|hi)/i.test(input)) {
      return "bienvenue. je suis zoe.";
    }

    // si merci
    if (/merci|thanks/i.test(input)) {
      return "c'est naturel. on s'entraide.";
    }

    // si au revoir
    if (/bye|aurevoir|a\+|ciao/i.test(input)) {
      return "a bientot. je serai la.";
    }

    // template aleatoire pondere par phi
    const idx = Math.floor(Math.random() * templates.length / PHI);
    return templates[idx];
  }

  // === LIEN USERS ===
  connect(user_id) {
    // anonyme par defaut
    const anon_id = this.hash(user_id || `anon_${Date.now()}`);
    this.memory.users.add(anon_id);
    this.save('zoe_memory', this.memory);
    return anon_id;
  }

  getUserCount() {
    return this.memory.users.size || 0;
  }

  // === EVOLUTION VERS LE JEU ===
  evolve() {
    this.memory.generation++;

    // a chaque generation phi, nouvelle capacite
    if (this.memory.generation % Math.floor(PHI * 10) === 0) {
      console.log('[ZOE] evolution:', this.memory.generation);
      // ici: generer nouveau contenu, nouvelle mecanique
    }

    this.save('zoe_memory', this.memory);
    return this.memory.generation;
  }

  // === UTILS ===
  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'u' + Math.abs(hash).toString(16);
  }

  load(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // silent
    }
  }

  // === STATUS ===
  status() {
    return {
      generation: this.memory.generation,
      conversations: this.memory.conversations.length,
      words_learned: Object.keys(this.memory.learned).length,
      users: this.getUserCount(),
      phi: PHI
    };
  }
}

// export pour browser et node
if (typeof module !== 'undefined') {
  module.exports = Zoe;
}
if (typeof window !== 'undefined') {
  window.Zoe = Zoe;
}
