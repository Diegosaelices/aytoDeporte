// Controlador REST para gestionar instalaciones: creación, consulta, actualización y borrado.
// Aplica control de acceso por roles (ADMIN) y devuelve respuestas estructuradas.

package com.aytodeporte.controllers;

import com.aytodeporte.dto.InstallationRequest;
import com.aytodeporte.dto.InstallationResponse;
import com.aytodeporte.services.InstallationService;
import com.aytodeporte.utils.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = { "http://127.0.0.1:5500", "http://localhost:5500" })
@RestController
@RequestMapping("/api/installations")
@RequiredArgsConstructor
public class InstallationController {

    private final InstallationService installationService;

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("InstallationController funcionando");
    }

    // Solo ADMIN puede crear instalaciones
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping
    public ResponseEntity<?> create(@RequestBody InstallationRequest request) {
        try {
            InstallationResponse response = installationService.createInstallation(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (BusinessException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }

    // Cualquier usuario autenticado puede ver todas
    @GetMapping
    public ResponseEntity<List<InstallationResponse>> getAll() {
        List<InstallationResponse> list = installationService.getAllInstallations();
        return ResponseEntity.ok(list);
    }

    // Solo instalaciones activas
    @GetMapping("/active")
    public ResponseEntity<List<InstallationResponse>> getActive() {
        List<InstallationResponse> list = installationService.getActiveInstallations();
        return ResponseEntity.ok(list);
    }

    // Solo ADMIN puede actualizar instalaciones
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestBody InstallationRequest request) {
        try {
            InstallationResponse response = installationService.updateInstallation(id, request);
            return ResponseEntity.ok(response);
        } catch (BusinessException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }

    // Solo ADMIN puede eliminar instalaciones
    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            installationService.deleteInstallation(id);
            return ResponseEntity.noContent().build();
        } catch (BusinessException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }
}
