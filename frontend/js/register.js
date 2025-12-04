// js/register.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  if (!form) return;

  const errorEl = document.getElementById("register-error");
  const submitBtn = document.getElementById("register-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (errorEl) {
      errorEl.style.display = "none";
      errorEl.textContent = "";
    }

    const nombre = document.getElementById("nombre")?.value.trim() || "";
    const apellido = document.getElementById("apellido")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";
    const password2 = document.getElementById("password2")?.value || "";

    // Validaciones frontend
    if (!nombre || !apellido || !email || !password || !password2) {
      return showRegisterError("Rellena todos los campos.");
    }

    if (password.length < 6) {
      return showRegisterError("La contraseña debe tener al menos 6 caracteres.");
    }

    if (password !== password2) {
      return showRegisterError("Las contraseñas no coinciden.");
    }

    const payload = { nombre, apellido, email, password };

    if (submitBtn) submitBtn.disabled = true;

    try {
      // 1) REGISTRAR USUARIO
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let msg = "No se ha podido completar el registro.";

        try {
          const data = await response.json();
          if (data && data.error) msg = data.error;
        } catch (_) {}

        return showRegisterError(msg);
      }

      // 2) LOGIN AUTOMÁTICO (MISMO ENDPOINT QUE EL LOGIN NORMAL)
      const loginResp = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!loginResp.ok) {
        return showRegisterError(
          "La cuenta se creó correctamente, pero no se pudo iniciar sesión automáticamente. Prueba a iniciar sesión desde la pantalla de acceso."
        );
      }

      const loginData = await loginResp.json();

      // Guardar datos de sesión usando auth.js (si existe)
      if (typeof saveAuthData === "function") {
        saveAuthData(loginData);
      } else {
        // Fallback por si acaso
        if (loginData.token) {
          localStorage.setItem("aytodeporte_token", loginData.token);
        }
        if (loginData.email) {
          localStorage.setItem("aytodeporte_user_email", loginData.email);
        }
        if (loginData.nombre) {
          localStorage.setItem("aytodeporte_user_nombre", loginData.nombre);
        }
        if (loginData.rol) {
          localStorage.setItem("aytodeporte_user_rol", loginData.rol);
        }
        if (loginData.id != null) {
          localStorage.setItem("aytodeporte_user_id", String(loginData.id));
        }
      }

      // 3) MODAL DE BIENVENIDA CON SESIÓN INICIADA
      const displayName =
        (loginData && (loginData.nombre || loginData.email)) ||
        nombre ||
        email;

      showWelcomeModal(displayName);

      form.reset();
    } catch (err) {
      console.error("Error en registro:", err);
      showRegisterError("No se ha podido conectar con el servidor.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});

function showRegisterError(message) {
  const errorEl = document.getElementById("register-error");
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.style.display = "block";
}

// MODAL GRANDE DE BIENVENIDA
function showWelcomeModal(nombre) {
  const existing = document.getElementById("welcomeModalBackdrop");
  if (existing) existing.remove();

  const backdrop = document.createElement("div");
  backdrop.id = "welcomeModalBackdrop";
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <div class="modal-popup">
      <div class="modal-icon">🎉</div>
      <h2 class="modal-title">¡Bienvenido/a ${escapeHtml(nombre)}!</h2>
      <p class="modal-text">
        Tu cuenta se ha creado correctamente y tu sesión ya está iniciada.
      </p>

      <div class="modal-actions">
        <button id="modalGoProfile" class="btn btn-primary">Ir a Mi perfil</button>
        <button id="modalGoHome" class="btn btn-secondary">Ir al inicio</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.classList.add("modal-open");

  document.getElementById("modalGoProfile")?.addEventListener("click", () => {
    window.location.href = "perfil.html";
  });

  document.getElementById("modalGoHome")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

// Reutilizamos el escapeHtml ya que lo tienes en otros scripts;
// si no, definimos uno básico aquí para evitar XSS:
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
