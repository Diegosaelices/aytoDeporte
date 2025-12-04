// DTO de salida para la respuesta de login o registro.
// Incluye datos del usuario autenticado y el token JWT.

package com.aytodeporte.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private Long id;
    private String email;
    private String rol;
    private String mensage;
    private String token;
    private String nombre;
}
