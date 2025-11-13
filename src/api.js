export async function generarRespuesta({ problema, criticidad, frecuencia, tiempo, emociones, idioma }) {
  try {
    const res = await fetch("/.netlify/functions/chatgpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problema, criticidad, frecuencia, tiempo, emociones, idioma })
    });
    const data = await res.json();
    return data?.respuesta || "No se pudo generar respuesta.";
  } catch (err) {
    console.error("Error ChatGPT:", err);
    return "Ocurrió un error al generar la respuesta.";
  }
}
