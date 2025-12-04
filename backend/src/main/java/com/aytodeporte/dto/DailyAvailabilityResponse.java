// DTO que representa la disponibilidad diaria de una instalación, incluyendo sus tramos horarios.
// Se compone de la instalación, la fecha y una lista de TimeSlotResponse.

package com.aytodeporte.dto;

import java.util.List;

public record DailyAvailabilityResponse(
        Long installationId,
        String installationName,
        String date,
        List<TimeSlotResponse> slots
) {}
