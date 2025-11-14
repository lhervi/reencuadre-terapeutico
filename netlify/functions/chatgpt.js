// chatgpt.js (CommonJS, Node 18+ soporta fetch global)
exports.handler = async function (event, context) {
  try {
    const body = JSON.parse(event.body);

    const prompt = `
      Idioma: ${body.idioma || "es"}
      Problema: ${body.problema}
      Criticidad: ${body.criticidad || "media"}
      Frecuencia: ${body.frecuencia || "diaria"}
      Tiempo: ${body.tiempo || "indefinido"}
      Emociones: ${(body.emociones || []).join(", ")}

      Aplica los marcos de reencuadre terapéutico y devuelve la respuesta detallada.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `OpenAI API error: ${text}` }),
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ respuesta: data.choices?.[0]?.message?.content || "No hay respuesta" }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
