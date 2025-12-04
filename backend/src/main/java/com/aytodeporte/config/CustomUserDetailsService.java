// Servicio que carga usuarios desde la base de datos para autenticación.
// Normaliza el email, valida existencia y construye el UserDetails con su rol.

package com.aytodeporte.config;

import com.aytodeporte.models.User;
import com.aytodeporte.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        // Normaliza el email para evitar fallos por mayúsculas/espacios
        String emailNormalizado = email == null ? null : email.trim().toLowerCase();

        // Busca el usuario o lanza excepción si no existe
        User user = userRepository.findByEmail(emailNormalizado)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Usuario no encontrado: " + email)
                );

        // Rol por defecto si viene null o vacío
        String rol = (user.getRol() == null || user.getRol().isBlank())
                ? "USUARIO"
                : user.getRol();

        // Construcción del UserDetails usado por Spring Security
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(rol)
                .build();
    }
}
