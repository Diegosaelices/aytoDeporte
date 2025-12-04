// DTO de entrada para registrar un nuevo usuario.
// Contiene datos básicos necesarios para la creación del perfil.

package com.aytodeporte.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String email;
    private String password;
    private String nombre;
    private String apellido;
}
