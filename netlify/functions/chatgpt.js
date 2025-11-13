// netlify/functions/chatgpt.js

// Netlify Functions usan CommonJS
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

exports.handler = async function(event, context) {
  if (!OPENAI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API Key no configurada en variables de entorno." })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Body inválido: debe ser JSON" })
    };
  }

  const prompt = body.prompt;
  if (!prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No se recibió prompt" })
    };
  }

  try {
    // Usando fetch global de Node 18+
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    // Validar que la respuesta sea JSON
    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Respuesta inválida de OpenAI" })
      };
    }

    const answer = data.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ respuesta: answer })
    };

  } catch (err) {
    console.error("Error en la función chatgpt:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
