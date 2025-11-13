export default function EmocionesSelector({ emocionesSeleccionadas, setEmocionesSeleccionadas }) {
  const emociones = [
    "Angustia",
    "Indignación",
    "Miedo",
    "Tristeza",
    "Frustración",
    "Ansiedad"
  ];

  const toggleEmocion = (emo) => {
    if (emocionesSeleccionadas.includes(emo))
      setEmocionesSeleccionadas(emocionesSeleccionadas.filter(e => e !== emo));
    else
      setEmocionesSeleccionadas([...emocionesSeleccionadas, emo]);
  };

  return (
    <div className="emociones-container">
      {emociones.map((emo) => (
        <button
          key={emo}
          className={`emocion-btn ${emocionesSeleccionadas.includes(emo) ? "selected" : ""}`}
          onClick={() => toggleEmocion(emo)}
        >
          {emo}
        </button>
      ))}
    </div>
  );
}
