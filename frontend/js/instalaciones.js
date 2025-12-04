// Carga y filtrado de instalaciones usando apiGetInstallations (fetch nativo desde api.js)

// Array en memoria
let allInstallations = [];

// Comprueba si hay sesión de usuario (token en localStorage)
function isUserLoggedIn() {
  try {
    if (typeof getAuthToken === "function") {
      return !!getAuthToken();
    }
  } catch (e) {
    // ignoramos errores de lectura
  }
  try {
    return !!localStorage.getItem("aytodeporte_token");
  } catch (_) {
    return false;
  }
}

// Mapeo de tipos técnicos → texto amigable
function mapTypeToLabel(type) {
  if (!type) return "Sin tipo";
  const normalized = String(type).toUpperCase();
  switch (normalized) {
    case "PADEL":
    case "PÁDEL":
    case "PADEL_VIEJA":
    case "PADEL_NUEVA":
      return "Pádel";
    case "TENIS":
      return "Tenis";
    case "CAMPO_FUTBOL":
    case "FUTBOL":
    case "FÚTBOL":
      return "Fútbol";
    case "MULTIUSO":
    case "MULTIPISTA":
      return "Multiuso";
    default:
      return normalized.charAt(0) + normalized.slice(1).toLowerCase();
  }
}

function getInstallationName(inst) {
  return inst.name || inst.nombre || `Instalación #${inst.id ?? ""}`.trim();
}

function isActive(inst) {
  if (typeof inst.active === "boolean") return inst.active;
  if (typeof inst.activa === "boolean") return inst.activa;
  return true; 
}

// ================== HELPERS DE FILTRO ==================

function matchesTypeFilter(inst, typeValue) {
  if (!typeValue) return true;

  const rawType = (inst.type || inst.tipo || "").toString().toUpperCase();

  switch (typeValue) {
    case "PADEL":
      
      return rawType.startsWith("PADEL");

    case "TENIS":
      return rawType.startsWith("TENIS");

    case "FUTBOL":
      
      return (
        rawType.startsWith("CAMPO_FUTBOL") ||
        rawType.startsWith("FUTBOL")
      );

    case "MULTIUSO":
      
      return (
        rawType.startsWith("MULTIPISTA") ||
        rawType.startsWith("MULTIUSO")
      );

    default:
      return rawType === typeValue;
  }
}

// ============ CARGA PRINCIPAL ============

async function loadInstallations() {
  const listEl = document.getElementById("installationsList");
  const emptyEl = document.getElementById("installationsEmptyMessage");
  const errorEl = document.getElementById("installationsErrorMessage");

  if (!listEl) return;

  listEl.setAttribute("aria-busy", "true");
  if (emptyEl) emptyEl.hidden = true;
  if (errorEl) errorEl.hidden = true;

  try {
    console.log("🔄 Cargando instalaciones vía apiGetInstallations...");
    const data = await apiGetInstallations(); 

    allInstallations = Array.isArray(data) ? data : [];
    applyFiltersAndRender();
  } catch (error) {
    console.error("Error cargando instalaciones:", error);
    listEl.innerHTML = "";
    if (errorEl) {
      errorEl.hidden = false;

      if (!isUserLoggedIn()) {
        // Invitado → mensaje limpio de login
        errorEl.textContent = "Inicia sesión para ver las instalaciones.";
      } else {
        // Logueado → mensaje genérico de error
        errorEl.textContent = "Ha ocurrido un error al cargar las instalaciones.";
      }
    }
  } finally {
    listEl.setAttribute("aria-busy", "false");
  }
}

// ============ FILTROS Y RENDER ============

function applyFiltersAndRender() {
  const searchInput = document.getElementById("searchInstallations");
  const typeFilter = document.getElementById("typeFilter");
  const listEl = document.getElementById("installationsList");
  const emptyEl = document.getElementById("installationsEmptyMessage");
  const countEl = document.getElementById("installationsCount");

  if (!listEl) return;

  const searchText = (searchInput?.value || "").trim().toLowerCase();
  const typeValue = (typeFilter?.value || "").toUpperCase();

  let filtered = allInstallations.filter((inst) => isActive(inst));

  // Búsqueda por texto
  if (searchText) {
    filtered = filtered.filter((inst) => {
      const name = getInstallationName(inst).toLowerCase();
      const typeLabel = mapTypeToLabel(inst.type || inst.tipo).toLowerCase();
      return (
        name.includes(searchText) ||
        typeLabel.includes(searchText)
      );
    });
  }

  // Filtro por tipo
  if (typeValue) {
    filtered = filtered.filter((inst) => matchesTypeFilter(inst, typeValue));
  }

  renderInstallations(filtered);

  if (countEl) {
    const n = filtered.length;
    countEl.textContent = n === 1 ? "1 instalación" : `${n} instalaciones`;
  }

  if (emptyEl) {
    emptyEl.hidden = filtered.length > 0;
  }
}

function renderInstallations(list) {
  const listEl = document.getElementById("installationsList");
  if (!listEl) return;

  listEl.innerHTML = "";

  if (!list || list.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  list.forEach((inst) => {
    const card = document.createElement("article");
    card.className = "installation-card";

    const name = getInstallationName(inst);
    const typeLabel = mapTypeToLabel(inst.type || inst.tipo);
    const active = isActive(inst);

    card.innerHTML = `
      <div class="installation-card-header">
        <div>
          <h2 class="installation-name">${name}</h2>
          <div class="installation-type">${typeLabel}</div>
        </div>
        <span class="chip ${active ? "chip-active" : "chip-inactive"}">
          ${active ? "Disponible" : "No disponible"}
        </span>
      </div>

      <div class="installation-card-footer">
        <button class="btn btn-secondary btn-compact" data-id="${inst.id ?? ""}">
          Ver disponibilidad
        </button>
      </div>
    `;

    const btn = card.querySelector("button");
    if (btn && inst.id != null) {
      btn.addEventListener("click", () => {
        const id = encodeURIComponent(inst.id);
        window.location.href = `reservas.html?installationId=${id}`;
      });
    }

    fragment.appendChild(card);
  });

  listEl.appendChild(fragment);
}

// ============ EVENTOS ============

document.addEventListener("DOMContentLoaded", () => {
  loadInstallations();

  const searchInput = document.getElementById("searchInstallations");
  const typeFilter = document.getElementById("typeFilter");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyFiltersAndRender();
    });
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", () => {
      applyFiltersAndRender();
    });
  }
});
