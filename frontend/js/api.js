// Módulo central para comunicar el front con el backend REST.
// Gestiona fetch, cabeceras, token y helpers específicos de la API.

// CONFIGURACIÓN BÁSICA API 

const API_BASE_URL = "http://localhost:8080/api";

// Obtiene el token almacenado (para Authorization)
function getAuthToken() {
  return localStorage.getItem("aytodeporte_token") || null;
}

// WRAPPER GENERAL DE PETICIONES (fetch) 

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
      const errJson = await response.json();
      errorText = errJson.message || errJson.error || errorText;
    } catch (_) {}
    throw new Error(errorText);
  }

  if (response.status === 204) return null;

  return response.json();
}

// ENDPOINTS ESPECÍFICOS   

// Instalaciones
async function apiGetInstallations() {
  return apiFetch("/installations", { method: "GET" });
}

// Instalaciones destacadas (uso de jQuery para ejemplo)
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

// Login
async function apiLogin(email, password) {
  return apiFetch("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

// Disponibilidad diaria
async function apiGetDailyAvailability(installationId, date) {
  const params = new URLSearchParams({ installationId, date });
  return apiFetch(`/reservations/availability?${params.toString()}`, { method: "GET" });
}

// Crear reserva
async function apiCreateReservation(userId, installationId, start, duration) {
  const params = new URLSearchParams({ userId, installationId, start, duration });
  return apiFetch(`/reservations?${params.toString()}`, { method: "POST" });
}

// Reservas de usuario
async function apiGetUserReservations(userId) {
  return apiFetch(`/reservations/user/${userId}`, { method: "GET" });
}

// Cancelar reserva
async function apiCancelReservation(reservationId, userId, admin = false) {
  const params = new URLSearchParams({ userId, admin });
  return apiFetch(`/reservations/${reservationId}/cancel?${params.toString()}`, { method: "POST" });
}

// BLOQUEOS (ADMIN)  

// Crear un bloqueo
async function apiCreateBlock(blockRequest) {
  return apiFetch("/blocks", {
    method: "POST",
    body: JSON.stringify(blockRequest)
  });
}

// Obtener bloqueos
async function apiGetBlocks(installationId) {
  const path = installationId
    ? `/blocks/installation/${installationId}`
    : "/blocks";
  return apiFetch(path, { method: "GET" });
}

// Eliminar bloqueo
async function apiDeleteBlock(blockId) {
  return apiFetch(`/blocks/${blockId}`, { method: "DELETE" });
}
