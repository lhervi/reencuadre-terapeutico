let isRequestInProgress = false;

async function handleAsk(prompt) {
  if (isRequestInProgress) return; // evita múltiples solicitudes

  isRequestInProgress = true;
  try {
    const response = await fetch("/.netlify/functions/chatgpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  } finally {
    isRequestInProgress = false;
  }
}
