// Servicio de negocio para gestionar usuarios: registro, autenticación y búsqueda por id.
// Aplica validaciones de credenciales, normalización de email y actualización de último acceso.

package com.aytodeporte.services;

import com.aytodeporte.models.User;
import com.aytodeporte.repositories.UserRepository;
import com.aytodeporte.utils.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Registro de usuario con validaciones y rol por defecto USUARIO
    public User registerUser(String email,
                             String rawPassword,
                             String nombre,
                             String apellido) {

        String emailNormalizado = email == null ? null : email.trim().toLowerCase();

        if (emailNormalizado == null || emailNormalizado.isBlank()) {
            throw new BusinessException("El email es obligatorio");
        }

        if (rawPassword == null || rawPassword.isBlank()) {
            throw new BusinessException("La contraseña es obligatoria");
        }

        if (nombre == null || nombre.isBlank()) {
            throw new BusinessException("El nombre es obligatorio");
        }

        if (apellido == null || apellido.isBlank()) {
            throw new BusinessException("El apellido es obligatorio");
        }

        if (userRepository.existsByEmail(emailNormalizado)) {
            throw new BusinessException("Ya existe un usuario registrado con ese email");
        }

        String nombreLimpio = nombre.trim();
        String apellidoLimpio = apellido.trim();

        User user = User.builder()
                .email(emailNormalizado)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .nombre(nombreLimpio)
                .apellido(apellidoLimpio)
                .rol("USUARIO")
                .creadoEn(LocalDateTime.now())
                .ultimoAcceso(null)
                .build();

        return userRepository.save(user);
    }

    // Autenticación básica: valida credenciales y actualiza último acceso
    public User authenticateUser(String email, String rawPassword) {
        String emailNormalizado = email == null ? null : email.trim().toLowerCase();

        if (emailNormalizado == null || emailNormalizado.isBlank()
                || rawPassword == null || rawPassword.isBlank()) {
            throw new BusinessException("Credenciales inválidas");
        }

        User user = userRepository.findByEmail(emailNormalizado)
                .orElseThrow(() -> new BusinessException("Credenciales inválidas"));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new BusinessException("Credenciales inválidas");
        }

        user.setUltimoAcceso(LocalDateTime.now());
        userRepository.save(user);

        return user;
    }

    // Recupera un usuario por id o lanza excepción si no existe
    public User getByIdOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new BusinessException("Usuario no encontrado con id " + userId));
    }
}
