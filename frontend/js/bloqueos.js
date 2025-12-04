// Panel de gestión de bloqueos para usuarios ADMIN: creación, listado y eliminación.
// Integra llamadas a la API, control de permisos y un modal de feedback.

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
  initBlocksPanel();
});

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
        showBlockError("Rellena todos los campos obligatorios.");
        return;
      }

      const start = `${startDate}T${startTime}`;
      const end = `${endDate}T${endTime}`;

      if (start >= end) {
        showBlockError("La fecha/hora de inicio debe ser anterior a la de fin.");
        return;
      }

      const userId = getCurrentUserId();
      if (!userId) {
        showBlockError("No se ha podido determinar el usuario actual.");
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
            : "No se ha podido crear el bloqueo. Revisa los datos o inténtalo de nuevo."
        );
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  function showBlockError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.style.display = "block";
  }
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
        ${escapeHtml(
          text ||
            "La operación se ha realizado correctamente."
        )}
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
