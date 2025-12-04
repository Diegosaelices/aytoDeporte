// Ajusta el hero de la home según si el usuario está logueado o no.

function isUserLoggedInHome() {
  try {
    if (typeof getAuthToken === "function") {
      return !!getAuthToken();
    }
  } catch (e) {
    // ignoramos errores
  }
  try {
    return !!localStorage.getItem("aytodeporte_token");
  } catch (_) {
    return false;
  }
}

function updateHomeHeroForSession() {
  const hero = document.getElementById("home-hero");
  if (!hero) return;

  const loggedIn = isUserLoggedInHome();

  const titleEl = document.getElementById("home-hero-title");
  const textEl = document.getElementById("home-hero-text");
  const actionsEl = document.getElementById("home-hero-actions");

  if (!loggedIn) {
    // Invitado: dejamos el contenido tal cual está en el HTML
    return;
  }

  // Usuario logueado: mensaje distinto
  const nombre =
    typeof getUserName === "function" && getUserName()
      ? getUserName()
      : typeof getUserEmail === "function" && getUserEmail()
      ? getUserEmail()
      : "";

  if (titleEl) {
    titleEl.textContent = nombre
      ? `Hola, ${nombre}. Gestiona tus reservas deportivas.`
      : "Gestiona tus reservas deportivas de forma rápida";
  }

  if (textEl) {
    textEl.textContent =
      "Accede directamente a tus reservas, consulta tus próximas pistas y revisa tu historial desde tu perfil.";
  }

  if (actionsEl) {
    actionsEl.innerHTML = `
      <a href="reservas.html" class="btn btn-primary">Ir a Reservas</a>
      <a href="perfil.html" class="btn btn-secondary">Mi perfil</a>
    `;
  }
}

// Ejecutar cuando el DOM está listo
document.addEventListener("DOMContentLoaded", updateHomeHeroForSession);
// Y también cuando se cargue el header/footer vía include.js (por si acaso)
document.addEventListener("includesLoaded", updateHomeHeroForSession);
