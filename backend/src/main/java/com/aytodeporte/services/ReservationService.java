// Servicio de negocio para gestionar reservas: creación, cancelación, listados y disponibilidad diaria.
// Aplica las reglas de negocio de horarios, antelación, bloqueos, solapes y cálculo de precio.

package com.aytodeporte.services;

import com.aytodeporte.dto.DailyAvailabilityResponse;
import com.aytodeporte.dto.ReservationResponse;
import com.aytodeporte.dto.TimeSlotResponse;
import com.aytodeporte.models.Block;
import com.aytodeporte.models.Installation;
import com.aytodeporte.models.Reservation;
import com.aytodeporte.models.ReservationStatus;
import com.aytodeporte.models.User;
import com.aytodeporte.repositories.BlockRepository;
import com.aytodeporte.repositories.ReservationRepository;
import com.aytodeporte.utils.BusinessException;
import com.aytodeporte.utils.CodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserService userService;
    private final InstallationService installationService;
    private final BlockRepository blockRepository;

    // Reglas de negocio de horarios y límites
    private static final LocalTime OPEN_TIME = LocalTime.of(8, 0);
    private static final LocalTime CLOSE_TIME = LocalTime.of(23, 0);
    private static final int MIN_DURATION_MIN = 60;
    private static final int MAX_DURATION_MIN = 180;
    private static final int SLOT_MINUTES = 30;
    private static final int MAX_DAYS_BEFORE = 15;
    private static final int MIN_HOURS_BEFORE = 2;
    private static final int CANCEL_HOURS_BEFORE = 4;

    @Transactional
    public ReservationResponse createReservation(Long userId,
                                                 Long installationId,
                                                 LocalDateTime start,
                                                 int durationMinutes) {

        // Validaciones generales de tiempo y ventana de reserva
        validateDuration(durationMinutes);
        validateStartTime(start, durationMinutes);
        validateReservationWindow(start);

        User user = userService.getByIdOrThrow(userId);
        Installation installation = installationService.getByIdOrThrow(installationId);
        LocalDateTime end = start.plusMinutes(durationMinutes);

        // Comprobar bloqueos globales y específicos de la instalación
        validateBlocks(installation, start, end);

        // Comprobar solapes con otras reservas de esa instalación
        validateInstallationOverlaps(installation, start, durationMinutes);

        // Comprobar solapes con reservas del propio usuario
        validateUserOverlaps(user, start, durationMinutes);

        BigDecimal amount = calculateAmount(durationMinutes);
        String code = CodeGenerator.generateReservationCode();

        Reservation reservation = Reservation.builder()
                .user(user)
                .installation(installation)
                .start(start)
                .end(end)
                .durationMinutes(durationMinutes)
                .amount(amount)
                .code(code)
                .status(ReservationStatus.CONFIRMED)
                .verifiedAt(null)
                .createdAt(LocalDateTime.now())
                .build();

        Reservation saved = reservationRepository.save(reservation);
        return toResponse(saved);
    }

    @Transactional
    public ReservationResponse cancelReservation(Long reservationId, Long userId, boolean isAdmin) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(
                        "No se ha encontrado la reserva con ID " + reservationId
                ));

        // Solo el dueño puede cancelar su reserva, salvo que sea admin
        if (!isAdmin && !reservation.getUser().getId().equals(userId)) {
            throw new BusinessException("No tienes permiso para cancelar esta reserva");
        }

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("La reserva ya estaba cancelada");
        }

        LocalDateTime now = LocalDateTime.now();
        if (!now.isBefore(reservation.getStart().minusHours(CANCEL_HOURS_BEFORE))) {
            throw new BusinessException("Solo se puede cancelar una reserva con al menos "
                    + CANCEL_HOURS_BEFORE + " horas de antelación");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        Reservation updated = reservationRepository.save(reservation);
        return toResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservationsByUser(Long userId) {
        User user = userService.getByIdOrThrow(userId);
        List<Reservation> list =
                reservationRepository.findByUserAndStatus(user, ReservationStatus.CONFIRMED);

        return list.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservationsByInstallation(Long installationId) {
        Installation installation = installationService.getByIdOrThrow(installationId);
        List<Reservation> list =
                reservationRepository.findByInstallationAndStatus(installation, ReservationStatus.CONFIRMED);

        return list.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DailyAvailabilityResponse getDailyAvailability(Long installationId, LocalDate date) {
        Installation installation = installationService.getByIdOrThrow(installationId);

        LocalDateTime dayStart = date.atTime(OPEN_TIME);
        LocalDateTime dayEnd = date.atTime(CLOSE_TIME);

        // Filtra reservas del día para esa instalación
        List<Reservation> allInstallationReservations =
                reservationRepository.findByInstallationAndStatus(installation, ReservationStatus.CONFIRMED);

        List<Reservation> dayReservations = new ArrayList<>();
        for (Reservation r : allInstallationReservations) {
            if (overlaps(r.getStart(), r.getEnd(), dayStart, dayEnd)) {
                dayReservations.add(r);
            }
        }

        // Recupera bloqueos globales y específicos
        List<Block> globalBlocks = blockRepository.findByInstallationIsNull();
        List<Block> installationBlocks = blockRepository.findByInstallation(installation);

        // Genera la parrilla de slots de 30 minutos entre la apertura y el cierre
        List<TimeSlotResponse> slots = new ArrayList<>();
        LocalDateTime slotStart = dayStart;

        while (slotStart.isBefore(dayEnd)) {
            LocalDateTime slotEnd = slotStart.plusMinutes(SLOT_MINUTES);
            if (slotEnd.isAfter(dayEnd)) {
                break;
            }

            String status = "DISPONIBLE";
            String reason = null;

            // 1) Bloqueos globales
            for (Block block : globalBlocks) {
                if (overlaps(slotStart, slotEnd, block.getStart(), block.getEnd())) {
                    status = "BLOQUEADO";
                    reason = block.getReason();
                    break;
                }
            }

            // 2) Bloqueos específicos de la instalación
            if (!"BLOQUEADO".equals(status)) {
                for (Block block : installationBlocks) {
                    if (overlaps(slotStart, slotEnd, block.getStart(), block.getEnd())) {
                        status = "BLOQUEADO";
                        reason = block.getReason();
                        break;
                    }
                }
            }

            // 3) Reservas existentes
            if ("DISPONIBLE".equals(status)) {
                for (Reservation r : dayReservations) {
                    if (overlaps(slotStart, slotEnd, r.getStart(), r.getEnd())) {
                        status = "RESERVADO";
                        break;
                    }
                }
            }

            slots.add(new TimeSlotResponse(
                    slotStart.toString(),
                    slotEnd.toString(),
                    status,
                    reason
            ));

            slotStart = slotEnd;
        }

        return new DailyAvailabilityResponse(
                installation.getId(),
                installation.getName(),
                date.toString(),
                slots
        );
    }

    // ===================== VALIDACIONES PRIVADAS =====================

    private void validateDuration(int durationMinutes) {
        if (durationMinutes < MIN_DURATION_MIN || durationMinutes > MAX_DURATION_MIN) {
            throw new BusinessException("La duración debe estar entre 60 y 180 minutos");
        }
        if (durationMinutes % SLOT_MINUTES != 0) {
            throw new BusinessException("La duración debe ser en intervalos de 30 minutos");
        }
    }

    private void validateStartTime(LocalDateTime start, int durationMinutes) {
        LocalTime startTime = start.toLocalTime();

        int minute = startTime.getMinute();
        if (minute != 0 && minute != 30) {
            throw new BusinessException("Las reservas deben empezar en punto o a y media (:00 o :30)");
        }

        if (startTime.isBefore(OPEN_TIME)) {
            throw new BusinessException("La reserva no puede comenzar antes de las " + OPEN_TIME);
        }

        LocalDateTime end = start.plusMinutes(durationMinutes);
        LocalDateTime closingDateTime = start.toLocalDate().atTime(CLOSE_TIME);

        if (end.isAfter(closingDateTime)) {
            throw new BusinessException("La reserva no puede finalizar después de las " + CLOSE_TIME);
        }
    }

    private void validateReservationWindow(LocalDateTime start) {
        LocalDateTime now = LocalDateTime.now();

        if (!start.isAfter(now.plusHours(MIN_HOURS_BEFORE))) {
            throw new BusinessException("Las reservas deben hacerse con al menos "
                    + MIN_HOURS_BEFORE + " horas de antelación");
        }

        if (start.isAfter(now.plusDays(MAX_DAYS_BEFORE))) {
            throw new BusinessException("Solo se puede reservar con hasta "
                    + MAX_DAYS_BEFORE + " días de antelación");
        }
    }

    private void validateBlocks(Installation installation, LocalDateTime start, LocalDateTime end) {
        List<Block> globalBlocks = blockRepository.findByInstallationIsNull();
        for (Block block : globalBlocks) {
            if (overlaps(start, end, block.getStart(), block.getEnd())) {
                throw new BusinessException("La reserva no está permitida debido a un bloqueo global: "
                        + block.getReason());
            }
        }

        List<Block> installationBlocks = blockRepository.findByInstallation(installation);
        for (Block block : installationBlocks) {
            if (overlaps(start, end, block.getStart(), block.getEnd())) {
                throw new BusinessException("La reserva no está permitida debido a un bloqueo: "
                        + block.getReason());
            }
        }
    }

    private void validateInstallationOverlaps(Installation installation,
                                              LocalDateTime start,
                                              int durationMinutes) {
        List<Reservation> reservations =
                reservationRepository.findByInstallationAndStatus(installation, ReservationStatus.CONFIRMED);

        LocalDateTime end = start.plusMinutes(durationMinutes);

        for (Reservation existing : reservations) {
            LocalDateTime exStart = existing.getStart();
            LocalDateTime exEnd = existing.getEnd();

            if (overlaps(start, end, exStart, exEnd)) {
                throw new BusinessException(
                        "La instalación ya está reservada en ese intervalo horario");
            }
        }
    }

    private void validateUserOverlaps(User user,
                                      LocalDateTime start,
                                      int durationMinutes) {
        List<Reservation> reservations =
                reservationRepository.findByUserAndStatus(user, ReservationStatus.CONFIRMED);

        LocalDateTime end = start.plusMinutes(durationMinutes);

        for (Reservation existing : reservations) {
            LocalDateTime exStart = existing.getStart();
            LocalDateTime exEnd = existing.getEnd();

            if (overlaps(start, end, exStart, exEnd)) {
                throw new BusinessException(
                        "Ya tienes otra reserva en un horario solapado");
            }
        }
    }

    private boolean overlaps(LocalDateTime start1, LocalDateTime end1,
                             LocalDateTime start2, LocalDateTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }

    private BigDecimal calculateAmount(int durationMinutes) {
        int extraMinutes = durationMinutes - 60;
        BigDecimal amount = BigDecimal.valueOf(3.0);

        if (extraMinutes > 0) {
            int halfHours = extraMinutes / 30;
            BigDecimal extra = BigDecimal.valueOf(1.5)
                    .multiply(BigDecimal.valueOf(halfHours));
            amount = amount.add(extra);
        }
        return amount;
    }

    // ===================== MAPPER A DTO =====================

    private ReservationResponse toResponse(Reservation r) {
        return new ReservationResponse(
                r.getId(),
                r.getUser().getId(),
                r.getUser().getEmail(),
                r.getInstallation().getId(),
                r.getInstallation().getName(),
                r.getStart(),
                r.getEnd(),
                r.getDurationMinutes(),
                r.getStatus().name(),
                r.getCode(),
                r.getAmount()
        );
    }
}
