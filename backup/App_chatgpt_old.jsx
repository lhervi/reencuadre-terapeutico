import React, { useState, useEffect } from "react";
import EmocionesSelector from "./EmocionesSelector";
import { generarRespuestaChatGPT, generarRespuestaGemini } from "./api";

export default function App() {
  // Estados principales
  const [problema, setProblema] = useState("");
  const [criticidad, setCriticidad] = useState(3);
  const [frecuencia, setFrecuencia] = useState("constante");
  const [tiempo, setTiempo] = useState("actual");
  const [emocionesSeleccionadas, setEmocionesSeleccionadas] = useState([]);
  const [respuesta, setRespuesta] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [idioma, setIdioma] = useState("es");
  const [iaSeleccionada, setIaSeleccionada] = useState("chatgpt");

  // Aplicar modo oscuro al body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  // Manejar generación de respuesta
  const handleGenerar = async () => {
    if (!problema.trim()) {
      alert("Por favor, describe tu problema.");
      return;
    }

    const prompt = `
Idioma: ${idioma === "es" ? "Español" : "Inglés"}
Problema: ${problema}
Emociones: ${emocionesSeleccionadas.join(", ")}
Criticidad: ${criticidad}
Frecuencia: ${frecuencia}
Tiempo: ${tiempo}

Aplica los marcos terapéuticos de PNL, estoicismo, Wu Wei, 7 hábitos y 4 acuerdos para dar una respuesta edificante, resignificando el problema, con recomendaciones prácticas y cierre motivador.
`;

    let respuestaIA = "";
    try {
      if (iaSeleccionada === "chatgpt") {
        respuestaIA = await generarRespuestaChatGPT(prompt);
      } else if (iaSeleccionada === "gemini") {
        respuestaIA = await generarRespuestaGemini(prompt);
      } else {
        respuestaIA = "IA seleccionada aún no configurada.";
      }
      setRespuesta(respuestaIA);
    } catch (error) {
      console.error(error);
      setRespuesta("Ocurrió un error al generar la respuesta.");
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Terapia Online con IA</h1>

        <div className="controls">
          {/* Selector de idioma */}
          <button onClick={() => setIdioma("es")}>🇪🇸 Español</button>
          <button onClick={() => setIdioma("en")}>🇬🇧 English</button>

          {/* Modo oscuro */}
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "🌞 Claro" : "🌙 Oscuro"}
          </button>

          {/* Selector de IA */}
          <select value={iaSeleccionada} onChange={(e) => setIaSeleccionada(e.target.value)}>
            <option value="chatgpt">ChatGPT</option>
            <option value="gemini">Gemini</option>
            {/* <option value="deepseek">DeepSeek</option> // futura opción */}
          </select>
        </div>
      </header>

      <div className="inputs">
        <textarea
          value={problema}
          onChange={(e) => setProblema(e.target.value)}
          placeholder={idioma === "es" ? "Describe tu problema..." : "Describe your problem..."}
        />

        <div>
          <label>Criticidad: {criticidad}</label>
          <input
            type="range"
            min="1"
            max="5"
            value={criticidad}
            onChange={(e) => setCriticidad(Number(e.target.value))}
          />
        </div>

        <div>
          <label>Frecuencia:</label>
          <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
            <option value="constante">{idioma === "es" ? "Constante" : "Constant"}</option>
            <option value="esporadico">{idioma === "es" ? "Esporádico" : "Sporadic"}</option>
          </select>
        </div>

        <div>
          <label>Tiempo:</label>
          <select value={tiempo} onChange={(e) => setTiempo(e.target.value)}>
            <option value="pasado">{idioma === "es" ? "Pasado" : "Past"}</option>
            <option value="actual">{idioma === "es" ? "Actual" : "Present"}</option>
            <option value="futuro">{idioma === "es" ? "Futuro" : "Future"}</option>
          </select>
        </div>

        {/* Selector de emociones */}
        <EmocionesSelector
          emocionesSeleccionadas={emocionesSeleccionadas}
          setEmocionesSeleccionadas={setEmocionesSeleccionadas}
        />
      </div>

      <button className="generate-btn" onClick={handleGenerar}>
        {idioma === "es" ? "Generar respuesta" : "Generate response"}
      </button>

      {respuesta && (
        <div className="respuesta-container">
          {respuesta}
        </div>
      )}
    </div>
  );
}
