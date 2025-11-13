import { useState, useEffect } from "react";
import EmocionesSelector from "./EmocionesSelector";
import { generarRespuesta } from "./api";

export default function App() {
  const [problema, setProblema] = useState("");
  const [criticidad, setCriticidad] = useState(3);
  const [frecuencia, setFrecuencia] = useState("constante");
  const [tiempo, setTiempo] = useState("actual");
  const [emocionesSeleccionadas, setEmocionesSeleccionadas] = useState([]);
  const [respuesta, setRespuesta] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [idioma, setIdioma] = useState("es"); // 'es' por defecto

  const handleGenerar = async () => {
    if (!problema.trim()) return;
    const prompt = {
      problema,
      criticidad,
      frecuencia,
      tiempo,
      emociones: emocionesSeleccionadas,
      idioma
    };
    const res = await generarRespuesta(prompt);
    setRespuesta(res);
  };

  useEffect(() => {
    if (darkMode) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  }, [darkMode]);

  return (
    <div className="app-container">
      <header>
        <h1>Terapia Online con IA</h1>
        <div className="controls">
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "🌞 Claro" : "🌙 Oscuro"}
          </button>
          <button onClick={() => setIdioma(idioma === "es" ? "en" : "es")}>
            {idioma === "es" ? "🇬🇧 English" : "🇪🇸 Español"}
          </button>
        </div>
      </header>

      <div className="inputs">
        <textarea
          placeholder="Describe tu problema..."
          value={problema}
          onChange={(e) => setProblema(e.target.value)}
        />
        <label>Criticidad: {criticidad}</label>
        <input
          type="range"
          min="1"
          max="5"
          value={criticidad}
          onChange={(e) => setCriticidad(parseInt(e.target.value))}
        />
        <label>Frecuencia:</label>
        <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
          <option value="constante">Constante</option>
          <option value="esporadico">Esporádico</option>
        </select>
        <label>Tiempo:</label>
        <select value={tiempo} onChange={(e) => setTiempo(e.target.value)}>
          <option value="pasado">Pasado</option>
          <option value="actual">Actual</option>
          <option value="futuro">Futuro</option>
        </select>

        <EmocionesSelector
          emocionesSeleccionadas={emocionesSeleccionadas}
          setEmocionesSeleccionadas={setEmocionesSeleccionadas}
        />

        <button className="generate-btn" onClick={handleGenerar}>
          Generar Respuesta
        </button>
      </div>

      {respuesta && <div className="respuesta-container">{respuesta}</div>}
    </div>
  );
}
