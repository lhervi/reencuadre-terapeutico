// src/App.jsx
import { useState } from "react";
import { HiSun, HiMoon } from "react-icons/hi";

const EMOCIONES = ["Tristeza", "Ira", "Miedo", "Frustración", "Ansiedad"];
const OBJETOS = ["Recuerdo", "Persona", "Situación", "Lugar", "Evento"];
const PARAM_DEBILITAMIENTO = ["Cambiar color", "Bajar intensidad", "Distancia temporal"];

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [situacion, setSituacion] = useState("");
  const [emociones, setEmociones] = useState([]);
  const [carga, setCarga] = useState(3);
  const [objeto, setObjeto] = useState("");
  const [params, setParams] = useState([]);
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleEmocion = (emo) => {
    setEmociones((prev) =>
      prev.includes(emo) ? prev.filter((e) => e !== emo) : [...prev, emo]
    );
  };

  const toggleParam = (param) => {
    setParams((prev) =>
      prev.includes(param) ? prev.filter((p) => p !== param) : [...prev, param]
    );
  };

  const handleReencuadrar = async () => {
    if (!situacion || !objeto) {
      alert("Por favor, completa la situación y selecciona un objeto representativo.");
      return;
    }

    setLoading(true);
    setResultado("");

    const prompt = `
Actúa como el motor lógico de una aplicación de Coaching Terapéutico PNL/Estoico.
Tu tarea es aplicar un proceso de reencuadre terapéutico a la situación proporcionada.
Datos de Entrada:
- Situación: ${situacion}
- Emociones: ${emociones.join(", ")}
- Carga Emocional: ${carga}
- Objeto Representativo: ${objeto}
- Parámetros de Debilitamiento: ${params.join(", ")}

Estructura de Respuesta:
- Sección 1: Reencuadre por Marcos
- Sección 2: Reto de la Responsabilidad Estoica
- Sección 3: Reencuadre de Submodalidades
- Sección 4: Especificaciones de Desarrollo
- Sección 5: Checklist de Cumplimiento
`;

    try {
      const response = await fetch("https://api.tu-gemini.com/reencuadre", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer TU_API_KEY_AQUI",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Error en la solicitud");

      const data = await response.json();
      setResultado(data.texto || "✅ Reencuadre generado correctamente");
    } catch (err) {
      console.error(err);
      setResultado("❌ Error enviando la solicitud a Gemini");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Reencuadre Terapéutico</h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {darkMode ? <HiSun className="w-6 h-6 text-yellow-400" /> : <HiMoon className="w-6 h-6 text-gray-800" />}
            </button>
          </div>

          {/* Situación */}
          <div>
            <label className="block mb-1 font-semibold">Situación a Reencuadrar:</label>
            <textarea
              value={situacion}
              onChange={(e) => setSituacion(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
              rows={4}
            />
          </div>

          {/* Emociones */}
          <div>
            <label className="block mb-1 font-semibold">Emociones Asociadas:</label>
            <div className="flex flex-wrap gap-2">
              {EMOCIONES.map((emo) => (
                <button
                  key={emo}
                  onClick={() => toggleEmocion(emo)}
                  className={`px-3 py-1 rounded border ${
                    emociones.includes(emo)
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 dark:text-white"
                  }`}
                >
                  {emo}
                </button>
              ))}
            </div>
          </div>

          {/* Carga Emocional */}
          <div>
            <label className="block mb-1 font-semibold">
              Carga Emocional: {carga}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={carga}
              onChange={(e) => setCarga(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Objeto Representativo */}
          <div>
            <label className="block mb-1 font-semibold">Objeto Representativo:</label>
            <div className="flex flex-wrap gap-2">
              {OBJETOS.map((obj) => (
                <button
                  key={obj}
                  onClick={() => setObjeto(obj)}
                  className={`px-3 py-1 rounded border ${
                    objeto === obj
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 dark:text-white"
                  }`}
                >
                  {obj}
                </button>
              ))}
            </div>
          </div>

          {/* Parámetros de Debilitamiento */}
          <div>
            <label className="block mb-1 font-semibold">Parámetros de Debilitamiento:</label>
            <div className="flex flex-wrap gap-2">
              {PARAM_DEBILITAMIENTO.map((param) => (
                <label key={param} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={params.includes(param)}
                    onChange={() => toggleParam(param)}
                    className="accent-green-500"
                  />
                  {param}
                </label>
              ))}
            </div>
          </div>

          {/* Botón Reencuadrar */}
          <div>
            <button
              onClick={handleReencuadrar}
              disabled={loading}
              className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded disabled:opacity-50"
            >
              {loading ? "Procesando..." : "Reencuadrar"}
            </button>
          </div>

          {/* Resultado */}
          {resultado && (
            <div className="whitespace-pre-wrap p-4 border rounded bg-gray-100 dark:bg-gray-800">
              {resultado}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
