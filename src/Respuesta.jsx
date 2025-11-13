import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

export default function Respuesta({ respuesta }) {
  const ref = useRef();
  const handlePrint = useReactToPrint({
    content: () => ref.current,
  });

  return (
    <div className="p-4 border rounded bg-white dark:bg-gray-800">
      <div ref={ref}>
        <pre className="whitespace-pre-wrap">{respuesta}</pre>
      </div>
      <button
        className="mt-2 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded"
        onClick={handlePrint}
      >
        Imprimir PDF
      </button>
    </div>
  );
}
