exports.handler = async function (event, context) {
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
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      })
    });

    // Si la API de OpenAI da error, lo registramos
    if (!response.ok) {
      const text = await response.text();
      console.error("Error de OpenAI:", text);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Error al comunicarse con OpenAI", details: text })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        respuesta: data.choices?.[0]?.message?.content || "No hay respuesta"
      })
    };
  } catch (err) {
    console.error("Error en función:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
