/* ================= UTILIDADES ================= */

// Base64URL → ArrayBuffer
function base64urlToBuffer(base64url) {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const raw = atob(base64);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    buffer[i] = raw.charCodeAt(i);
  }
  return buffer;
}

// ArrayBuffer → Base64URL
function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/* ================= REGISTRO ================= */

async function register() {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    alert("Ingrese un usuario");
    return;
  }

  //Pedir opciones al backend
  const res = await fetch("/api/auth/register/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });

  const options = await res.json();

  if (!res.ok) {
    alert(options.error || "Error en registro");
    return;
  }

  options.challenge = base64urlToBuffer(options.challenge);
  options.user.id = base64urlToBuffer(options.user.id);

  options.rpId = window.location.hostname;

  const credential = await navigator.credentials.create({
    publicKey: options,
  });

  // Enviar resultado al backend
  const data = {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: bufferToBase64url(
        credential.response.attestationObject
      ),
      clientDataJSON: bufferToBase64url(
        credential.response.clientDataJSON
      ),
    },
  };

  const verify = await fetch("/api/auth/register/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (verify.ok) {
    alert("Usuario registrado correctamente");
  } else {
    alert("Error al finalizar registro");
  }
}

/* ================= LOGIN ================= */

async function login() {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    alert("Ingrese un usuario");
    return;
  }

  // Pedir challenge
  const res = await fetch("/api/auth/login/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });

  const options = await res.json();

  if (!res.ok) {
    alert(options.error || "Error de login");
    return;
  }

  options.challenge = base64urlToBuffer(options.challenge);
  options.allowCredentials = options.allowCredentials.map(c => ({
    ...c,
    id: base64urlToBuffer(c.id),
  }));

  options.rpId = window.location.hostname;

  // Popup de autenticación
  const assertion = await navigator.credentials.get({
    publicKey: options,
  });

  // Enviar verificación
  const data = {
    id: assertion.id,
    rawId: bufferToBase64url(assertion.rawId),
    type: assertion.type,
    response: {
      authenticatorData: bufferToBase64url(
        assertion.response.authenticatorData
      ),
      clientDataJSON: bufferToBase64url(
        assertion.response.clientDataJSON
      ),
      signature: bufferToBase64url(assertion.response.signature),
      userHandle: assertion.response.userHandle
        ? bufferToBase64url(assertion.response.userHandle)
        : null,
    },
  };

  const verify = await fetch("/api/auth/login/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (verify.ok) {
    window.location.href = "/dashboard.html";
  } else {
    alert("Error de autenticación");
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const regBtn = document.getElementById('btn-register');
    const logBtn = document.getElementById('btn-login');

    if (regBtn) regBtn.addEventListener('click', register);
    if (logBtn) logBtn.addEventListener('click', login);
});