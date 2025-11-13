import { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline"; // npm i @heroicons/react




export default function App() {
  // 🌙 Dark mode
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // 📝 Inputs
  const [situacion, setSituacion] = useState("");
  const [cargaEmocional, setCargaEmocional] = useState(1);
  const [objetoRepresentativo, setObjetoRepresentativo] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [resultado, setResultado] = useState("");

  const emotions = ["Tristeza", "Miedo", "Ira", "Alegría", "Frustración", "Ansiedad"];

  const toggleEmotion = (emotion) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    );
  };

  // 🚀 Reencuadrar
  const handleReencuadrar = async () => {
    const prompt = `
Actúa como el motor lógico de una aplicación de Coaching Terapéutico PNL/Estoico. Tu tarea principal es aplicar un proceso de reencuadre terapéutico a la situación problemática proporcionada. 
Datos de entrada:
Situación: ${situacion}
Emociones: ${selectedEmotions.join(", ")}
Carga Emocional: ${cargaEmocional}
Objeto Representativo: ${objetoRepresentativo}
`;

    try {
      const response = await fetch("/.netlify/functions/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      setResultado(data.text || "No se recibió respuesta de Gemini.");
    } catch (err) {
      console.error("Error enviando a Gemini:", err);
      setResultado("Error enviando la solicitud.");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reencuadre Terapéutico</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded bg-gray-200 dark:bg-gray-700"
        >
          {darkMode ? (
            <SunIcon className="h-5 w-5 text-yellow-400" />
          ) : (
            <MoonIcon className="h-5 w-5 text-gray-900" />
          )}
        </button>
      </div>

      {/* Inputs */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Situación a reencuadrar:</label>
        <textarea
          value={situacion}
          onChange={(e) => setSituacion(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-800"
          rows={3}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Carga emocional (1-5): {cargaEmocional}</label>
        <input
          type="range"
          min={1}
          max={5}
          value={cargaEmocional}
          onChange={(e) => setCargaEmocional(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Objeto representativo:</label>
        <input
          type="text"
          value={objetoRepresentativo}
          onChange={(e) => setObjetoRepresentativo(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-800"
        />
      </div>

      {/* Emociones */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Emociones asociadas:</label>
        <div className="flex flex-wrap">
          {emotions.map((emotion) => (
            <button
              key={emotion}
              onClick={() => toggleEmotion(emotion)}
              className={`px-3 py-1 m-1 rounded border transition-colors duration-200
                ${
                  selectedEmotions.includes(emotion)
                    ? "bg-green-400 text-white border-green-500"
                    : "bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-300"
                }`}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>

      {/* Botón Reencuadrar */}
      <div className="mb-6">
        <button
          onClick={handleReencuadrar}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Reencuadrar
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="p-4 border rounded bg-white dark:bg-gray-800 whitespace-pre-line">
          {resultado}
        </div>
      )}
    </div>
  );
}
