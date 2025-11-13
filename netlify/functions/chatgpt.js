exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body);

    // Construimos el prompt con la información recibida del frontend
    const prompt = `
      Idioma: ${body.idioma}
      Problema: ${body.problema}
      Criticidad: ${body.criticidad}
      Frecuencia: ${body.frecuencia}
      Tiempo: ${body.tiempo}
      Emociones: ${Array.isArray(body.emociones) ? body.emociones.join(", ") : body.emociones}
      
      Aplica los marcos de reencuadre terapéutico y devuelve la respuesta detallada.
    `;

    // Usamos el fetch global (no node-fetch)
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

    const data = await response.json();

    // Verificamos si hubo un error desde la API
    if (!response.ok) {
      console.error("Error from OpenAI API:", data);
      throw new Error(data.error?.message || "Error desconocido desde OpenAI API");
    }

    // Devolvemos la respuesta al frontend
    return {
      statusCode: 200,
      body: JSON.stringify({
        respuesta: data.choices?.[0]?.message?.content || "No hay respuesta generada."
      })
    };

  } catch (err) {
    console.error("Error en función chatgpt:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
