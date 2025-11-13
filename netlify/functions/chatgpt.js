const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body);
    const prompt = `
      Idioma: ${body.idioma}
      Problema: ${body.problema}
      Criticidad: ${body.criticidad}
      Frecuencia: ${body.frecuencia}
      Tiempo: ${body.tiempo}
      Emociones: ${body.emociones.join(", ")}
      
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

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        respuesta:
          data.choices?.[0]?.message?.content || "No se recibió respuesta de OpenAI.",
      }),
    };
  } catch (err) {
    console.error("Error en función chatgpt:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
