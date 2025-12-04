// DTO de entrada para iniciar sesión: contiene email y contraseña del usuario.
// Usado por el endpoint /api/users/login.

package com.aytodeporte.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    private String email;
    private String password;
}
