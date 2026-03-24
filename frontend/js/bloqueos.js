// Panel de control ADMIN: bloqueos, instalaciones, gestión básica de usuarios y reservas.

/* ==== Utilidades de contexto y escape ==== */

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCurrentUserRole() {
  try {
    if (typeof getUserRole === "function") return getUserRole();
  } catch (_) {}
  try {
    return localStorage.getItem("aytodeporte_user_rol") || null;
  } catch (_) {
    return null;
  }
}

function getCurrentUserId() {
  try {
    if (typeof getUserId === "function") return getUserId();
  } catch (_) {}
  try {
    const v = localStorage.getItem("aytodeporte_user_id");
    return v ? Number(v) : null;
  } catch (_) {
    return null;
  }
}

/* ==== Router simple de vistas del admin ==== */

const ADMIN_VIEWS = {
  menu: {
    title: "Menú de administración",
    subtitle: "Elige qué deseas gestionar."
  },
  "create-block": {
    title: "Bloqueo de instalaciones",
    subtitle: "Crea bloqueos por días completos o franjas horarias."
  },
  "current-blocks": {
    title: "Bloqueos actuales",
    subtitle: "Consulta y elimina bloqueos existentes."
  },
  installations: {
    title: "Gestión de instalaciones",
    subtitle: "Crear, editar, activar/desactivar o eliminar instalaciones."
  },
  users: {
    title: "Gestión de usuarios",
    subtitle: "Consulta y elimina usuarios del sistema."
  },
  reservations: {
    title: "Gestión de reservas",
    subtitle: "Consulta y cancela reservas activas."
  }
};

function setAdminTopbar(viewKey) {
  const topbar = document.getElementById("admin-topbar");
  const titleEl = document.getElementById("admin-view-title");
  const subtitleEl = document.getElementById("admin-view-subtitle");

  if (!topbar || !titleEl || !subtitleEl) return;

  const meta = ADMIN_VIEWS[viewKey] || ADMIN_VIEWS.menu;
  titleEl.textContent = meta.title;
  subtitleEl.textContent = meta.subtitle;

  topbar.style.display = viewKey === "menu" ? "none" : "block";
}

function hideAllAdminViews() {
  const hub = document.getElementById("admin-hub");
  const grid = document.getElementById("admin-blocks-grid");

  const views = [
    "admin-view-create-block",
    "admin-view-current-blocks",
    "admin-view-installations",
    "admin-view-users",
    "admin-view-reservations"
  ];

  if (hub) hub.style.display = "none";
  views.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  if (grid) grid.style.display = "none";
}

function showAdminView(viewKey) {
  hideAllAdminViews();

  if (viewKey === "menu") {
    const hub = document.getElementById("admin-hub");
    if (hub) hub.style.display = "block";
    setAdminTopbar("menu");
    return;
  }

  const grid = document.getElementById("admin-blocks-grid");
  if (grid) grid.style.display = "grid";

  setAdminTopbar(viewKey);

  const map = {
    "create-block": "admin-view-create-block",
    "current-blocks": "admin-view-current-blocks",
    installations: "admin-view-installations",
    users: "admin-view-users",
    reservations: "admin-view-reservations"
  };

  const id = map[viewKey];
  const el = id ? document.getElementById(id) : null;
  if (el) el.style.display = "block";
}

/* ==== Hub counters ==== */

function setHubCount(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value == null ? "—" : String(value);
}

async function refreshAdminHubCounters() {
  setHubCount("hub-count-create-block", "—");
  setHubCount("hub-count-current-blocks", "—");
  setHubCount("hub-count-installations", "—");
  setHubCount("hub-count-users", "—");
  setHubCount("hub-count-reservations", "Ver");

  try {
    const [blocks, installations, users] = await Promise.all([
      typeof apiGetBlocks === "function" ? apiGetBlocks(null) : Promise.resolve([]),
      typeof apiGetInstallations === "function" ? apiGetInstallations() : Promise.resolve([]),
      typeof apiGetUsers === "function" ? apiGetUsers() : Promise.resolve([])
    ]);

    const blocksCount = Array.isArray(blocks) ? blocks.length : 0;
    const instCount = Array.isArray(installations) ? installations.length : 0;
    const activeInstCount = Array.isArray(installations)
      ? installations.filter((i) => i && i.active !== false).length
      : 0;
    const usersCount = Array.isArray(users) ? users.length : 0;

    setHubCount("hub-count-create-block", `${activeInstCount} activas`);
    setHubCount("hub-count-current-blocks", blocksCount);
    setHubCount("hub-count-installations", instCount);
    setHubCount("hub-count-users", usersCount);
    setHubCount("hub-count-reservations", "Ver");
  } catch (e) {
    console.error("Error cargando contadores del hub:", e);
  }
}

/* ==== Arranque del panel y control de permisos ==== */

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("admin-blocks-container");
  if (!container) return;

  const role = getCurrentUserRole();
  if (role !== "ADMIN") {
    container.innerHTML = `
      <div class="section-box">
        <h2 class="section-title small-title">Acceso restringido</h2>
        <p class="section-subtitle">
          Esta sección solo está disponible para usuarios administradores.
          Si crees que se trata de un error, ponte en contacto con el ayuntamiento.
        </p>
        <div class="quick-links" style="margin-top: 10px;">
          <a href="index.html" class="quick-link">
            <span class="quick-link-title">Volver al inicio</span>
            <span class="quick-link-desc">Ir a la página principal</span>
          </a>
        </div>
      </div>
    `;
    return;
  }

  bindAdminHubNavigation();
  initAdminControlPanelOnce().then(async () => {
    await refreshAdminHubCounters();
    showAdminView("menu");
  });
});

function bindAdminHubNavigation() {
  const hub = document.getElementById("admin-hub");
  if (hub) hub.style.display = "block";

  document.querySelectorAll("[data-admin-go]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const key = a.getAttribute("data-admin-go");
      if (!key) return;
      showAdminView(key);
      onAdminViewEntered(key);
    });
  });

  const backBtn = document.getElementById("admin-back-to-menu");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      refreshAdminHubCounters().finally(() => showAdminView("menu"));
    });
  }
}

let _adminInitialized = false;

async function initAdminControlPanelOnce() {
  if (_adminInitialized) return;
  _adminInitialized = true;

  try {
    await initBlocksPanel();
  } catch (e) {
    console.error("Error inicializando bloqueos:", e);
  }

  try {
    await initInstallationsPanel();
  } catch (e) {
    console.error("Error inicializando instalaciones:", e);
  }

  try {
    await initUsersPanel();
  } catch (e) {
    console.error("Error inicializando usuarios:", e);
  }

  try {
    await initReservationsPanel();
  } catch (e) {
    console.error("Error inicializando reservas:", e);
  }
}

async function onAdminViewEntered(viewKey) {
  try {
    if (viewKey === "current-blocks") {
      const filterSelect = document.getElementById("block-filter-installation");
      await refreshBlocksList(filterSelect ? filterSelect.value : "");
    }
    if (viewKey === "installations") {
      await refreshInstallationList();
    }
    if (viewKey === "users") {
      await refreshUsersList();
    }
    if (viewKey === "reservations") {
      const filterSelect = document.getElementById("reservations-filter-installation");
      await refreshReservationsList(filterSelect ? filterSelect.value : "");
    }
  } catch (e) {
    console.error("Error refrescando vista admin:", viewKey, e);
  }
}

/* ********************************************************************
 * BLOQUEOS
 * ******************************************************************** */

async function initBlocksPanel() {
  const installationSelect = document.getElementById("block-installation");
  const filterSelect = document.getElementById("block-filter-installation");
  const form = document.getElementById("block-form");
  const errorEl = document.getElementById("block-error");
  const fillFullDayBtn = document.getElementById("block-fill-full-day");

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const startDateInput = document.getElementById("block-start-date");
  const endDateInput = document.getElementById("block-end-date");
  const startTimeInput = document.getElementById("block-start-time");
  const endTimeInput = document.getElementById("block-end-time");

  if (startDateInput && !startDateInput.value) startDateInput.value = todayStr;
  if (endDateInput && !endDateInput.value) endDateInput.value = todayStr;
  if (startTimeInput && !startTimeInput.value) startTimeInput.value = "08:00";
  if (endTimeInput && !endTimeInput.value) endTimeInput.value = "23:00";

  if (fillFullDayBtn) {
    fillFullDayBtn.addEventListener("click", () => {
      if (startDateInput && endDateInput) {
        endDateInput.value = startDateInput.value || todayStr;
      }
      if (startTimeInput) startTimeInput.value = "08:00";
      if (endTimeInput) endTimeInput.value = "23:00";
    });
  }

  await loadInstallationsForBlocks(installationSelect, filterSelect);

  if (filterSelect) {
    filterSelect.addEventListener("change", async () => {
      await refreshBlocksList(filterSelect.value);
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (errorEl) {
        errorEl.style.display = "none";
        errorEl.textContent = "";
      }

      const installationIdRaw = installationSelect ? installationSelect.value : "";
      const installationId = installationIdRaw ? Number(installationIdRaw) : null;

      const startDate = startDateInput?.value;
      const startTime = startTimeInput?.value;
      const endDate = endDateInput?.value;
      const endTime = endTimeInput?.value;
      const reason = (document.getElementById("block-reason")?.value || "").trim();

      if (!startDate || !startTime || !endDate || !endTime || !reason) {
        showBlockError("Rellena todos los campos obligatorios.", errorEl);
        return;
      }

      const start = `${startDate}T${startTime}`;
      const end = `${endDate}T${endTime}`;

      if (start >= end) {
        showBlockError("La fecha/hora de inicio debe ser anterior a la de fin.", errorEl);
        return;
      }

      const userId = getCurrentUserId();
      if (!userId) {
        showBlockError("No se ha podido determinar el usuario actual.", errorEl);
        return;
      }

      const payload = {
        installationId,
        createdByUserId: userId,
        reason,
        start,
        end
      };

      const submitBtn = document.getElementById("block-submit");
      if (submitBtn) submitBtn.disabled = true;

      try {
        await apiCreateBlock(payload);

        showBlockModal({
          icon: "✅",
          title: "Bloqueo creado",
          text: "El bloqueo se ha creado correctamente. La disponibilidad de las instalaciones se actualizará en las reservas.",
          primaryLabel: "Aceptar"
        });

        const filterSelectNow = document.getElementById("block-filter-installation");
        await refreshBlocksList(filterSelectNow ? filterSelectNow.value : "");

        const reasonInput = document.getElementById("block-reason");
        if (reasonInput) reasonInput.value = "";

        refreshAdminHubCounters();
      } catch (err) {
        console.error("Error creando bloqueo:", err);
        showBlockError(
          err && err.message
            ? err.message
            : "No se ha podido crear el bloqueo. Revisa los datos o inténtalo de nuevo.",
          errorEl
        );
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}

function showBlockError(msg, errorEl) {
  if (!errorEl) return;
  errorEl.textContent = msg;
  errorEl.style.display = "block";
}

async function loadInstallationsForBlocks(installationSelect, filterSelect) {
  try {
    let installations = [];
    if (typeof apiGetInstallations === "function") {
      installations = await apiGetInstallations();
    }

    window._blocksInstallations = installations;

    if (installationSelect) {
      const options = installations
        .filter((inst) => inst.active !== false)
        .map(
          (inst) =>
            `<option value="${inst.id}">${escapeHtml(
              inst.name || inst.nombre || `Instalación ${inst.id}`
            )}</option>`
        )
        .join("");
      installationSelect.innerHTML =
        `<option value="">Todas las instalaciones (bloqueo global)</option>` +
        options;
    }

    if (filterSelect) {
      const options = installations
        .filter((inst) => inst.active !== false)
        .map(
          (inst) =>
            `<option value="${inst.id}">${escapeHtml(
              inst.name || inst.nombre || `Instalación ${inst.id}`
            )}</option>`
        )
        .join("");
      filterSelect.innerHTML =
        `<option value="">Todas las instalaciones</option>` + options;
    }
  } catch (err) {
    console.error("Error cargando instalaciones para bloqueos:", err);
    if (installationSelect) {
      installationSelect.innerHTML =
        `<option value="">Error al cargar instalaciones</option>`;
    }
    if (filterSelect) {
      filterSelect.innerHTML =
        `<option value="">Error al cargar instalaciones</option>`;
    }
  }
}

async function refreshBlocksList(installationId) {
  const listEl = document.getElementById("block-list");
  const emptyEl = document.getElementById("block-empty");
  if (!listEl) return;

  listEl.innerHTML = "";
  if (emptyEl) emptyEl.style.display = "none";

  try {
    const blocks = await apiGetBlocks(installationId || null);

    if (!blocks || !blocks.length) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }

    const grid = document.createElement("div");
    grid.className = "admin-cards-grid";
    listEl.appendChild(grid);

    const fragment = document.createDocumentFragment();

    blocks.forEach((b) => {
      const card = document.createElement("article");
      card.className = "installation-card";

      const installationName = b.installationName || "Todas las instalaciones";
      const startStr = (b.start || "").replace("T", " ");
      const endStr = (b.end || "").replace("T", " ");

      card.innerHTML = `
        <div class="installation-card-header">
          <div>
            <div class="installation-name">
              ${escapeHtml(installationName)}
            </div>
            <div class="installation-type">
              ${escapeHtml(b.reason || "")}
            </div>
          </div>
          <span class="chip chip-soft">
            ID bloqueo: ${b.id}
          </span>
        </div>
        <div class="installation-body">
          <div class="installation-location">
            <strong>Desde:</strong> ${escapeHtml(startStr)}<br />
            <strong>Hasta:</strong> ${escapeHtml(endStr)}
          </div>
          <div class="installation-tags" style="margin-top:6px;">
            <span class="pill">Creado por: ${escapeHtml(b.createdByEmail || "")}</span>
            <span class="pill pill-outline">Creado en: ${escapeHtml(
              (b.createdAt || "").replace("T", " ")
            )}</span>
          </div>
        </div>
        <div class="installation-card-footer">
          <button class="btn btn-secondary btn-compact" data-id="${b.id}">
            Eliminar bloqueo
          </button>
        </div>
      `;

      const btn = card.querySelector("button");
      if (btn) {
        btn.addEventListener("click", async () => {
          try {
            await apiDeleteBlock(b.id);

            showBlockModal({
              icon: "✅",
              title: "Bloqueo eliminado",
              text: "El bloqueo se ha eliminado correctamente.",
              primaryLabel: "Aceptar"
            });

            await refreshBlocksList(installationId || "");
            refreshAdminHubCounters();
          } catch (err) {
            console.error("Error eliminando bloqueo:", err);
            alert(
              err && err.message ? err.message : "No se ha podido eliminar el bloqueo."
            );
          }
        });
      }

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  } catch (err) {
    console.error("Error obteniendo bloqueos:", err);
    if (emptyEl) {
      emptyEl.textContent = "No se han podido cargar los bloqueos. Inténtalo más tarde.";
      emptyEl.style.display = "block";
    }
  }
}

/* ********************************************************************
 * INSTALACIONES (CRUD básico, ADMIN)
 * ******************************************************************** */

let installationEditingId = null;

async function initInstallationsPanel() {
  const form = document.getElementById("installation-form");
  if (!form) return;

  await refreshInstallationList();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("installation-name");
    const numberInput = document.getElementById("installation-number");
    const typeInput = document.getElementById("installation-type");
    const activeInput = document.getElementById("installation-active");
    const errorEl = document.getElementById("installation-error");
    const successEl = document.getElementById("installation-success");
    const submitBtn = document.getElementById("installation-submit");

    if (errorEl) {
      errorEl.style.display = "none";
      errorEl.textContent = "";
    }
    if (successEl) {
      successEl.style.display = "none";
      successEl.textContent = "";
    }

    const name = (nameInput?.value || "").trim();
    const type = (typeInput?.value || "").trim();
    const numberStr = (numberInput?.value || "").trim();
    const number = numberStr ? Number(numberStr) : null;
    const active = !!(activeInput && activeInput.checked);

    if (!name || !type) {
      if (errorEl) {
        errorEl.textContent = "Nombre y tipo de instalación son obligatorios.";
        errorEl.style.display = "block";
      }
      return;
    }

    const payload = {
      name,
      type,
      number,
      pricePerHour: null,
      active
    };

    if (submitBtn) submitBtn.disabled = true;

    try {
      if (installationEditingId != null) {
        await apiUpdateInstallation(installationEditingId, payload);
        if (successEl) {
          successEl.textContent = "Instalación actualizada correctamente.";
          successEl.style.display = "block";
        }
      } else {
        await apiCreateInstallation(payload);
        if (successEl) {
          successEl.textContent = "Instalación creada correctamente.";
          successEl.style.display = "block";
        }
      }

      installationEditingId = null;
      const idHidden = document.getElementById("installation-id");
      if (idHidden) idHidden.value = "";
      if (nameInput) nameInput.value = "";
      if (numberInput) numberInput.value = "";
      if (typeInput) typeInput.value = "";
      if (activeInput) activeInput.checked = true;

      await refreshInstallationList();
      await loadInstallationsForBlocks(
        document.getElementById("block-installation"),
        document.getElementById("block-filter-installation")
      );

      refreshAdminHubCounters();
    } catch (err) {
      console.error("Error guardando instalación:", err);
      if (errorEl) {
        errorEl.textContent =
          err && err.message ? err.message : "No se ha podido guardar la instalación.";
        errorEl.style.display = "block";
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

async function refreshInstallationList() {
  const listEl = document.getElementById("installation-list");
  if (!listEl) return;

  listEl.innerHTML = "";

  try {
    const installations =
      typeof apiGetInstallations === "function" ? await apiGetInstallations() : [];

    if (!installations || !installations.length) {
      listEl.innerHTML = `
        <p class="empty-message">
          No hay instalaciones registradas todavía.
        </p>
      `;
      return;
    }

    const grid = document.createElement("div");
    grid.className = "admin-cards-grid";
    listEl.appendChild(grid);

    const fragment = document.createDocumentFragment();

    installations.forEach((inst) => {
      const card = document.createElement("article");
      card.className = "installation-card";

      const name = inst.name || inst.nombre || `Instalación ${inst.id}`;
      const type = inst.type || inst.tipo || inst.tipoInstalacion || "Sin tipo";
      const number = inst.number ?? inst.numero ?? null;
      const active =
        inst.active !== undefined && inst.active !== null ? !!inst.active : true;

      const subtitleParts = [];
      subtitleParts.push(String(type));
      if (number != null) subtitleParts.push(`Nº ${number}`);
      if (!active) subtitleParts.push("(Inactiva)");

      card.innerHTML = `
        <div class="installation-card-header">
          <div>
            <div class="installation-name">${escapeHtml(name)}</div>
            <div class="installation-type">
              ${escapeHtml(subtitleParts.join(" · "))}
            </div>
          </div>
          <span class="chip chip-soft">
            ID: ${inst.id}
          </span>
        </div>
        <div class="installation-card-footer">
          <button class="btn btn-secondary btn-compact" data-action="edit" data-id="${inst.id}">
            Editar
          </button>
          <button class="btn btn-danger btn-compact" data-action="delete" data-id="${inst.id}">
            Eliminar
          </button>
        </div>
      `;

      card.addEventListener("click", async (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;

        const action = target.getAttribute("data-action");
        const idAttr = target.getAttribute("data-id");
        if (!action || !idAttr) return;

        const id = Number(idAttr);

        if (action === "edit") {
          e.preventDefault();
          e.stopPropagation();
          fillInstallationFormForEdit(inst);
        } else if (action === "delete") {
          e.preventDefault();
          e.stopPropagation();
          const confirmDelete = window.confirm(
            `¿Seguro que quieres eliminar la instalación "${name}"?`
          );
          if (!confirmDelete) return;

          try {
            await apiDeleteInstallation(id);
            showBlockModal({
              icon: "✅",
              title: "Instalación eliminada",
              text: "La instalación se ha eliminado correctamente.",
              primaryLabel: "Aceptar"
            });
            await refreshInstallationList();
            await loadInstallationsForBlocks(
              document.getElementById("block-installation"),
              document.getElementById("block-filter-installation")
            );
            refreshAdminHubCounters();
          } catch (err) {
            console.error("Error eliminando instalación:", err);
            alert(err && err.message ? err.message : "No se ha podido eliminar la instalación.");
          }
        }
      });

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  } catch (err) {
    console.error("Error obteniendo instalaciones:", err);
    listEl.innerHTML = `
      <p class="error-message">
        No se han podido cargar las instalaciones desde la API.
        <br />
        <span class="error-detail">${escapeHtml(err.message || "")}</span>
      </p>
    `;
  }
}

function fillInstallationFormForEdit(inst) {
  installationEditingId = inst.id;
  const idInput = document.getElementById("installation-id");
  const nameInput = document.getElementById("installation-name");
  const numberInput = document.getElementById("installation-number");
  const typeInput = document.getElementById("installation-type");
  const activeInput = document.getElementById("installation-active");
  const successEl = document.getElementById("installation-success");
  const errorEl = document.getElementById("installation-error");

  if (idInput) idInput.value = inst.id;
  if (nameInput) nameInput.value = inst.name || inst.nombre || "";
  if (numberInput) {
    const number = inst.number ?? inst.numero ?? "";
    numberInput.value = number !== null && number !== undefined ? String(number) : "";
  }
  if (typeInput) typeInput.value = inst.type || inst.tipo || inst.tipoInstalacion || "";
  if (activeInput) {
    const active =
      inst.active !== undefined && inst.active !== null ? !!inst.active : true;
    activeInput.checked = active;
  }

  if (successEl) {
    successEl.style.display = "none";
    successEl.textContent = "";
  }
  if (errorEl) {
    errorEl.style.display = "none";
    errorEl.textContent = "";
  }
}

/* ********************************************************************
 * USUARIOS (solo listado y eliminación, ADMIN)
 * ******************************************************************** */

async function initUsersPanel() {
  const listEl = document.getElementById("admin-users-list");
  if (!listEl) return;

  await refreshUsersList();
}

async function refreshUsersList() {
  const listEl = document.getElementById("admin-users-list");
  const emptyEl = document.getElementById("admin-users-empty");
  const errorEl = document.getElementById("admin-users-error");

  if (!listEl) return;

  listEl.innerHTML = "";
  if (emptyEl) emptyEl.style.display = "none";
  if (errorEl) {
    errorEl.style.display = "none";
    errorEl.textContent = "";
  }

  try {
    const users = typeof apiGetUsers === "function" ? await apiGetUsers() : [];

    if (!users || !users.length) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }

    const grid = document.createElement("div");
    grid.className = "admin-cards-grid";
    listEl.appendChild(grid);

    const fragment = document.createDocumentFragment();

    users.forEach((user) => {
      const card = document.createElement("article");
      card.className = "installation-card";

      const name =
        user.nombreCompleto ||
        user.fullName ||
        user.name ||
        `${user.nombre || ""} ${user.apellido || ""}`.trim() ||
        `Usuario ${user.id}`;

      const email = user.email || user.correo || "";
      const rol = user.rol || user.role || "";

      card.innerHTML = `
        <div class="installation-card-header">
          <div>
            <div class="installation-name">${escapeHtml(name)}</div>
            <div class="installation-type">
              ${escapeHtml(email)}
              ${rol ? " · " + escapeHtml(String(rol)) : ""}
            </div>
          </div>
          <span class="chip chip-soft">
            ID: ${user.id}
          </span>
        </div>
        <div class="installation-card-footer">
          <button class="btn btn-danger btn-compact" data-id="${user.id}">
            Eliminar usuario
          </button>
        </div>
      `;

      const btn = card.querySelector("button");
      if (btn) {
        btn.addEventListener("click", async () => {
          const confirmDelete = window.confirm(
            `¿Seguro que quieres eliminar al usuario "${name}"? Esta acción no se puede deshacer.`
          );
          if (!confirmDelete) return;

          try {
            await apiDeleteUser(user.id);
            showBlockModal({
              icon: "✅",
              title: "Usuario eliminado",
              text: "El usuario se ha eliminado correctamente.",
              primaryLabel: "Aceptar"
            });
            await refreshUsersList();
            refreshAdminHubCounters();
          } catch (err) {
            console.error("Error eliminando usuario:", err);
            alert(err && err.message ? err.message : "No se ha podido eliminar el usuario.");
          }
        });
      }

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  } catch (err) {
    console.error("Error obteniendo usuarios:", err);
    if (errorEl) {
      errorEl.style.display = "block";
      errorEl.textContent = "No se han podido cargar los usuarios: " + (err.message || "");
    }
  }
}

/* ********************************************************************
 * RESERVAS (listado y cancelación, ADMIN)
 * ******************************************************************** */

async function initReservationsPanel() {
  const filterSelect = document.getElementById("reservations-filter-installation");
  if (!filterSelect) return;

  try {
    const installations = typeof apiGetInstallations === "function"
      ? await apiGetInstallations()
      : [];

    installations.forEach((inst) => {
      const opt = document.createElement("option");
      opt.value = inst.id;
      opt.textContent = inst.name || inst.nombre || `Instalación ${inst.id}`;
      filterSelect.appendChild(opt);
    });
  } catch (e) {
    console.error("Error cargando instalaciones en filtro reservas:", e);
  }

  filterSelect.addEventListener("change", async () => {
    await refreshReservationsList(filterSelect.value);
  });
}

async function refreshReservationsList(installationId) {
  const listEl = document.getElementById("reservations-list");
  const emptyEl = document.getElementById("reservations-empty");
  const errorEl = document.getElementById("reservations-error");

  if (!listEl) return;

  listEl.innerHTML = '<p class="section-subtitle">Cargando reservas...</p>';
  if (emptyEl) emptyEl.style.display = "none";
  if (errorEl) { errorEl.style.display = "none"; errorEl.textContent = ""; }

  try {
    let reservations = [];

    if (installationId) {
      reservations = await apiFetch(`/reservations/installation/${installationId}`, { method: "GET" });
    } else {
      const installations = typeof apiGetInstallations === "function"
        ? await apiGetInstallations()
        : [];

      const results = await Promise.all(
        installations.map((inst) =>
          apiFetch(`/reservations/installation/${inst.id}`, { method: "GET" }).catch(() => [])
        )
      );
      reservations = results.flat();
    }

    listEl.innerHTML = "";

    if (!reservations || reservations.length === 0) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }

    reservations.sort((a, b) => new Date(a.start) - new Date(b.start));

    const grid = document.createElement("div");
    grid.className = "admin-cards-grid";
    listEl.appendChild(grid);

    const fragment = document.createDocumentFragment();

    reservations.forEach((res) => {
      const card = document.createElement("article");
      card.className = "installation-card";

      const startDate = res.start ? new Date(res.start) : null;
      const endDate = res.end ? new Date(res.end) : null;

      const formatDate = (d) => d
        ? d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "—";
      const formatTime = (d) => d
        ? d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        : "—";

      card.innerHTML = `
        <div class="installation-card-header">
          <div>
            <div class="installation-name">${escapeHtml(res.installationName || `Instalación ${res.installationId}`)}</div>
            <div class="installation-type">
              ${escapeHtml(res.userEmail || `Usuario ${res.userId}`)}
            </div>
          </div>
          <span class="chip chip-soft">
            Código: ${escapeHtml(res.code || "—")}
          </span>
        </div>
        <div class="installation-card-body" style="margin: 8px 0; font-size: 0.85rem; color: var(--color-text-soft, #666);">
          📅 ${formatDate(startDate)} &nbsp;·&nbsp;
          🕐 ${formatTime(startDate)} – ${formatTime(endDate)} &nbsp;·&nbsp;
          ⏱ ${res.durationMinutes || "—"} min &nbsp;·&nbsp;
          💶 ${res.amount != null ? res.amount + " €" : "—"}
        </div>
        <div class="installation-card-footer">
          <button class="btn btn-danger btn-compact" data-res-id="${res.id}" data-user-id="${res.userId}">
            Cancelar reserva
          </button>
        </div>
      `;

      const btn = card.querySelector("button");
      if (btn) {
        btn.addEventListener("click", async () => {
          const confirmCancel = window.confirm(
            `¿Seguro que quieres cancelar esta reserva?\n` +
            `Instalación: ${res.installationName || res.installationId}\n` +
            `Usuario: ${res.userEmail || res.userId}\n` +
            `Fecha: ${formatDate(startDate)} ${formatTime(startDate)}`
          );
          if (!confirmCancel) return;

          try {
            await apiCancelReservation(res.id, res.userId, true);
            showBlockModal({
              icon: "✅",
              title: "Reserva cancelada",
              text: "La reserva se ha cancelado correctamente.",
              primaryLabel: "Aceptar"
            });
            const filterSelect = document.getElementById("reservations-filter-installation");
            await refreshReservationsList(filterSelect ? filterSelect.value : "");
          } catch (err) {
            console.error("Error cancelando reserva:", err);
            alert(err && err.message ? err.message : "No se ha podido cancelar la reserva.");
          }
        });
      }

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);

  } catch (err) {
    console.error("Error obteniendo reservas:", err);
    listEl.innerHTML = "";
    if (errorEl) {
      errorEl.style.display = "block";
      errorEl.textContent = "No se han podido cargar las reservas: " + (err.message || "");
    }
  }
}

/* ********************************************************************
 * Modal de feedback reutilizable
 * ******************************************************************** */

function showBlockModal(options) {
  const { icon, title, text, primaryLabel } = options || {};

  const existing = document.getElementById("blockModalBackdrop");
  if (existing) existing.remove();

  const backdrop = document.createElement("div");
  backdrop.id = "blockModalBackdrop";
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <div class="modal-popup">
      <div class="modal-icon">${icon || "ℹ️"}</div>
      <h2 class="modal-title">${escapeHtml(title || "Operación completada")}</h2>
      <p class="modal-text">
        ${escapeHtml(text || "La operación se ha realizado correctamente.")}
      </p>
      <div class="modal-actions">
        <button id="blockModalPrimary" class="btn btn-primary">
          ${escapeHtml(primaryLabel || "Aceptar")}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.classList.add("modal-open");

  const closeModal = () => {
    document.body.classList.remove("modal-open");
    backdrop.remove();
  };

  document.getElementById("blockModalPrimary")?.addEventListener("click", closeModal);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      closeModal();
    }
  });
}
