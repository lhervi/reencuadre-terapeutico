import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Brain, Clock, CheckCircle, Save, Loader2, AlertTriangle, History, ChevronUp, ChevronDown, List, Shield, Heart, Repeat, Calendar } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- Constantes de Opciones ---
const PARAMETER_TYPES = ["Visual", "Auditivo", "Kinestésico", "Olfativo", "Gustativo"];
const PREDEFINED_OBJECTS = ["Reloj", "Espejo", "Piedra", "Flor", "Luz", "Agua", "Otro..."];
// EMOCIONES INDIVIDUALES: Cada una asociada a una virtud estoica para el reencuadre.
const EMOTIONS_DATA = [ 
    { value: 'Miedo', label: 'Miedo', color: 'red', virtue: 'Coraje' },
    { value: 'Ansiedad', label: 'Ansiedad', color: 'orange', virtue: 'Serenidad' },
    { value: 'Rabia', label: 'Rabia', color: 'yellow', virtue: 'Templanza' },
    { value: 'Tristeza', label: 'Tristeza', color: 'blue', virtue: 'Aceptación' },
    { value: 'Frustración', label: 'Frustración', color: 'purple', virtue: 'Diligencia' },
    { value: 'Culpa', label: 'Culpa', color: 'pink', virtue: 'Responsabilidad' },
    { value: 'Impotencia', label: 'Impotencia', color: 'gray', virtue: 'Humildad' },
];
const TIMEFRAMES = [{ value: 'Actual', label: 'Situación Actual' }, { value: 'Recuerdo', label: 'Recuerdo (Pasado)' }];
const FREQUENCIES = [{ value: 'Repetitivos', label: 'Repetitivos (Alta)' }, { value: 'Poco Frecuentes', label: 'Poco Frecuentes (Baja)' }];

const TEXT_ACCENT = "text-emerald-400";
const TEXT_BASE = "text-gray-700 leading-relaxed";
const COLOR_PRIMARY = "bg-gray-900";
const COLOR_ACCENT = "bg-emerald-500 hover:bg-emerald-600";

// --- Variables globales de Firebase (se inicializan en useEffect) ---
let db;
let auth;
let appId = 'default-app-id'; // Fallback for app ID

// --- COMPONENTE PRINCIPAL ---
function App() {
  const [situacion, setSituacion] = useState('');
  const [carga, setCarga] = useState(3);
  const [selectedObject, setSelectedObject] = useState('');
  const [customObject, setCustomObject] = useState('');
  const [selectedParameters, setSelectedParameters] = useState({});
  
  // State for multiple selected emotions
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('');

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [userId, setUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Custom/Anonymous Authentication and UID Acquisition
  useEffect(() => {
    try {
      const firebaseConfig = typeof __firebase_config !== 'undefined' 
                             ? JSON.parse(__firebase_config) 
                             : null;
      appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

      if (!firebaseConfig) {
        setAuthReady(true); 
        setUserId(crypto.randomUUID()); 
        return;
      }

      let appInstance;
      try {
        appInstance = initializeApp(firebaseConfig);
        db = getFirestore(appInstance);
        auth = getAuth(appInstance);
      } catch (e) {
        setAuthReady(true);
        setUserId(crypto.randomUUID());
        return;
      }
      
      const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

      const handleAuth = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        } catch (err) {
            if (initialAuthToken) {
                await signInAnonymously(auth).catch(err => console.error("Firebase: Fallback anónimo falló.", err));
            }
        }
      };

      handleAuth();

      const unsub = onAuthStateChanged(auth, user => {
        if (user) {
            setUserId(user.uid);
        } else {
            setUserId(crypto.randomUUID()); 
        }
        setAuthReady(true);
      });

      return () => unsub();
      
    } catch (e) {
        setAuthReady(true);
        setUserId(crypto.randomUUID());
    }
  }, []);

  // Real-time History (Firestore Snapshot)
  useEffect(() => {
    if (!userId || !db || !authReady) return;
    // Private data path for the current user
    const userReframesPath = `artifacts/${appId}/users/${userId}/reframes`;
    const q = query(collection(db, userReframesPath), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Convert Firestore Timestamp to JavaScript Date object
        timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : doc.data().timestamp
      }));
      setHistory(items);
    }, (err) => {
        console.error("Error al obtener el historial de Firestore:", err);
    });
    
    return () => unsubscribe();
  }, [userId, authReady]);

  // --- Auxiliary Functions ---
  const getFinalObject = () => selectedObject === 'Otro...' ? customObject : selectedObject;

  const formatParametersForQuery = () => {
    const entries = Object.entries(selectedParameters || {})
      .filter(([_, v]) => v && v.toString().trim().length > 0)
      .map(([k, v]) => `${k}: ${v.toString().trim()}`); 
    return entries.join(' • ');
  };
  
  // Function to toggle selection of multiple emotions
  const toggleEmotion = (emotionValue) => {
    setSelectedEmotions(prev => 
        prev.includes(emotionValue)
          ? prev.filter(e => e !== emotionValue) // Deselect
          : [...prev, emotionValue] // Select
      );
  };
  
  // Logic to adapt the therapeutic response (uses the first selected emotion as principal)
  const getCustomizedReframeLogic = (emotions, timeframe, frequency) => {
    const primaryEmotion = emotions.length > 0 ? emotions[0] : null;
    
    if (!primaryEmotion) return { virtue: 'Disciplina', actionTip: 'Falta de emoción primaria.', actionFocus: 'Falta de emoción primaria.', dichotomyExample: '', reto: '', submodalitiesTip: '' };

    const emotionData = EMOTIONS_DATA.find(e => e.value === primaryEmotion);
    const virtue = emotionData ? emotionData.virtue : 'Disciplina';
    
    let actionTip = '';
    let actionFocus = '';
    let dichotomyExample = 'Dicotomía Estoica: No puedes controlar el origen de la situación (Incontrolable), pero puedes controlar dedicar **X minutos a la acción enfocada (Controlable)**.';
    let reto = 'Durante 7 días, comprométete a dedicar exactamente X minutos a la quietud, sin intentar resolver la situación.';
    let submodalitiesTip = 'Elige la cualidad que más disminuya la sensación negativa.';

    // 1. Logic based on the Principal Emotion (Adjusted for individual emotions)
    if (primaryEmotion === 'Rabia') {
        actionTip = 'Acción de Canalización: Dirige esta energía. Ej: Ordenar tu escritorio, hacer 10 sentadillas o escribir una "carta de rabia" que nunca enviarás.';
        actionFocus = 'La Virtud a Cultivar: **Templanza (Moderación en la reacción) y Justicia.**';
        reto = 'Durante 5 días, cada vez que sientas el pico de rabia, oblígate a realizar una acción física y productiva por 5 minutos.';
    } else if (primaryEmotion === 'Miedo') {
        actionTip = 'Acción de Anclaje: Trae tu cuerpo al presente. Ej: Respiración 4-7-8, un chasquido de dedos, o nombrar 5 cosas que ves en la habitación.';
        actionFocus = 'La Virtud a Cultivar: **Coraje (Afrontar la realidad) y Sabiduría.**';
        reto = 'Durante 7 días, comprométete a dedicar 5 minutos a la respiración diafragmática profunda, ignorando la voz interna de alarma.';
    } else if (primaryEmotion === 'Ansiedad') {
        actionTip = 'Acción de Quietud: La ansiedad es energía futura. Céntrate en lo único seguro: tu respiración. Ej: Ancla tu atención en el sonido y la sensación del aire entrando y saliendo por 60 segundos.';
        actionFocus = 'La Virtud a Cultivar: **Serenidad (Confianza en el presente) y Templanza.**';
        reto = 'Durante 7 días, establece 3 recordatorios diarios para detenerte y nombrar 3 objetos que ves, 3 sonidos que escuchas y 3 cosas que sientes.';
    } else if (primaryEmotion === 'Tristeza') {
        actionTip = 'Acción de Conexión: La tristeza necesita ser reconocida y compartida. Ej: Llama a un ser querido o escribe una página de gratitud por lo que sí tienes.';
        actionFocus = 'La Virtud a Cultivar: **Amor (Auto-compasión) y Aceptación.**';
        reto = 'Durante 7 días, escribe un "Diario de Sentimiento" por 10 minutos, reconociendo la emoción sin juzgarla.';
    } else if (primaryEmotion === 'Frustración') {
        actionTip = 'Acción de Redirección: Enfócate en la micro-acción controlable. Ej: Identifica el primer paso ridículamente pequeño que *sí* puedes hacer.';
        actionFocus = 'La Virtud a Cultivar: **Diligencia (Persistencia enfocada) y Humildad.**';
        reto = 'Durante 3 días, haz solamente el primer paso (micro-acción) y luego detente. El reto es la consistencia mínima, no la finalización.';
    } else if (primaryEmotion === 'Impotencia') {
        actionTip = 'Acción de Enfoque Radical: Separa lo que puedes y no puedes hacer. Elige un solo punto de control (ej: la hora a la que te levantas) y domínalo por un día. El poder reside en el micro-control.';
        actionFocus = 'La Virtud a Cultivar: **Humildad (Reconocer el límite) y Coraje.**';
        reto = 'Durante 5 días, repite en voz alta: "Solo puedo controlar mi esfuerzo y mi actitud. Acepto el resto" cada vez que sientas el pico de impotencia.';
    } else if (primaryEmotion === 'Culpa') {
        actionTip = 'Acción de Reparación/Auto-perdón: Cierra el ciclo. Ej: Pide disculpas si es necesario, o escríbele una carta de perdón a tu yo del pasado.';
        actionFocus = 'La Virtud a Cultivar: **Justicia (Reparación) y Responsabilidad.**';
        reto = 'Durante 5 días, dedica 10 minutos a ejercicios de auto-compasión (Ej: Meditación de Bondad Amorosa), reconociendo que hiciste lo mejor que podías con el conocimiento que tenías.';
    }


    // 2. Logic based on Timeframe and Frequency
    if (timeframe === 'Recuerdo') {
        dichotomyExample = 'Dicotomía Estoica: No puedes cambiar el evento pasado (Incontrolable), pero puedes controlar la **interpretación y la carga que le asignas hoy (Controlable)**.';
        actionTip = actionTip.replace('en la habitación.', 'que ves **actualmente** en la habitación.').replace('físico', 'simbólico/físico');
        submodalitiesTip = 'Elige la cualidad que más disminuya la sensación negativa. Si es un recuerdo, experimenta con hacerlo en Blanco y Negro, o ponerle música de circo.';
    }

    if (frequency === 'Repetitivos') {
        reto = reto.replace('comprométete a dedicar', 'establece una "palabra STOP" y un anclaje físico (Ej: chasquido). Comprométete a usar el anclaje cada vez que el pensamiento empiece a rodar.');
        submodalitiesTip = 'Puesto que es un pensamiento repetitivo, enfócate en hacerlo borroso, pequeño y lejano (disociación) para romper el bucle.';
    }

    return { primaryEmotion, virtue, actionTip, actionFocus, dichotomyExample, reto, submodalitiesTip };
  };

  // --- Simulated Response Generator (simulates serverless function or Gemini) ---
  const generateReframe = async () => {
    const objetoFinal = getFinalObject();
    const emocionesUnidas = selectedEmotions.join(', ');
    
    // ✅ DIAGNOSTIC VALIDATION: 
    if (!situacion.trim()) { setError("Error: 1. Situación a Reencuadrar está vacío."); return; }
    if (selectedEmotions.length === 0) { setError("Error: 2. Debes seleccionar al menos una Emoción Principal."); return; } // Updated validation
    if (!selectedTimeframe) { setError("Error: 3. ¿Es Actual o Recuerdo? no seleccionado."); return; }
    if (!objetoFinal.trim()) { setError("Error: 4. Objeto Representativo está vacío."); return; }
    if (!selectedFrequency) { setError("Error: 6. Frecuencia del Pensamiento no seleccionada."); return; }
    
    if (!userId || !authReady) {
        setError("Error de Autenticación: Esperando la conexión con el servidor (ID de usuario no disponible). Inténtalo de nuevo en unos segundos.");
        return; 
    }
    
    try {
      setLoading(true);
      setError('');
      
      const { primaryEmotion, virtue, actionTip, actionFocus, dichotomyExample, reto, submodalitiesTip } = getCustomizedReframeLogic(selectedEmotions, selectedTimeframe, selectedFrequency);

      const parametros = formatParametersForQuery();
      const cargaText = carga > 3 ? 'Alta' : (carga > 1 ? 'Media' : 'Baja');
      
      const simulatedResponse = `
Reencuadre Terapéutico: El Arquitecto de tu Destino
Tu mente no está fallando; está pidiendo un cambio de estrategia. El obstáculo de la situación **"${situacion.trim()}"** no es un muro, sino un maestro disfrazado que te está entrenando en la perseverancia, la humildad y la disciplina, virtudes esenciales para tu crecimiento.

SECCIÓN 1: Reencuadre por Marcos (La Lente del Crecimiento)
| Marco | Aplicación Estoica/PNL (Redirección Virtuosa y Preguntas de Reencuadre) |
|---|---|
| **Aceptación** | Orden Divino: Acepta que la incomodidad de la carga ${carga} (${cargaText}) es la resistencia a lo que es. Pregunta: Si aceptaras que esta sensación es parte normal del proceso, ¿qué nueva estrategia probarías? |
| **Utilidad** | Proyección Interna: ¿De qué te sirve este bloqueo? Es útil porque te obliga a revisar tus límites y priorizar el cuidado personal. Pregunta: ¿Cómo puedo usar la frustración actual como una brújula precisa para saber exactamente qué necesito soltar o abrazar? |
| **Aprendizaje** | Dicotomía Estoica: Aprende que la reacción no funciona. El fracaso es no cambiar tu enfoque. Pregunta: Si este bloqueo tuviera un mensaje positivo, ¿cuál sería el nuevo método de respuesta que te está pidiendo que adoptes? |
| **Gratitud** | Agradece que tienes la capacidad de sentir y que el bloqueo te está mostrando la brecha exacta de tus necesidades. Pregunta: ¿Qué tres cosas fundamentales en tu vida agradeces tener justo ahora que te facilitarán la gestión de esta situación? |
| **Humor** | Ríe de tu **"${objetoFinal}"** y la seriedad con la que tu mente toma el desvío. Dale un nombre tonto a la sensación. Pregunta: Si esa sensación fuera un personaje de dibujos animados, ¿qué consejo absurdo le darías para superarlo? |
| **Abundancia** | Hay abundancia de recursos internos y oportunidades. Tu habilidad de aprender no se ha agotado. Pregunta: ¿Qué oportunidades de aprendizaje y autoconocimiento hay en tu entorno que aún no has utilizado? |
| **Amor** | Aplícate la auto-compasión. Ámate lo suficiente como para darte permiso de sentir y descansar. Pregunta: Si fueras tu propio mentor más sabio, ¿cómo te hablarías para animarte a seguir adelante sin autocastigarte? |
| **Compasión** | Siente compasión por el tú que se siente abrumado. Entiende que esa energía frustrada necesita una dirección. Pregunta: ¿Cómo canalizarías esta energía en una acción física y productiva ahora mismo (ej: ordenar algo, hacer ejercicio)? |

SECCIÓN 2: Reto de la Responsabilidad Estoica (Acción y Virtud)
"El primer paso para la virtud es la disciplina; el primer paso para la disciplina es la acción enfocada."
Tu foco no debe ser "resolver la situación", sino dominar tu propia consistencia en la respuesta.
${actionFocus}
La Acción Inmediata (Controlable): El problema no es el evento, es tu reacción.
${dichotomyExample}
Reto: ${reto}
Proyección Interna: Cada vez que sientas la emoción de **${primaryEmotion}** (o una de las seleccionadas: ${emocionesUnidas}), recuerda que es la energía que te pide que cumplas la acción enfocada: **${actionTip}**

SECCIÓN 3: Reencuadre de Submodalidades (El Anclaje Sensorial)
Tu Objeto Representativo (**${objetoFinal}**) encapsula la carga emocional negativa. Vamos a jugar con sus cualidades sensoriales para transformarlo en un ancla de determinación tranquila.

**Diagnóstico PNL:**
Tiempo de la Situación: **${selectedTimeframe}**
Emociones Seleccionadas: **${emocionesUnidas}**
Emoción Principal para Lógica: **${primaryEmotion}**
Frecuencia de Pensamiento: **${selectedFrequency}**
Parámetros Debilitados: ${parametros || 'No se ingresaron submodalidades iniciales.'}
Carga Emocional: ${carga}/5 (${cargaText})

Instrucción: Vas a manipular estas submodalidades en tu mente. Realiza las siguientes pruebas y observa qué cambios disminuyen inmediatamente la carga negativa que sientes:

1. **Cambio de Cualidad (Adaptado a Foco):**
   Si la imagen es grande, hazla pequeña. Si está cerca, aléjala. Si es ruidosa, silénciala. Si es cálida, enfríala a una temperatura confortable.
   Foco de Transformación: **${submodalitiesTip}**

2. **Anclaje de Determinación:**
   Ahora, fija tu **${objetoFinal}** con las nuevas submodalidades que elegiste (ej: Pequeño, Lejano, Fresco). Esta es tu nueva ancla de foco y consistencia y te recordará que la **virtud de la ${virtue}** es tu verdadero poder.
      `;
      setResult(simulatedResponse);

      // Save to Firestore with the new fields
      // Private data path for the current user
      const userReframesPath = `artifacts/${appId}/users/${userId}/reframes`;

      await addDoc(collection(db, userReframesPath), {
        input: { 
            situacion: situacion.trim(), 
            objeto: objetoFinal.trim(), 
            carga, 
            parametros, 
            emotion: emocionesUnidas, // Save all selected emotions
            timeframe: selectedTimeframe, 
            frequency: selectedFrequency 
        },
        output: simulatedResponse,
        timestamp: serverTimestamp(),
        userId,
      });
      
    } catch (err) {
      console.error("Error en la generación o guardado:", err);
      setError("Error al generar el reencuadre. Verifica la configuración de Firebase. Detalles en la consola.");
    } finally {
      setLoading(false);
    }
  };

  // --- RESULT DISPLAY COMPONENT ---
  const ResultDisplay = ({ text }) => {
    if (!text) return null;
    
    // Split the text by double newlines followed by "SECCIÓN N:" to separate sections
    const parts = text.split(/\n{2,}(?=SECCIÓN \d:)/).filter(s => s.trim().length > 0);
    const titleIntroBlock = parts.length > 0 ? parts[0].trim().split('\n') : [];
    const numberedSections = parts.slice(1);
    
    const mainTitle = titleIntroBlock.length > 0 ? titleIntroBlock[0].trim() : "Resultado del Reencuadre";
    const introParagraph = titleIntroBlock.slice(1).join('\n').trim();

    return (
      <div className="space-y-6">
        {/* Main Title */}
        <h2 className="text-2xl font-extrabold text-white">{mainTitle}</h2>
        
        {/* Introduction Paragraph */}
        {introParagraph && (
            <div className="bg-stone-100 p-4 rounded-lg shadow-md">
                <p className="text-gray-700 italic font-medium whitespace-pre-line">{introParagraph}</p>
            </div>
        )}

        {/* Section 0: Initial Situation Data */}
        <div className="bg-stone-100 p-4 rounded-lg shadow-md">
          <p className="font-semibold text-lg text-gray-800 flex items-center">
            <Clock size={16} className="mr-2 text-gray-600"/> Situación Inicial:
          </p>
          <p className="text-gray-600 mt-1 italic whitespace-pre-line">
            "{situacion || 'No disponible'}" <br/>
            Carga: {carga}/5 • Emociones: {selectedEmotions.join(', ') || 'N/A'} • Tiempo: {selectedTimeframe || 'N/A'}
          </p>
        </div>

        {/* Render Numbered Sections */}
        {numberedSections.map((rawContent, index) => {
            const lines = rawContent.trim().split('\n').filter(line => line.trim().length > 0);
            const title = lines[0].trim();
            const contentBody = lines.slice(1).join('\n').trim();
            const sectionNumber = index + 1;

            // --- SPECIAL LOGIC FOR SECTION 1 (TABLE) ---
            if (title.includes("SECCIÓN 1: Reencuadre por Marcos")) {
                const tableLines = contentBody.split('\n').filter(line => line.includes('|'));
                
                if (tableLines.length < 2) return null; 

                const [headerLine, dividerLine, ...dataLines] = tableLines;
                const headers = headerLine.split('|').filter(h => h.trim()).map(h => h.trim());

                return (
                    <div key={sectionNumber} className="mt-4 p-4 border border-stone-200 rounded-lg bg-white shadow-sm overflow-x-auto">
                        <h3 className="font-bold text-lg mb-3 flex items-center text-gray-800">
                            <Brain size={18} className="mr-2 text-cyan-500" /> {title}
                        </h3>
                        <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                                <tr>
                                    {headers.map((header, i) => (
                                        <th key={i} className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                                {dataLines.map((line, i) => {
                                    const columns = line.split('|').filter(c => c.trim()).map(c => c.trim());
                                    if (columns.length !== headers.length) return null; 

                                    return (
                                        <tr key={i} className="hover:bg-stone-50">
                                            {columns.map((col, j) => (
                                                <td key={j} className="px-3 py-2 whitespace-normal text-sm text-gray-700 align-top">
                                                    <span dangerouslySetInnerHTML={{ __html: col.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            }

            // --- STANDARD LOGIC FOR SECTIONS 2 and 3 ---
            let icon;
            if (title.includes("SECCIÓN 2")) {
                icon = <Shield size={18} className="mr-2 text-yellow-600" />;
            } else if (title.includes("SECCIÓN 3")) {
                icon = <List size={18} className="mr-2 text-pink-500" />;
            } else {
                icon = <Brain size={18} className="mr-2 text-gray-500" />;
            }
            
            return (
              <div key={sectionNumber} className="mt-4 p-4 border border-stone-200 rounded-lg bg-white shadow-sm">
                <h3 className="font-bold text-lg mb-3 flex items-center text-gray-800">
                  {icon} {title}
                </h3>
                <div className={TEXT_BASE} dangerouslySetInnerHTML={{ __html: contentBody.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            );
        })}
      </div>
    );
  };
  
  // --- SUBMODALITIES PARAMETER COMPONENT ---
  const ParameterBuilder = () => {
    const updateParameter = useCallback((type, value) => {
      setSelectedParameters(prev => ({ ...prev, [type]: value }));
    }, []);

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          5. Parámetros de Debilitamiento (Submodalidades):
        </label>
        <div className="space-y-3 p-3 border border-stone-300 rounded-lg bg-white">
          {PARAMETER_TYPES.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <span className="w-24 text-sm font-semibold text-gray-800">{type}:</span>
              <input
                type="text"
                className="flex-grow p-2 border border-stone-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                placeholder={`Ej: a verde suave, a brillante...`}
                value={selectedParameters?.[type] ?? ''}
                onChange={(e) => updateParameter(type, e.target.value)} 
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 italic">
          Parámetros ingresados: {formatParametersForQuery() || 'Ninguno seleccionado.'}
        </p>
      </div>
    );
  };

  // --- HISTORY COMPONENT ---
  const HistoryItem = ({ item }) => {
    const [expanded, setExpanded] = useState(false);
    const date = item.timestamp instanceof Date ? item.timestamp.toLocaleDateString() : 'Cargando...';
    
    // Function to render historical result
    const ReframeHistoryDisplay = ({ text, input }) => {
        if (!text) return null;
        // Skip the main title/intro block
        const parts = text.split(/\n{2,}(?=SECCIÓN \d:)/).filter(s => s.trim().length > 0).slice(1);
        
        return (
            <div className="space-y-3">
                <p className="text-xs text-gray-500 mt-1 mb-2 font-semibold">
                    Emociones: {input.emotion || 'N/A'} | Tiempo: {input.timeframe || 'N/A'} | Frecuencia: {input.frequency || 'N/A'}
                </p>
                {parts.map((rawContent, index) => {
                    const lines = rawContent.trim().split('\n').filter(line => line.trim().length > 0);
                    const title = lines[0].trim();
                    let contentBody = lines.slice(1).join('\n').trim();

                    // Omit table and only show title/body for simple history
                    if (title.includes("SECCIÓN 1: Reencuadre por Marcos")) {
                        contentBody = contentBody.split('\n').filter(line => !line.includes('|')).join('\n').trim();
                    }

                    return (
                        <div key={index} className="p-3 border-l-4 border-emerald-400 bg-stone-50 rounded-lg">
                            <h4 className="font-semibold text-sm text-gray-800 mb-1">{title}</h4>
                            <p className="text-xs text-gray-600 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: contentBody.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
      <div className="border border-stone-200 rounded-lg p-3 bg-white shadow-sm">
        <button className="flex justify-between items-center w-full focus:outline-none" onClick={() => setExpanded(!expanded)}>
          <div className="flex flex-col items-start w-[calc(100%-40px)]">
            <p className="font-semibold text-gray-900 text-left">{date} - {item.input.objeto || 'Sesión'}</p>
            <p className="text-sm italic text-gray-500 line-clamp-1 break-all">{item.input.situacion}</p>
          </div>
          {expanded ? <ChevronUp size={20} className={TEXT_ACCENT}/> : <ChevronDown size={20} className={TEXT_ACCENT}/>}
        </button>
        {expanded && (
          <div className="mt-3 pt-3 border-t border-stone-100">
            <h4 className="font-bold text-gray-700 mb-2 flex items-center">
                <History size={16} className="mr-2 text-gray-500"/> Análisis Generado:
            </h4>
            <ReframeHistoryDisplay text={item.output} input={item.input}/>
          </div>
        )}
      </div>
    );
  };


  // --- MAIN RENDER ---
  return (
    <div className={`min-h-screen ${COLOR_PRIMARY} font-sans p-4 sm:p-8 flex justify-center`}>
      <div className="w-full max-w-6xl">
        <header className="text-center mb-10 p-4 rounded-xl bg-gray-800 shadow-xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
            <Zap size={32} className="inline mr-2 text-emerald-400" /> Reencuadre Terapéutico
          </h1>
          <p className={`mt-2 text-lg italic ${TEXT_ACCENT}`}>
            PNL, Estoicismo y Wu Wei para la fluidez mental
          </p>
          {userId && (
            <p className="mt-2 text-xs text-gray-500">
              UID: {userId}
            </p>
          )}
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: INPUTS */}
          <div className="lg:col-span-1 bg-stone-100 p-6 rounded-xl shadow-2xl space-y-5">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">Tu Situación Problema</h2>

            {!authReady && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded" role="alert">
                <p className="font-bold">Cargando...</p>
                <p>Iniciando sesión en Firebase. Por favor, espera.</p>
              </div>
            )}

            {/* 1. Situation to Reframe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1. Situación a Reencuadrar: <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full p-3 border border-stone-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                rows="4"
                value={situacion}
                onChange={(e) => setSituacion(e.target.value)}
                placeholder="Describe el problema o emoción que quieres transformar..."
              />
            </div>
            
            {/* 2. Principal Emotion (Multi-Select Chips) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    2. Emociones Principales: <span className="text-red-500 ml-1">*</span> <Heart size={16} className="ml-2 text-red-400"/>
                </label>
                <div className="flex flex-wrap gap-2 p-3 border border-stone-300 rounded-lg bg-white">
                    {EMOTIONS_DATA.map(e => (
                        <button
                            key={e.value}
                            onClick={() => toggleEmotion(e.value)}
                            // Dynamic class for border color and background
                            className={`px-3 py-1 rounded-full text-sm font-medium transition duration-200
                                ${selectedEmotions.includes(e.value) 
                                    ? `bg-${e.color}-500 text-white shadow-md border-2 border-${e.color}-700` 
                                    : `bg-${e.color}-100 text-${e.color}-800 hover:bg-${e.color}-200`
                                }`}
                        >
                            {e.label}
                        </button>
                    ))}
                </div>
                {selectedEmotions.length > 0 && (
                    <p className="mt-2 text-xs text-gray-600 font-semibold">
                        Seleccionadas: {selectedEmotions.join(', ')}
                    </p>
                )}
            </div>

            {/* 3. Current Situation or Memory? */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    3. ¿Tiempo de la Situación?: <span className="text-red-500 ml-1">*</span> <Calendar size={16} className="ml-2 text-blue-500"/>
                </label>
                <div className="flex justify-around space-x-2 bg-white p-2 rounded-lg border border-stone-300">
                    {TIMEFRAMES.map(tf => (
                        <label key={tf.value} className="flex-1 text-center cursor-pointer">
                            <input
                                type="radio"
                                name="timeframe"
                                value={tf.value}
                                checked={selectedTimeframe === tf.value}
                                onChange={(e) => setSelectedTimeframe(e.target.value)}
                                className="hidden"
                            />
                            <span className={`block w-full py-2 rounded-md transition duration-200 text-sm font-medium ${selectedTimeframe === tf.value ? COLOR_ACCENT + ' text-white' : 'bg-stone-100 text-gray-700 hover:bg-stone-200'}`}>
                                {tf.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* 4. Representative Object */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                4. Objeto Representativo (PNL): <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-3 border border-stone-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 mb-2"
                value={selectedObject}
                onChange={(e) => {
                  setSelectedObject(e.target.value);
                  if (e.target.value !== 'Otro...') setCustomObject('');
                }}
              >
                <option value="" disabled>Selecciona un objeto...</option>
                {PREDEFINED_OBJECTS.map(obj => (
                  <option key={obj} value={obj}>{obj}</option>
                ))}
              </select>
              {(selectedObject === 'Otro...' || (!PREDEFINED_OBJECTS.includes(selectedObject) && selectedObject !== '')) && (
                <input
                  type="text"
                  className="w-full p-3 border border-stone-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  value={customObject}
                  onChange={(e) => setCustomObject(e.target.value)}
                  placeholder="Describe tu objeto personalizado (Ej: Un reloj oxidado)"
                />
              )}
            </div>
            
            {/* 5. Emotional Load */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                5. Carga Emocional (1-5): <span className="text-red-500">* ({carga})</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={carga}
                onChange={(e) => setCarga(parseInt(e.target.value))}
                className="w-full h-2 bg-stone-300 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full focus:outline-none"
              />
            </div>

            {/* 6. Thought Frequency */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    6. Frecuencia del Pensamiento: <span className="text-red-500 ml-1">*</span> <Repeat size={16} className="ml-2 text-purple-500"/>
                </label>
                <div className="flex justify-around space-x-2 bg-white p-2 rounded-lg border border-stone-300">
                    {FREQUENCIES.map(f => (
                        <label key={f.value} className="flex-1 text-center cursor-pointer">
                            <input
                                type="radio"
                                name="frequency"
                                value={f.value}
                                checked={selectedFrequency === f.value}
                                onChange={(e) => setSelectedFrequency(e.target.value)}
                                className="hidden"
                            />
                            <span className={`block w-full py-2 rounded-md transition duration-200 text-sm font-medium ${selectedFrequency === f.value ? COLOR_ACCENT + ' text-white' : 'bg-stone-100 text-gray-700 hover:bg-stone-200'}`}>
                                {f.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <ParameterBuilder />

            <button
              onClick={generateReframe}
              disabled={loading || !authReady || !situacion.trim() || !getFinalObject().trim() || selectedEmotions.length === 0 || !selectedTimeframe || !selectedFrequency}
              className={`w-full py-3 px-4 rounded-lg font-bold text-lg text-white transition duration-300 shadow-md ${COLOR_ACCENT} disabled:opacity-50 flex items-center justify-center`}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" /> Generando Reencuadre...
                </>
              ) : (
                <>
                  <Zap size={20} className="mr-2" /> Reencuadrar Ahora
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
                <p className="font-bold flex items-center"><AlertTriangle size={18} className="mr-2"/> Error de Validación:</p>
                <p className='text-sm'>{error}</p>
              </div>
            )}
          </div>

          {/* CENTRAL COLUMN: RESULTS */}
          <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl shadow-2xl space-y-6">
            <h2 className="text-2xl font-bold text-white border-b border-gray-700 pb-2 flex items-center">
                <Brain size={24} className="mr-2 text-emerald-400"/> Reencuadre Generado
            </h2>
            
            <div className="min-h-[200px] flex items-center justify-center">
                {result ? (
                    <ResultDisplay text={result} />
                ) : (
                    <div className="text-center p-10 text-gray-500 bg-gray-900 rounded-lg w-full">
                        <Zap size={48} className="mx-auto text-emerald-400 mb-3"/>
                        <p className="text-lg font-semibold">Esperando la descripción de tu situación</p>
                        <p className="text-sm mt-1">Completa los campos y presiona "Reencuadrar Ahora" para comenzar el proceso de transformación.</p>
                    </div>
                )}
            </div>
          </div>
          
          {/* HISTORY COLUMN (Mobile: below central): HISTORY */}
          <div className="lg:col-span-3 bg-stone-100 p-6 rounded-xl shadow-2xl space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center">
                <History size={24} className="mr-2 text-gray-600"/> Historial de Reencuadres ({history.length})
            </h2>
            <div className="space-y-3">
              {history.length > 0 ? (
                history.map(item => <HistoryItem key={item.id} item={item} />)
              ) : (
                <div className="text-center p-5 text-gray-500 bg-white rounded-lg border border-stone-200">
                    <p className="text-sm">No hay sesiones guardadas todavía.</p>
                </div>
              )}
            </div>
          </div>

        </main>
        
        <footer className="text-center mt-10 text-sm text-gray-500">
            Desarrollado con React, Tailwind CSS y Firebase Firestore.
        </footer>

      </div>
    </div>
  );
}

export default App;