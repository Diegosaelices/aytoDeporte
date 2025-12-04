// DTO de salida para representar reservas completas, incluyendo usuario, instalación y estado.
// Incluye un método estático para convertir desde la entidad Reservation.

package com.aytodeporte.dto;

import com.aytodeporte.models.Reservation;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {

    private Long id;
    private Long userId;
    private String userEmail;
    private Long installationId;
    private String installationName;
    private LocalDateTime start;
    private LocalDateTime end;
    private Integer durationMinutes;
    private String status;
    private String code;
    private BigDecimal amount;

    // Conversión directa desde la entidad Reservation
    public static ReservationResponse fromEntity(Reservation r) {
        return new ReservationResponse(
                r.getId(),
                r.getUser().getId(),
                r.getUser().getEmail(),
                r.getInstallation().getId(),
                r.getInstallation().getName(),
                r.getStart(),
                r.getEnd(),
                r.getDurationMinutes(),
                r.getStatus() != null ? r.getStatus().name() : null,
                r.getCode(),
                r.getAmount()
        );
    }
}
