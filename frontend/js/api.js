// Módulo central para comunicar el front con el backend REST.
// Gestiona fetch, cabeceras, token y helpers específicos de la API (instalaciones, reservas, bloqueos, administración).

/* ==== Configuración básica de la API ==== */

const API_BASE_URL = "http://localhost:8080/api";

/* ==== Helpers de autenticación ==== */

function getAuthToken() {
  return localStorage.getItem("aytodeporte_token") || null;
}

/* ==== Wrapper general de peticiones (fetch) ==== */

async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = options.headers ? { ...options.headers } : {};

  if (!headers["Content-Type"] && options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorText = "Error en la petición";

    try {
      // Intentamos leer texto y, si es JSON, parsearlo
      const raw = await response.text();
      if (raw) {
        try {
          const errJson = JSON.parse(raw);
          errorText = errJson.message || errJson.error || errorText;
        } catch (_) {
          // No era JSON, usamos el texto plano (ej. BusinessException como String)
          errorText = raw;
        }
      }
    } catch (_) {}

    throw new Error(errorText);
  }

  if (response.status === 204) return null;

  return response.json();
}

/* ==== Instalaciones (consulta pública y común) ==== */

async function apiGetInstallations() {
  // GET /api/installations (InstallationController.getAll)
  return apiFetch("/installations", { method: "GET" });
}

// Ejemplo con jQuery para cargar instalaciones destacadas en la home
function cargarInstalacionesDestacadas() {
  const $contenedor = $("#instalaciones-destacadas");
  if ($contenedor.length === 0) return;

  $.ajax({
    url: `${API_BASE_URL}/installations`,
    method: "GET",
    dataType: "json",
    success: function (data) {
      $contenedor.empty();
      const destacadas = data.slice(0, 3);

      if (destacadas.length === 0) {
        $contenedor.append($("<p>").text("No hay instalaciones disponibles en este momento."));
        return;
      }

      destacadas.forEach((inst) => {
        const $card = $("<div>").addClass("installation-card");
        $("<h3>").text(inst.name).appendTo($card);
        $("<p>").text(`Tipo: ${inst.type} · Nº: ${inst.number}`).appendTo($card);

        const $chips = $("<div>").addClass("installation-chip-row");
        $("<span>")
          .addClass("installation-chip")
          .text(inst.active ? "Activa" : "Inactiva")
          .appendTo($chips);

        $chips.appendTo($card);
        $contenedor.append($card);
      });
    },
    error: function () {
      $contenedor.empty();
      $contenedor.append($("<p>").text("No se han podido cargar las instalaciones."));
    }
  });
}

/* ==== Autenticación (login) ==== */

async function apiLogin(email, password) {
  // POST /api/users/login (UserController.login)
  return apiFetch("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

/* ==== Disponibilidad y reservas ==== */

async function apiGetDailyAvailability(installationId, date) {
  const params = new URLSearchParams({ installationId, date });
  return apiFetch(`/reservations/availability?${params.toString()}`, { method: "GET" });
}

async function apiCreateReservation(userId, installationId, start, duration) {
  const params = new URLSearchParams({ userId, installationId, start, duration });
  return apiFetch(`/reservations?${params.toString()}`, { method: "POST" });
}

async function apiGetUserReservations(userId) {
  return apiFetch(`/reservations/user/${userId}`, { method: "GET" });
}

async function apiCancelReservation(reservationId, userId, admin = false) {
  const params = new URLSearchParams({ userId, admin });
  return apiFetch(`/reservations/${reservationId}/cancel?${params.toString()}`, { method: "POST" });
}

/* ==== Bloqueos (ADMIN) ==== */

async function apiCreateBlock(blockRequest) {
  // POST /api/blocks
  return apiFetch("/blocks", {
    method: "POST",
    body: JSON.stringify(blockRequest)
  });
}

async function apiGetBlocks(installationId) {
  // GET /api/blocks o /api/blocks/installation/{id}
  const path = installationId
    ? `/blocks/installation/${installationId}`
    : "/blocks";
  return apiFetch(path, { method: "GET" });
}

async function apiDeleteBlock(blockId) {
  // DELETE /api/blocks/{id}
  return apiFetch(`/blocks/${blockId}`, { method: "DELETE" });
}

/* ==== Instalaciones (ADMIN: crear, actualizar, eliminar) ==== */

async function apiCreateInstallation(installationRequest) {
  // POST /api/installations, solo ADMIN (InstallationController.create)
  return apiFetch("/installations", {
    method: "POST",
    body: JSON.stringify(installationRequest)
  });
}

async function apiUpdateInstallation(id, installationRequest) {
  // PUT /api/installations/{id}, solo ADMIN (InstallationController.update)
  return apiFetch(`/installations/${id}`, {
    method: "PUT",
    body: JSON.stringify(installationRequest)
  });
}

async function apiDeleteInstallation(id) {
  // DELETE /api/installations/{id}, solo ADMIN (InstallationController.delete)
  return apiFetch(`/installations/${id}`, {
    method: "DELETE"
  });
}

/* ==== Usuarios (ADMIN: listado y borrado) ==== */
async function apiGetUsers() {
  return apiFetch("/users", { method: "GET" });
}

async function apiDeleteUser(id) {
  return apiFetch(`/users/${id}`, { method: "DELETE" });
}
