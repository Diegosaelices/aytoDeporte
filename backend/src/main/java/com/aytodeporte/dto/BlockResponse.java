// DTO de salida para representar bloqueos, incluyendo datos de instalación, usuario creador y fechas.
// Se usa en las respuestas del controlador y del servicio de bloqueos.

package com.aytodeporte.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class BlockResponse {

    private Long id;
    private Long installationId;
    private String installationName;

    private String reason;
    private String start;
    private String end;

    private Long createdByUserId;
    private String createdByEmail;

    private String createdAt;
}
