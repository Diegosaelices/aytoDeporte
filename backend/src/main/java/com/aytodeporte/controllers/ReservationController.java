// Controlador REST para gestionar reservas: creación, cancelación, consulta y disponibilidad.
// Trabaja con fechas/horas y delega toda la lógica en el servicio ReservationService.

package com.aytodeporte.controllers;

import com.aytodeporte.dto.DailyAvailabilityResponse;
import com.aytodeporte.dto.ReservationResponse;
import com.aytodeporte.services.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    // Crear una reserva indicando usuario, instalación, fecha/hora y duración
    @PostMapping
    public ReservationResponse createReservation(@RequestParam Long userId,
                                                 @RequestParam Long installationId,
                                                 @RequestParam
                                                 @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
                                                 @RequestParam int duration) {
        return reservationService.createReservation(userId, installationId, start, duration);
    }

    // Cancelar una reserva (el usuario o un administrador)
    @PostMapping("/{id}/cancel")
    public ReservationResponse cancelReservation(@PathVariable Long id,
                                                 @RequestParam Long userId,
                                                 @RequestParam(defaultValue = "false") boolean admin) {
        return reservationService.cancelReservation(id, userId, admin);
    }

    // Listar reservas de un usuario concreto
    @GetMapping("/user/{userId}")
    public List<ReservationResponse> getByUser(@PathVariable Long userId) {
        return reservationService.getReservationsByUser(userId);
    }

    // Listar reservas asociadas a una instalación
    @GetMapping("/installation/{installationId}")
    public List<ReservationResponse> getByInstallation(@PathVariable Long installationId) {
        return reservationService.getReservationsByInstallation(installationId);
    }

    // Obtener disponibilidad horaria de una instalación para un día concreto
    @GetMapping("/availability")
    public DailyAvailabilityResponse getDailyAvailability(
            @RequestParam Long installationId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return reservationService.getDailyAvailability(installationId, date);
    }
}
