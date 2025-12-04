// DTO de salida para representar una instalación con todos sus datos relevantes.
// Incluye información básica y la fecha de creación.

package com.aytodeporte.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstallationResponse {

    private Long id;
    private String name;
    private String type;
    private Integer number;
    private Boolean active;
    private LocalDateTime createdAt;
}
