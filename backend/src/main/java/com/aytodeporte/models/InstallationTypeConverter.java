// Conversor JPA para mapear InstallationType con su representación String en la base de datos.
// Se aplica automáticamente a los campos del tipo InstallationType.

package com.aytodeporte.models;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class InstallationTypeConverter implements AttributeConverter<InstallationType, String> {

    @Override
    public String convertToDatabaseColumn(InstallationType attribute) {
        return attribute != null ? attribute.getDbValue() : null;
    }

    @Override
    public InstallationType convertToEntityAttribute(String dbData) {
        return InstallationType.fromDbValue(dbData);
    }
}
