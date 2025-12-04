// Enumeración para los estados de una reserva y su valor asociado en base de datos.
// Incluye conversión desde el string almacenado en la BD hacia el enum.

package com.aytodeporte.models;

public enum ReservationStatus {

    CONFIRMED("confirmada"),
    CANCELLED("cancelada");

    private final String dbValue;

    ReservationStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static ReservationStatus fromDbValue(String value) {
        if (value == null) return null;
        for (ReservationStatus s : values()) {
            if (s.dbValue.equalsIgnoreCase(value)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Estado de reserva desconocido: " + value);
    }
}
