// Módulo de autenticación del front: gestión de login, logout y datos de sesión del usuario.
// Usa localStorage para guardar token, rol, email, nombre e id devueltos por el backend.

// GESTIÓN DE DATOS DE SESIÓN

function saveAuthData(loginResponse) {
  localStorage.setItem("aytodeporte_token", loginResponse.token);
  localStorage.setItem("aytodeporte_user_email", loginResponse.email);
  localStorage.setItem("aytodeporte_user_rol", loginResponse.rol);

  if (loginResponse.nombre) {
    localStorage.setItem("aytodeporte_user_nombre", loginResponse.nombre);
  } else {
    localStorage.removeItem("aytodeporte_user_nombre");
  }

  if (loginResponse.id != null) {
    localStorage.setItem("aytodeporte_user_id", String(loginResponse.id));
  } else {
    localStorage.removeItem("aytodeporte_user_id");
  }
}

function getAuthToken() {
  return localStorage.getItem("aytodeporte_token");
}

function getUserRole() {
  return localStorage.getItem("aytodeporte_user_rol");
}

function getUserEmail() {
  return localStorage.getItem("aytodeporte_user_email");
}

function getUserName() {
  return localStorage.getItem("aytodeporte_user_nombre");
}

// Devuelve el id de usuario como número o null si no es válido
function getUserId() {
  const raw = localStorage.getItem("aytodeporte_user_id");
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

function logout() {
  localStorage.removeItem("aytodeporte_token");
  localStorage.removeItem("aytodeporte_user_email");
  localStorage.removeItem("aytodeporte_user_rol");
  localStorage.removeItem("aytodeporte_user_nombre");
  localStorage.removeItem("aytodeporte_user_id");
  window.location.href = "index.html";
}

// LOGIN (FORMULARIO + API) 

async function handleLoginSubmit(event) {
  event.preventDefault();

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorEl = document.getElementById("login-error");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value.trim() : "";
  const payload = { email, password };

  if (errorEl) {
    errorEl.style.display = "none";
    errorEl.textContent = "";
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let msg = "Error al iniciar sesión";

      // Intentamos leer el mensaje de error del backend
      try {
        const data = await response.json();
        if (data && data.error) {
          msg = data.error;
        }
      } catch (e) {}

      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = "block";
      }
      return;
    }

    const loginData = await response.json();

    // Guardamos token y datos del usuario en localStorage
    saveAuthData(loginData);

    // Redirección tras login correcto
    window.location.href = "index.html";
  } catch (err) {
    console.error("Error en login:", err);
    if (errorEl) {
      errorEl.textContent = "No se ha podido conectar con el servidor.";
      errorEl.style.display = "block";
    }
  }
}

// Asocia el handler de login cuando el DOM está listo
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (form) {
    form.addEventListener("submit", handleLoginSubmit);
  }
});
