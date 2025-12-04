// DTO que representa un tramo horario en la disponibilidad diaria.
// Incluye hora inicio, hora fin, estado y motivo (si aplica).

package com.aytodeporte.dto;

public record TimeSlotResponse(
        String start,
        String end,
        String status,
        String reason
) {
}
