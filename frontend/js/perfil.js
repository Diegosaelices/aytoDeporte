// Página "Mi perfil": muestra datos básicos del usuario y sus reservas,
// permite filtrarlas y cancelar las que cumplan las reglas de negocio.

// Estado interno
const profileState = {
  reservations: [] // lista completa devuelta por la API
};

// Utilidad DOM
function $(selector) {
  return document.querySelector(selector);
}

// ===== Arranque =====
document.addEventListener("DOMContentLoaded", () => {
  initProfile();
});

async function initProfile() {
  const reservationsList = $("#reservationsList");
  if (!reservationsList) return; 

  const userEmailEl = $("#userEmail");
  const userNameEl = $("#userName");
  const filterSelect = $("#reservationsFilter");
  const countEl = $("#reservationsCount");
  const emptyMessage = $("#reservationsEmptyMessage");
  const errorMessage = $("#reservationsErrorMessage");

  // Mostrar info básica del usuario desde localStorage (si existe)
  const userId = typeof getUserId === "function" ? getUserId() : null;
  const userEmail =
    typeof getUserEmail === "function" ? getUserEmail() : null;
  const userName =
    typeof getUserName === "function" ? getUserName() : null;

  if (userEmailEl) {
    userEmailEl.textContent = userEmail || "Usuario sin sesión iniciada";
  }

  if (userNameEl) {
    userNameEl.textContent =
      (userName && userName.trim().length > 0)
        ? userName
        : (userEmail || "Invitado");
  }

  if (!userId) {
    // Si no hay usuario, mostramos mensaje y no pedimos reservas
    if (emptyMessage) {
      emptyMessage.hidden = false;
      emptyMessage.textContent =
        "Debes iniciar sesión para consultar tus reservas.";
    }
    if (countEl) {
      countEl.textContent = "0 reservas";
    }
    return;
  }

  // Función interna para cargar reservas desde la API
  async function loadReservations() {
    setReservationsLoading(true);
    if (errorMessage) {
      errorMessage.hidden = true;
      const span = errorMessage.querySelector(".error-detail");
      if (span) span.textContent = "";
    }

    try {
      let reservations = [];
      if (typeof apiGetUserReservations === "function") {
        reservations = await apiGetUserReservations(userId);
      } else {
        console.warn(
          "apiGetUserReservations no está definida. Usando datos mock."
        );
        reservations = [];
      }

      // Guardamos en estado
      profileState.reservations = Array.isArray(reservations)
        ? reservations
        : [];

      applyReservationFiltersAndRender();
    } catch (err) {
      console.error(err);
      if (errorMessage) {
        errorMessage.hidden = false;
        const span = errorMessage.querySelector(".error-detail");
        if (span) span.textContent = err.message || "Error desconocido.";
      }
      renderReservations([]);
      if (countEl) countEl.textContent = "0 reservas";
    } finally {
      setReservationsLoading(false);
    }
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      applyReservationFiltersAndRender();
    });
  }
  // Cargar reservas al entrar
  loadReservations();
}

/**
 * Aplica el filtro seleccionado (Próximas, Todas, Finalizadas, Canceladas)
 * y pinta las tarjetas.
 */
function applyReservationFiltersAndRender() {
  const filterSelect = $("#reservationsFilter");
  const countEl = $("#reservationsCount");
  const emptyMessage = $("#reservationsEmptyMessage");

  const all = profileState.reservations || [];
  const now = new Date();
  const filter = filterSelect ? filterSelect.value : "UPCOMING";

  let filtered = all.slice(); 

  filtered = filtered.filter((r) => !!r.start); 

  switch (filter) {
    case "UPCOMING":
      filtered = filtered.filter((r) => {
        if (r.status === "CANCELLED") return false;
        const start = new Date(r.start);
        return start >= now;
      });
      break;
    case "PAST":
      filtered = filtered.filter((r) => {
        if (r.status === "CANCELLED") return false;
        const start = new Date(r.start);
        return start < now;
      });
      break;
    case "CANCELLED":
      filtered = filtered.filter((r) => r.status === "CANCELLED");
      break;
    case "ALL":
    default:
      break;
  }

  // Orden por fecha de inicio ascendente
  filtered.sort((a, b) => new Date(a.start) - new Date(b.start));

  renderReservations(filtered);

  if (countEl) {
    const n = filtered.length;
    countEl.textContent =
      n === 1 ? "1 reserva mostrada" : `${n} reservas mostradas`;
  }

  if (emptyMessage) {
    emptyMessage.hidden = filtered.length > 0;
    if (filtered.length === 0 && profileState.reservations.length > 0) {
      emptyMessage.textContent = "No hay reservas que cumplan el filtro.";
    }
  }
}

/**
 * Pinta las tarjetas de reservas en la lista.
 */
function renderReservations(list) {
  const container = $("#reservationsList");
  const emptyMessage = $("#reservationsEmptyMessage");
  if (!container) return;

  container.innerHTML = "";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "12px";

  if (!list || list.length === 0) {
    if (emptyMessage && profileState.reservations.length === 0) {
      emptyMessage.hidden = false;
      emptyMessage.textContent = "No tienes reservas registradas todavía.";
    }
    return;
  }

  if (emptyMessage) emptyMessage.hidden = true;

  const now = new Date();

  list.forEach((res) => {
    const card = document.createElement("article");
    card.className = "installation-card";
    card.style.width = "100%";

    const installationName = res.installationName || "Instalación";
    const dateLabel = formatDateHuman(res.start);
    const timeRange = `${formatTimeHuman(res.start)} - ${formatTimeHuman(
      res.end
    )}`;

    const durationMinutes = calculateDurationFromIso(res.start, res.end);
    const price = calculatePriceForMinutes(durationMinutes);

    // Estado visual
    const startDate = new Date(res.start);
    let statusLabel = "Desconocido";
    let statusClass = "chip-soft";

    if (res.status === "CANCELLED") {
      statusLabel = "Cancelada";
      statusClass = "chip-inactive";
    } else if (startDate >= now) {
      statusLabel = "Próxima";
      statusClass = "chip-active";
    } else {
      statusLabel = "Finalizada";
      statusClass = "chip-soft";
    }

    // ¿Se puede cancelar?
    const canCancel = canCancelReservation(res, now);

    card.innerHTML = `
      <div class="installation-card-header">
        <div>
          <h2 class="installation-name">${escapeHtml(installationName)}</h2>
          <div class="installation-type">
            ${escapeHtml(dateLabel)} · ${escapeHtml(timeRange)}
          </div>
        </div>
        <span class="chip ${statusClass}">
          ${escapeHtml(statusLabel)}
        </span>
      </div>

      <div class="installation-body">
        <div class="installation-location">
          Código de reserva: <strong>${escapeHtml(res.code || "—")}</strong>
        </div>
        <div class="installation-tags">
          <span class="pill">
            Duración: ${escapeHtml(formatDurationHuman(durationMinutes))}
          </span>
          <span class="pill">
            Importe: ${price.toFixed(2).replace(".", ",")} €
          </span>
        </div>
      </div>

      <div class="installation-card-footer">
        ${
          canCancel
            ? `<button
                 class="btn btn-secondary btn-compact btn-cancel-reservation"
                 data-id="${res.id}"
               >
                 Cancelar reserva
               </button>`
            : `<button
                 class="btn btn-secondary btn-compact"
                 disabled
               >
                 No se puede cancelar
               </button>`
        }
      </div>
    `;

    // Evento cancelar (si aplica)
    if (canCancel) {
      const btn = card.querySelector(".btn-cancel-reservation");
      if (btn) {
        btn.addEventListener("click", () => {
          handleCancelReservation(res);
        });
      }
    }

    container.appendChild(card);
  });
}


/**
 * Lógica de cancelación de reserva:
 */
function handleCancelReservation(reservation) {
  const userId =
    typeof getUserId === "function" ? getUserId() : null;
  if (!userId) {
    alert("Debes iniciar sesión para cancelar una reserva.");
    return;
  }

  showReservationCancelModal(reservation);
}

/**
 * Marca visualmente que estamos cargando reservas.
 */
function setReservationsLoading(isLoading) {
  const container = $("#reservationsList");
  if (!container) return;

  container.setAttribute("aria-busy", isLoading ? "true" : "false");

  if (isLoading) {
    container.innerHTML = "";
  }
}

/* ===== Helpers de fechas / duración / precio ===== */

function formatDateHuman(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatTimeHuman(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function calculateDurationFromIso(startIso, endIso) {
  if (!startIso || !endIso) return 60;
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diffMs = end - start;
  const diffMin = diffMs / 60000;
  return diffMin > 0 ? diffMin : 60;
}

function formatDurationHuman(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (minutes === 60) return "1 hora";
  if (m === 0) return `${h} horas`;
  return `${h} h ${m} min`;
}

function calculatePriceForMinutes(durationMinutes) {
  // Misma regla que en reservas.js:
  // 3€ la primera hora, +1,5€ cada media hora extra
  const halfHours = Math.round(durationMinutes / 30);
  if (halfHours <= 2) return 3;
  const extraHalfHours = halfHours - 2;
  return 3 + extraHalfHours * 1.5;
}

/**
 * Regla de si se puede cancelar:
 * - Status distinto de CANCELLED
 * - Faltan al menos 4h para la hora de inicio
 */
function canCancelReservation(res, nowRef) {
  if (!res || res.status === "CANCELLED") return false;
  const now = nowRef || new Date();
  const start = new Date(res.start);
  if (isNaN(start.getTime())) return false;

  const diffMs = start.getTime() - now.getTime();
  const fourHoursMs = 4 * 60 * 60 * 1000;
  return diffMs >= fourHoursMs;
}


function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function showReservationCancelModal(reservation) {
  const existing = document.getElementById("reservationCancelBackdrop");
  if (existing) existing.remove();

  const backdrop = document.createElement("div");
  backdrop.id = "reservationCancelBackdrop";
  backdrop.className = "modal-backdrop";

  document.body.appendChild(backdrop);
  document.body.classList.add("modal-open");

  // Render de la vista de confirmación
  renderCancelConfirmView(backdrop, reservation);
}

function renderCancelConfirmView(backdrop, reservation) {
  const code = reservation && reservation.code ? reservation.code : null;

  backdrop.innerHTML = `
    <div class="modal-popup">
      <div class="modal-icon">⚠️</div>
      <h2 class="modal-title">¿Seguro que quieres cancelar?</h2>
      <p class="modal-text">
        Esta acción liberará la pista y el código de reserva dejará de ser válido.
      </p>
      ${
        code
          ? `<p class="modal-code">
               Código de reserva:
               <strong>${escapeHtml(code)}</strong>
             </p>`
          : ""
      }
      <p class="modal-error" id="cancelModalError" style="display:none;"></p>
      <div class="modal-actions">
        <button id="modalCancelBack" class="btn btn-secondary modal-secondary">
          Volver
        </button>
        <button id="modalCancelConfirm" class="btn btn-primary">
          Cancelar reserva
        </button>
      </div>
    </div>
  `;

  const btnBack = document.getElementById("modalCancelBack");
  const btnConfirm = document.getElementById("modalCancelConfirm");
  const errorEl = document.getElementById("cancelModalError");

  if (btnBack) {
    btnBack.addEventListener("click", () => {
      document.body.classList.remove("modal-open");
      backdrop.remove();
    });
  }

  if (btnConfirm) {
    btnConfirm.addEventListener("click", async () => {
      const userId =
        typeof getUserId === "function" ? getUserId() : null;
      if (!userId) {
        if (errorEl) {
          errorEl.style.display = "block";
          errorEl.textContent = "Debes iniciar sesión para cancelar una reserva.";
        }
        return;
      }

      btnConfirm.disabled = true;
      btnConfirm.textContent = "Cancelando...";

      try {
        if (typeof apiCancelReservation === "function") {
          await apiCancelReservation(reservation.id, userId, false);
        } else {
          console.warn("apiCancelReservation no está definida. Simulando cancelación.");
        }

        // Actualizamos estado local: marcamos como cancelada
        profileState.reservations = profileState.reservations.map((r) =>
          r.id === reservation.id ? { ...r, status: "CANCELLED" } : r
        );

        // Reaplicamos filtros y redibujamos
        applyReservationFiltersAndRender();

        // Pasamos a vista de éxito en el mismo popup
        renderCancelSuccessView(backdrop, reservation);
      } catch (err) {
        console.error(err);
        if (errorEl) {
          errorEl.style.display = "block";
          errorEl.textContent =
            (err && err.message) ||
            "No se ha podido cancelar la reserva. Revisa si estás dentro de las 4 horas previas.";
        }
        btnConfirm.disabled = false;
        btnConfirm.textContent = "Cancelar reserva";
      }
    });
  }
}

function renderCancelSuccessView(backdrop, reservation) {
  const code = reservation && reservation.code ? reservation.code : null;

  backdrop.innerHTML = `
    <div class="modal-popup">
      <div class="modal-icon">🗑️</div>
      <h2 class="modal-title">Reserva cancelada</h2>
      <p class="modal-text">
        Tu reserva se ha cancelado correctamente. El código asociado ya no será válido.
      </p>
      ${
        code
          ? `<p class="modal-code">
               Código de reserva:
               <strong>${escapeHtml(code)}</strong>
             </p>`
          : ""
      }
      <div class="modal-actions">
        <button id="modalCancelClose" class="btn btn-primary">
          Entendido
        </button>
      </div>
    </div>
  `;

  const closeBtn = document.getElementById("modalCancelClose");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.body.classList.remove("modal-open");
      backdrop.remove();
    });
  }
}
