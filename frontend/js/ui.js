// ui.js
// Comportamiento general de la interfaz (navbar, año del footer, auth en el header, etc.)

// ====== ZONA DE USUARIO (login / logout en el header) ======

function buildNavAuth(retry = 0) {
  const navAuth = document.getElementById("nav-auth");

  if (!navAuth) {
    if (retry < 5) {
      setTimeout(() => buildNavAuth(retry + 1), 150);
    }
    return;
  }

  navAuth.innerHTML = "";

  // Enlaces de la nav que dependen de la sesión
  const linkMiPerfil = document.getElementById("link-mi-perfil");
  const linkBloqueos = document.getElementById("link-bloqueos-admin");

  // Funciones que vienen de auth.js
  const token = typeof getAuthToken === "function" ? getAuthToken() : null;
  const email = typeof getUserEmail === "function" ? getUserEmail() : null;
  const rol = typeof getUserRole === "function" ? getUserRole() : null;
  const nombre = typeof getUserName === "function" ? getUserName() : null;

  // Sin sesión: mostrar Iniciar sesión / Registrarse y ocultar "Mi perfil" + "Bloqueos"
  if (!token || !email) {
    if (linkMiPerfil) {
      linkMiPerfil.style.display = "none";
    }
    if (linkBloqueos) {
      linkBloqueos.style.display = "none";
    }

    const loginLink = document.createElement("a");
    loginLink.href = "login.html";
    loginLink.className = "nav-link nav-link-pill";
    loginLink.textContent = "Iniciar sesión";

    const registerLink = document.createElement("a");
    registerLink.href = "register.html";
    registerLink.className = "nav-link nav-link-pill";
    registerLink.textContent = "Registrarse";

    navAuth.appendChild(loginLink);
    navAuth.appendChild(registerLink);
    return;
  }

  // Con sesión: enseñar "Mi perfil" y, solo si es ADMIN, "Bloqueos"
  if (linkMiPerfil) {
    linkMiPerfil.style.display = "inline-block";
  }
  if (linkBloqueos) {
    linkBloqueos.style.display = rol === "ADMIN" ? "inline-block" : "none";
  }

  const label = document.createElement("span");
  label.className = "nav-user-label";

  const displayName =
    nombre && nombre.trim().length > 0
      ? nombre
      : email;

  label.textContent = `Hola, ${displayName}`;

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.className = "nav-logout-btn";
  logoutBtn.textContent = "Cerrar sesión";
  logoutBtn.addEventListener("click", () => {
    if (typeof logout === "function") {
      logout();
    } else {
      // Por si no se ha cargado auth.js
      localStorage.removeItem("aytodeporte_token");
      localStorage.removeItem("aytodeporte_user_email");
      localStorage.removeItem("aytodeporte_user_rol");
      localStorage.removeItem("aytodeporte_user_nombre");
      localStorage.removeItem("aytodeporte_user_id");
      window.location.href = "index.html";
    }
  });

  navAuth.appendChild(label);
  navAuth.appendChild(logoutBtn);
}

// ====== NAVBAR (modo móvil / hamburguesa) ======

function initNavToggle() {
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");

  if (!navToggle || !mainNav) {
    return;
  }

  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("nav-open");
    navToggle.classList.toggle("nav-open", isOpen);

    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

// ====== FOOTER: AÑO ACTUAL ======

function updateFooterYear() {

  const yearEl = document.querySelector("[data-current-year]");
  if (!yearEl) return;

  const currentYear = new Date().getFullYear();
  yearEl.textContent = currentYear;
}

// ====== MARCAR ENLACE ACTIVO EN LA NAV ======

function markActiveNavLink() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  const links = document.querySelectorAll(".main-nav .nav-link");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    if (href === currentPath || (currentPath === "" && href === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// ====== INICIALIZACIÓN GLOBAL DE UI ======

function initUI() {
  // Navbar móvil
  initNavToggle();

  // Año del footer
  updateFooterYear();

  // Enlace activo
  markActiveNavLink();

  // Construir zona de usuario (login / logout + Mi perfil + Bloqueos admin)
  buildNavAuth();
}

// Ejecutar al cargar el DOM (por si hay páginas sin include)
document.addEventListener("DOMContentLoaded", initUI);

// Ejecutar otra vez cuando header/footer se han inyectado por include.js
document.addEventListener("includesLoaded", initUI);
