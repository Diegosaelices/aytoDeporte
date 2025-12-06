// Panel de control ADMIN: bloqueos, instalaciones y gestión básica de usuarios.

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

/* ==== Arranque del panel y control de permisos ==== */

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("admin-blocks-container");
  const grid = document.getElementById("admin-blocks-grid");

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

  if (grid) grid.style.display = "grid";

  initAdminControlPanel();
});

/* ==== Panel principal: inicializa cada módulo ==== */

async function initAdminControlPanel() {
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
  await refreshBlocksList(filterSelect ? filterSelect.value : "");

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

        if (filterSelect) {
          await refreshBlocksList(filterSelect.value);
        } else {
          await refreshBlocksList("");
        }

        const reasonInput = document.getElementById("block-reason");
        if (reasonInput) reasonInput.value = "";
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

    const fragment = document.createDocumentFragment();

    blocks.forEach((b) => {
      const card = document.createElement("article");
      card.className = "installation-card";

      const installationName =
        b.installationName || "Todas las instalaciones";

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
          } catch (err) {
            console.error("Error eliminando bloqueo:", err);
            alert(
              err && err.message
                ? err.message
                : "No se ha podido eliminar el bloqueo."
            );
          }
        });
      }

      fragment.appendChild(card);
    });

    listEl.appendChild(fragment);
  } catch (err) {
    console.error("Error obteniendo bloqueos:", err);
    if (emptyEl) {
      emptyEl.textContent =
        "No se han podido cargar los bloqueos. Inténtalo más tarde.";
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
    } catch (err) {
      console.error("Error guardando instalación:", err);
      if (errorEl) {
        errorEl.textContent =
          err && err.message
            ? err.message
            : "No se ha podido guardar la instalación.";
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
      typeof apiGetInstallations === "function"
        ? await apiGetInstallations()
        : [];

    if (!installations || !installations.length) {
      listEl.innerHTML = `
        <p class="empty-message">
          No hay instalaciones registradas todavía.
        </p>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    installations.forEach((inst) => {
      const card = document.createElement("article");
      card.className = "installation-card";

      const name = inst.name || inst.nombre || `Instalación ${inst.id}`;
      const type =
        inst.type ||
        inst.tipo ||
        inst.tipoInstalacion ||
        "Sin tipo";
      const number =
        inst.number ??
        inst.numero ??
        null;
      const active =
        inst.active !== undefined && inst.active !== null
          ? !!inst.active
          : true;

      const subtitleParts = [];
      subtitleParts.push(String(type));
      if (number != null) {
        subtitleParts.push(`Nº ${number}`);
      }
      if (!active) {
        subtitleParts.push("(Inactiva)");
      }

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
          } catch (err) {
            console.error("Error eliminando instalación:", err);
            alert(
              err && err.message
                ? err.message
                : "No se ha podido eliminar la instalación."
            );
          }
        }
      });

      fragment.appendChild(card);
    });

    listEl.appendChild(fragment);
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
  if (typeInput)
    typeInput.value =
      inst.type ||
      inst.tipo ||
      inst.tipoInstalacion ||
      "";
  if (activeInput) {
    const active =
      inst.active !== undefined && inst.active !== null
        ? !!inst.active
        : true;
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
    const users =
      typeof apiGetUsers === "function" ? await apiGetUsers() : [];

    if (!users || !users.length) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }

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
          } catch (err) {
            console.error("Error eliminando usuario:", err);
            alert(
              err && err.message
                ? err.message
                : "No se ha podido eliminar el usuario."
            );
          }
        });
      }

      fragment.appendChild(card);
    });

    listEl.appendChild(fragment);
  } catch (err) {
    console.error("Error obteniendo usuarios:", err);
    if (errorEl) {
      errorEl.style.display = "block";
      errorEl.textContent =
        "No se han podido cargar los usuarios: " + (err.message || "");
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

  document
    .getElementById("blockModalPrimary")
    ?.addEventListener("click", closeModal);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      closeModal();
    }
  });
}
