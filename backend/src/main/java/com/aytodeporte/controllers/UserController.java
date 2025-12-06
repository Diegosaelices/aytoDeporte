// Controlador REST para gestión de usuarios: registro, login y administración básica.
// Devuelve JWT al iniciar sesión o registrarse y permite a ADMIN listar y eliminar usuarios.

package com.aytodeporte.controllers;

import com.aytodeporte.config.JwtUtil;
import com.aytodeporte.dto.LoginRequest;
import com.aytodeporte.dto.LoginResponse;
import com.aytodeporte.dto.RegisterRequest;
import com.aytodeporte.models.User;
import com.aytodeporte.services.UserService;
import com.aytodeporte.utils.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = { "http://127.0.0.1:5500", "http://localhost:5500" })
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("UserController funcionando");
    }

    // Registro de usuario con generación automática de JWT
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.registerUser(
                    request.getEmail(),
                    request.getPassword(),
                    request.getNombre(),
                    request.getApellido()
            );

            String token = jwtUtil.generateToken(user.getEmail());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new LoginResponse(
                            user.getId(),
                            user.getEmail(),
                            user.getRol(),
                            "Usuario registrado correctamente",
                            token,
                            user.getNombre()
                    ));
        } catch (BusinessException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    // Inicio de sesión con validación y emisión de JWT
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.authenticateUser(
                    request.getEmail(),
                    request.getPassword()
            );

            String token = jwtUtil.generateToken(user.getEmail());

            return ResponseEntity.ok(
                    new LoginResponse(
                            user.getId(),
                            user.getEmail(),
                            user.getRol(),
                            "Inicio de sesión correcto",
                            token,
                            user.getNombre()
                    )
            );
        } catch (BusinessException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    // Listado de usuarios para el panel de administración (solo ADMIN)
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<User> users = userService.getAllUsers();

        List<Map<String, Object>> result = users.stream()
                .map(u -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id", u.getId());
                    dto.put("email", u.getEmail());
                    dto.put("nombre", u.getNombre());
                    dto.put("apellido", u.getApellido());
                    dto.put("rol", u.getRol());
                    return dto;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // Eliminación de usuario (solo ADMIN)
    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (BusinessException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            // Por seguridad, nunca devolvemos el mensaje bruto de la BD
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error",
                            "No se puede eliminar el usuario porque tiene reservas asociadas."));
        }
    }
}
