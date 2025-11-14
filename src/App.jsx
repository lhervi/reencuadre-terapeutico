import { useState } from "react";

export default function App() {
  const [provider, setProvider] = useState("openai"); // Default
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    if (loading) return; // Evitar multiclícks

    setLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch("/.netlify/functions/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider }),
      });

      const data = await res.json();

      console.log("📌 RAW RESPONSE:", data);

      if (!res.ok) {
        setError(
          data.error ||
            `Error inesperado (${res.status}): verifica la consola y las API keys.`
        );
        return;
      }

      setResponse(data.respuesta || "(Respuesta vacía)");
    } catch (err) {
      console.error("🔥 Network error:", err);
      setError("No se pudo conectar al servidor. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-lg p-6">

        {/* HEADER */}
        <h1 className="text-2xl font-bold mb-4 text-gray-700">
          Reencuadre Terapéutico (Beta)
        </h1>

        {/* SELECTOR DE PROVEEDOR */}
        <div className="mb-4">
          <label className="block text-gray-600 font-semibold mb-1">
            Seleccionar IA
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-white"
          >
            <option value="openai">OpenAI – GPT-4o Mini</option>
            <option value="gemini">Gemini – Pro / Flash</option>
          </select>
        </div>

        {/* PROMPT */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escribe aquí tu consulta..."
          className="w-full border rounded px-3 py-2 mb-4 h-32"
        />

        {/* BOTON */}
        <button
          onClick={handleSend}
          disabled={loading}
          className={`w-full py-2 rounded text-white font-semibold ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Procesando..." : "Enviar"}
        </button>

        {/* ERROR */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            ⚠️ {error}
          </div>
        )}

        {/* RESPUESTA */}
        {response && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 text-gray-700 rounded whitespace-pre-line">
            {response}
          </div>
        )}
      </div>
    </div>
  );
}
