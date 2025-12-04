// Enumeración de tipos de instalación y su valor asociado en base de datos.
// Incluye conversión inversa desde String a enum.

package com.aytodeporte.models;

public enum InstallationType {

    PADEL_VIEJA("padel_vieja"),
    PADEL_NUEVA("padel_nueva"),
    TENIS("tenis"),
    MULTIPISTA("multipista"),
    FUTBOL_SALA("futbol_sala"),
    CAMPO_FUTBOL("campo_futbol");

    private final String dbValue;

    InstallationType(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static InstallationType fromDbValue(String value) {
        if (value == null) return null;
        for (InstallationType t : values()) {
            if (t.dbValue.equalsIgnoreCase(value)) {
                return t;
            }
        }
        throw new IllegalArgumentException("Valor de tipo_instalacion desconocido: " + value);
    }
}

