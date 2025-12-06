// Servicio de negocio para gestionar usuarios: registro, autenticación, consulta y borrado.
// Aplica validaciones de credenciales, normalización de email y maneja restricciones de integridad.

package com.aytodeporte.services;

import com.aytodeporte.models.User;
import com.aytodeporte.repositories.UserRepository;
import com.aytodeporte.utils.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

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

    // Listado completo de usuarios (para el panel de administración)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Borrado de usuario controlando restricciones de integridad (FK en reservas)
    public void deleteUser(Long userId) {
        if (userId == null) {
            throw new BusinessException("Id de usuario no válido");
        }

        try {
            userRepository.deleteById(userId);
        } catch (EmptyResultDataAccessException ex) {
            throw new BusinessException("Usuario no encontrado con id " + userId);
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException(
                    "No se puede eliminar el usuario porque tiene reservas asociadas."
            );
        } catch (Exception ex) {
            throw new BusinessException(
                    "No se puede eliminar el usuario porque tiene reservas asociadas o está en uso."
            );
        }
    }
}
