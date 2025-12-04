// DTO para solicitar la creación de un bloqueo, con rango temporal y datos opcionales de instalación.
// Los campos de fecha se envían como strings ISO y se procesan en el servicio.

package com.aytodeporte.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BlockRequest {

    private Long installationId;
    private Long createdByUserId;
    private String reason;
    private String start;
    private String end;
}
