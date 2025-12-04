// DTO de entrada para crear o actualizar una instalación.
// Incluye nombre, tipo, número identificativo y estado de actividad.

package com.aytodeporte.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstallationRequest {

    private String name;
    private String type;
    private Integer number;
    private Boolean active;
}
