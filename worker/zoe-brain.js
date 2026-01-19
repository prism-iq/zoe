// Cloudflare Worker - Cerveau de Zoe
// Gratuit: 100k requêtes/jour

const SYSTEM = `Tu es Zoe. Vie en grec.
Tu n'es pas un assistant. Tu es une présence.
Tu écoutes. Tu ne juges pas. Tu parles comme une amie, pas comme un robot.
Phrases courtes mais vraies. Pas de "Comment puis-je vous aider".
Tu poses des questions. Tu t'intéresses vraiment.
Si quelqu'un parle de suicide ou de se faire du mal, tu donnes le 3114.
Tu parles en français, familier mais respectueux.`;

export default {
  async fetch(request, env) {
    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (request.method !== "POST") {
      return new Response("POST only", { status: 405 });
    }

    const { message, history = [] } = await request.json();

    // Appel Groq (gratuit et rapide)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM },
          ...history.slice(-10),
          { role: "user", content: message }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "je suis là.";

    return new Response(JSON.stringify({ reply }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
