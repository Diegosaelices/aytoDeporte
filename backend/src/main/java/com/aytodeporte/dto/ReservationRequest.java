// DTO de entrada para crear reservas: incluye instalación, usuario y rango horario.
// Puede usar start/end o calcular el final mediante durationMinutes.

package com.aytodeporte.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationRequest {

    private Long installationId;
    private Long userId;

    private String start;   // ISO-8601
    private String end;     // ISO-8601

    // Sobrescribe "end" si se envía
    private Integer durationMinutes;
}
