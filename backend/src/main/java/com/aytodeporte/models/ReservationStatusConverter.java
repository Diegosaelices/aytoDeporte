// Conversor JPA para mapear ReservationStatus con su valor String en base de datos.
// Se aplica automáticamente a los campos de tipo ReservationStatus.

package com.aytodeporte.models;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ReservationStatusConverter implements AttributeConverter<ReservationStatus, String> {

    @Override
    public String convertToDatabaseColumn(ReservationStatus attribute) {
        return attribute != null ? attribute.getDbValue() : null;
    }

    @Override
    public ReservationStatus convertToEntityAttribute(String dbData) {
        return ReservationStatus.fromDbValue(dbData);
    }
}

