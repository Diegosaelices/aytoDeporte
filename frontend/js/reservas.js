// reservas.js
// Lógica de la página de reservas: carga instalaciones, muestra disponibilidad
// y permite confirmar una reserva cumpliendo:
// - Mínimo 1h, máximo 3h
// - Saltos de 30 min
// - Una tarjeta por instalación, botones con horas de inicio
// - Si el usuario NO está logueado, puede ver disponibilidad pero no confirmar. (En el back está capado por loq ue tampoco puede ver disponibilidad)

// Estado global de reservas
const reservationState = {
  installations: [],
  availability: [],
  selectedSlot: null,
  baseSlotIndex: null,
  slotMinutes: 30
};

// Comprueba si hay un usuario logueado según el token del localStorage
function isUserLoggedInReservations() {
  try {
    if (typeof getAuthToken === "function") {
      return !!getAuthToken();
    }
  } catch (e) {
  }
  try {
    return !!localStorage.getItem("aytodeporte_token");
  } catch (_) {
    return false;
  }
}

function $(selector) {
  return document.querySelector(selector);
}

document.addEventListener("DOMContentLoaded", () => {
  initReservations();
});

async function initReservations() {
  const availabilityList = $("#availabilityList");
  if (!availabilityList) return; 

  availabilityList.innerHTML = "";

  const installationSelect = $("#reservationInstallation");
  const dateInput = $("#reservationDate");
  const btnConfirmReservation = $("#btnConfirmReservation");
  const durationSelect = $("#durationSelect");

  const emptyMessage = $("#availabilityEmptyMessage");
  const errorMessage = $("#availabilityErrorMessage");
  const feedback = $("#reservationFeedback");

  const isLoggedIn = isUserLoggedInReservations();

  // Fecha por defecto = hoy
  if (dateInput && !dateInput.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  // Cargar instalaciones
  await loadInstallations(installationSelect);

  // Preseleccionar instalación que venga de instalaciones.html
  const params = new URLSearchParams(window.location.search);
  const installationFromUrl = params.get("installationId");
  if (installationFromUrl && installationSelect) {
    installationSelect.value = installationFromUrl;
  }

  // Función común para pedir disponibilidad
  async function handleAvailabilityRequest() {
    if (!installationSelect || !dateInput) return;

    const installationId = installationSelect.value;
    const date = dateInput.value;

    if (!installationId || !date) return;

    reservationState.selectedSlot = null;
    reservationState.baseSlotIndex = null;

    renderSummary(); 

    setAvailabilityLoading(true);

    try {
      const availability = await fetchAvailability(installationId, date);
      reservationState.availability = availability;
      renderAvailability(availability);

      if (availability.length === 0) {
        if (emptyMessage) emptyMessage.hidden = false;
      } else {
        if (emptyMessage) emptyMessage.hidden = true;
      }

      if (errorMessage) {
        errorMessage.hidden = true;
        const detailSpan = errorMessage.querySelector(".error-detail");
        if (detailSpan) detailSpan.textContent = "";
      }

      if (durationSelect && isLoggedIn) {
        resetDurationOptions(durationSelect);
      }
    } catch (err) {
      console.error(err);
      if (errorMessage) {
        errorMessage.hidden = false;
        const detailSpan = errorMessage.querySelector(".error-detail");
        if (detailSpan) {
          detailSpan.textContent = err.message || "Error desconocido.";
        }
      }
    } finally {
      setAvailabilityLoading(false);
    }
  }

  // Si ya hay instalación + fecha, cargamos disponibilidad al entrar
  if (
    installationSelect &&
    installationSelect.value &&
    dateInput &&
    dateInput.value
  ) {
    handleAvailabilityRequest();
  }

  // Cambiar instalación → recargar disponibilidad
  if (installationSelect) {
    installationSelect.addEventListener("change", () => {
      handleAvailabilityRequest();
    });
  }

  // Cambiar fecha → recargar disponibilidad
  if (dateInput) {
    dateInput.addEventListener("change", () => {
      handleAvailabilityRequest();
    });
  }

  // Cambio de duración (solo tiene sentido si hay login)
  if (durationSelect && isLoggedIn) {
    durationSelect.addEventListener("change", () => {
      if (reservationState.baseSlotIndex == null) return;
      const minutes = parseInt(durationSelect.value, 10);
      applyDurationToSelectedSlot(minutes);
    });
  }

  // Configurar tarjeta derecha según haya login o no
  if (!isLoggedIn) {
    if (durationSelect) {
      durationSelect.disabled = true;
    }
    if (btnConfirmReservation) {
      btnConfirmReservation.disabled = false;
      btnConfirmReservation.textContent = "Inicia sesión para reservar";
      btnConfirmReservation.addEventListener("click", () => {
        window.location.href = "login.html";
      });
    }
    if (feedback) {
      feedback.textContent =
        "Puedes consultar la disponibilidad, pero necesitas iniciar sesión para confirmar la reserva.";
    }
  } else {
    // Usuario logueado → comportamiento normal
    if (btnConfirmReservation) {
      btnConfirmReservation.addEventListener("click", async () => {
        if (!reservationState.selectedSlot) {
          if (feedback) {
            feedback.textContent =
              "Selecciona una hora de inicio y duración antes de confirmar.";
          }
          return;
        }

        const currentUserId =
          typeof getUserId === "function" ? getUserId() : null;
        if (!currentUserId) {
          if (feedback) {
            feedback.textContent =
              "Debes iniciar sesión para poder reservar.";
          }
          return;
        }

        btnConfirmReservation.disabled = true;
        if (feedback) feedback.textContent = "";

        try {
          const slot = reservationState.selectedSlot;

          const payload = {
            userId: currentUserId,
            installationId: slot.installationId,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime
          };

          const created = await createReservation(payload);

          // Refrescamos disponibilidad
          await handleAvailabilityRequest();

          // Mostramos modal de éxito
          showReservationSuccessModal(created);
        } catch (err) {
          console.error(err);
          if (feedback) {
            feedback.textContent =
              err.message ||
              "No se ha podido crear la reserva. Inténtalo de nuevo más tarde.";
          }
        } finally {
          btnConfirmReservation.disabled = !reservationState.selectedSlot;
        }
      });
    }
  }

  // Pintar resumen inicial
  renderSummary();
}

// ========= CARGA DE INSTALACIONES / DISPONIBILIDAD =========

async function loadInstallations(installationSelect) {
  if (!installationSelect) return;

  installationSelect.innerHTML =
    `<option value="">Cargando instalaciones...</option>`;

  try {
    let installations = [];
    if (typeof apiGetInstallations === "function") {
      installations = await apiGetInstallations();
    }

    reservationState.installations = installations;

    installationSelect.innerHTML =
      `<option value="">Seleccionar instalación</option>` +
      installations
        .filter((inst) => inst.active !== false)
        .map(
          (inst) =>
            `<option value="${inst.id}">${escapeHtml(
              inst.name || `Instalación ${inst.id}`
            )}</option>`
        )
        .join("");
  } catch (err) {
    console.error(err);

    // Mensaje distinto según haya sesión o no
    const loggedIn = isUserLoggedInReservations();

    if (!loggedIn) {
      installationSelect.innerHTML =
        `<option value="">Inicia sesión para ver las instalaciones</option>`;
    } else {
      installationSelect.innerHTML =
        `<option value="">Error al cargar las instalaciones</option>`;
    }
  }
}

async function fetchAvailability(installationId, date) {
  let response;

  if (typeof apiGetDailyAvailability === "function") {
    response = await apiGetDailyAvailability(installationId, date);
  } else {
    response = {
      installationId: Number(installationId),
      installationName: "Instalación de ejemplo",
      date,
      slots: []
    };
  }

  const slotsFromApi = response.slots || [];

  const slots = slotsFromApi.map((item, index) => {
    const start = item.start || "";
    const end = item.end || "";

    const startTime = start.includes("T") ? start.substring(11, 16) : start;
    const endTime = end.includes("T") ? end.substring(11, 16) : end;

    return {
      id: `slot-${index}`,
      installationId: response.installationId || Number(installationId),
      courtId: null,
      courtName: response.installationName || "Instalación",
      date: response.date || date,
      startTime,
      endTime,
      status: item.status || "DESCONOCIDO",
      reason: item.reason || null
    };
  });

  slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (slots.length > 0) {
    reservationState.slotMinutes = calculateDurationMinutes(
      slots[0].startTime,
      slots[0].endTime
    );
  } else {
    reservationState.slotMinutes = 30;
  }

  return slots;
}

async function createReservation(payload) {
  if (typeof apiCreateReservation === "function") {
    const startISO = buildStartDateTime(payload.date, payload.startTime);
    const duration = calculateDurationMinutes(
      payload.startTime,
      payload.endTime
    );
    return await apiCreateReservation(
      payload.userId,
      payload.installationId,
      startISO,
      duration
    );
  }

  console.warn(
    "apiCreateReservation no está definida. Simulando creación de reserva."
  );
  return Promise.resolve({
    id: "mock-reservation-id",
    code: "000000",
    ...payload
  });
}

// ========= PINTAR DISPONIBILIDAD Y RESUMEN =========

function renderAvailability(availability) {
  const container = $("#availabilityList");
  const emptyMessage = $("#availabilityEmptyMessage");
  const durationSelect = $("#durationSelect");
  const btnConfirmReservation = $("#btnConfirmReservation");
  if (!container) return;

  container.innerHTML = "";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "12px";

  if (!availability || availability.length === 0) {
    if (emptyMessage) emptyMessage.hidden = false;
    return;
  }

  if (emptyMessage) emptyMessage.hidden = true;

  const first = availability[0];
  const card = document.createElement("article");
  card.className = "installation-card selected-slot";
  card.style.width = "100%";

  const selectableIndexes = [];
  availability.forEach((slot, index) => {
    if (slot.status !== "DISPONIBLE") return;
    const maxMinutes = getMaxConsecutiveAvailableMinutesFrom(index);
    if (maxMinutes >= 60) selectableIndexes.push(index);
  });

  if (btnConfirmReservation) btnConfirmReservation.disabled = true;
  if (durationSelect) resetDurationOptions(durationSelect);

  const timeButtonsHtml = selectableIndexes
    .map((idx) => {
      const slot = availability[idx];
      return `
        <button
          class="time-slot-btn"
          data-start="${slot.startTime}"
          data-index="${idx}"
        >
          ${escapeHtml(slot.startTime)}
        </button>`;
    })
    .join("");

  card.innerHTML = `
    <div class="installation-card-header">
      <div>
        <div class="installation-name">
          ${escapeHtml(first.courtName || "Instalación")}
        </div>
        <div class="installation-type">
          ${escapeHtml(first.date)} · Horario de 8:00 a 23:00
        </div>
      </div>
      <span class="chip chip-soft">
        ${selectableIndexes.length} horas de inicio disponibles
      </span>
    </div>
    <div class="installation-body">
      <div class="installation-location">
        Selecciona una <strong>hora de inicio</strong>. La duración mínima es de 1 hora y la máxima de 3 horas.
      </div>
      <div class="time-slot-list">
        ${
          timeButtonsHtml ||
          "<span class='hero-card-note'>No hay franjas disponibles.</span>"
        }
      </div>
    </div>
  `;

  container.appendChild(card);

  const buttons = card.querySelectorAll(".time-slot-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index, 10);
      onBaseSlotSelected(index);
      buttons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });
}

function onBaseSlotSelected(index) {
  const durationSelect = $("#durationSelect");
  const btnConfirmReservation = $("#btnConfirmReservation");
  if (!durationSelect) return;

  reservationState.baseSlotIndex = index;
  const maxMinutes = getMaxConsecutiveAvailableMinutesFrom(index);

  if (maxMinutes < 60) {
    alert("Esta hora de inicio no permite reservar al menos 1 hora completa.");
    reservationState.selectedSlot = null;
    renderSummary();
    if (btnConfirmReservation && isUserLoggedInReservations()) {
      btnConfirmReservation.disabled = true;
    }
    return;
  }

  const allowedMax = Math.min(maxMinutes, 180);
  const selectedDuration = updateDurationOptions(durationSelect, allowedMax);

  applyDurationToSelectedSlot(selectedDuration);

  if (btnConfirmReservation && isUserLoggedInReservations()) {
    const currentUserId =
      typeof getUserId === "function" ? getUserId() : null;
    btnConfirmReservation.disabled = !currentUserId;
  }
}

function getMaxConsecutiveAvailableMinutesFrom(startIndex) {
  const slots = reservationState.availability;
  const slotMinutes = reservationState.slotMinutes || 30;

  let total = 0;
  for (let i = startIndex; i < slots.length; i++) {
    if (slots[i].status !== "DISPONIBLE") break;
    if (i > startIndex) {
      const prev = slots[i - 1];
      if (prev.endTime !== slots[i].startTime) break;
    }
    total += slotMinutes;
  }
  return total;
}

function updateDurationOptions(select, maxMinutes) {
  const possibleDurations = [60, 90, 120, 150, 180];
  const enabledDurations = possibleDurations.filter((d) => d <= maxMinutes);

  select.innerHTML = enabledDurations
    .map((d) => {
      const label =
        d === 60
          ? "1 hora"
          : d % 60 === 0
          ? `${d / 60} horas`
          : `${Math.floor(d / 60)} h ${d % 60} min`;
      return `<option value="${d}">${label}</option>`;
    })
    .join("");

  const selected = enabledDurations[0];
  select.value = String(selected);
  return selected;
}

function resetDurationOptions(select) {
  select.innerHTML = `
    <option value="60">1 hora</option>
    <option value="90">1,5 horas</option>
    <option value="120">2 horas</option>
    <option value="150">2,5 horas</option>
    <option value="180">3 horas</option>
  `;
  select.value = "60";
}

function applyDurationToSelectedSlot(durationMinutes) {
  const index = reservationState.baseSlotIndex;
  const slots = reservationState.availability;
  if (index == null || !slots[index]) return;

  const base = slots[index];
  const startTime = base.startTime;
  const endTime = addMinutesToTime(startTime, durationMinutes);

  reservationState.selectedSlot = {
    installationId: base.installationId,
    courtName: base.courtName,
    date: base.date,
    startTime,
    endTime
  };

  renderSummary();
}

/**
 * Pinta el resumen de la reserva o CTA de login
 */
function renderSummary() {
  const summaryContainer = $("#reservationSummary");
  const feedback = $("#reservationFeedback");
  if (!summaryContainer) return;

  if (feedback) feedback.textContent = "";

  const loggedIn = isUserLoggedInReservations();

  if (!loggedIn) {
    summaryContainer.innerHTML = `
      <div class="quick-link">
        <span class="quick-link-title">Inicia sesión para reservar</span>
        <span class="quick-link-desc">
          Puedes consultar la disponibilidad de las instalaciones, pero
          para confirmar una reserva necesitas acceder con tu cuenta de usuario.
        </span>
      </div>
    `;
    return;
  }

  const slot = reservationState.selectedSlot;
  if (!slot) {
    summaryContainer.innerHTML = `
      <div class="quick-link">
        <span class="quick-link-title">Sin selección todavía</span>
        <span class="quick-link-desc">
          Elige una instalación, fecha y hora de inicio en el listado de la izquierda.
        </span>
      </div>
    `;
    return;
  }

  const durationSelect = $("#durationSelect");

  const installation = reservationState.installations.find(
    (inst) => String(inst.id) === String(slot.installationId)
  );

  const installationName =
    (installation && installation.name) || "Instalación seleccionada";

  const durationMinutes =
    durationSelect
      ? parseInt(durationSelect.value, 10)
      : calculateDurationMinutes(slot.startTime, slot.endTime);

  const price = calculatePrice(durationMinutes);

  summaryContainer.innerHTML = `
    <div class="quick-link">
      <span class="quick-link-title">
        ${escapeHtml(installationName)}
      </span>
      <span class="quick-link-desc">
        ${escapeHtml(slot.date)} · ${escapeHtml(slot.startTime)} - ${escapeHtml(
    slot.endTime
  )}
      </span>
    </div>
    <div class="quick-link">
      <span class="quick-link-title">Precio</span>
      <span class="quick-link-desc">
        ${price.toFixed(2).replace(".", ",")} €
      </span>
    </div>
  `;
}

// ========= UTILIDADES =========

function setAvailabilityLoading(isLoading) {
  const container = $("#availabilityList");
  if (!container) return;
  container.setAttribute("aria-busy", isLoading ? "true" : "false");
}

function calculateDurationMinutes(startTime, endTime) {
  if (!startTime || !endTime) return 60;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startM = sh * 60 + sm;
  const endM = eh * 60 + em;
  const diff = endM - startM;
  return diff > 0 ? diff : 60;
}

function addMinutesToTime(time, minutesToAdd) {
  const [h, m] = time.split(":").map(Number);
  let total = h * 60 + m + minutesToAdd;
  if (total < 0) total = 0;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function calculatePrice(durationMinutes) {
  const halfHours = Math.round(durationMinutes / 30);
  if (halfHours <= 2) return 3;
  const extraHalfHours = halfHours - 2;
  return 3 + extraHalfHours * 1.5;
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

function buildStartDateTime(date, time) {
  if (!date || !time) return "";
  return `${date}T${time}:00`;
}

// Modal de éxito
function showReservationSuccessModal(reservation) {
  const existing = document.getElementById("reservationSuccessBackdrop");
  if (existing) existing.remove();

  const code = reservation && reservation.code ? reservation.code : null;

  const backdrop = document.createElement("div");
  backdrop.id = "reservationSuccessBackdrop";
  backdrop.className = "modal-backdrop";

  const codeHtml = code
    ? `<p class="modal-code">
         Código de reserva:
         <strong>${escapeHtml(code)}</strong>
       </p>`
    : "";

  backdrop.innerHTML = `
    <div class="modal-popup">
      <div class="modal-icon">✅</div>
      <h2 class="modal-title">Reserva confirmada</h2>
      <p class="modal-text">
        Tu reserva se ha creado correctamente. Podrás consultarla en
        <strong>Mi perfil &gt; Mis reservas</strong>.
      </p>
      ${codeHtml}
      <div class="modal-actions">
        <button id="modalGoProfile" class="btn btn-primary">Ir a Mi perfil</button>
        <button id="modalStay" class="btn btn-secondary">Seguir reservando</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  document.body.classList.add("modal-open");

  const goBtn = document.getElementById("modalGoProfile");
  const stayBtn = document.getElementById("modalStay");

  const goProfile = () => {
    window.location.href = "perfil.html";
  };

  if (goBtn) {
    goBtn.addEventListener("click", goProfile);
  }

  if (stayBtn) {
    stayBtn.addEventListener("click", () => {
      document.body.classList.remove("modal-open");
      backdrop.remove();
    });
  }
}
