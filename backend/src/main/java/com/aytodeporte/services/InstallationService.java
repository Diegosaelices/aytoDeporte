// Servicio de negocio para gestionar instalaciones: creación, actualización, consulta y borrado.
// Aplica validaciones de tipo, nombre y duplicados por tipo+número.

package com.aytodeporte.services;

import com.aytodeporte.dto.InstallationRequest;
import com.aytodeporte.dto.InstallationResponse;
import com.aytodeporte.models.Installation;
import com.aytodeporte.models.InstallationType;
import com.aytodeporte.repositories.InstallationRepository;
import com.aytodeporte.utils.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InstallationService {

    private final InstallationRepository installationRepository;

    // Crea una nueva instalación validando datos y evitando duplicados por tipo+número
    public InstallationResponse createInstallation(InstallationRequest request) {
        validateRequest(request);

        InstallationType type = parseType(request.getType());

        if (request.getNumber() != null) {
            installationRepository.findByTypeAndNumber(type, request.getNumber())
                    .ifPresent(existing -> {
                        throw new BusinessException("Ya existe una instalación de ese tipo con ese número");
                    });
        }

        Installation installation = Installation.builder()
                .name(request.getName().trim())
                .type(type)
                .number(request.getNumber())
                .active(request.getActive() != null ? request.getActive() : Boolean.TRUE)
                .createdAt(LocalDateTime.now())
                .build();

        Installation saved = installationRepository.save(installation);
        return toResponse(saved);
    }

    // Actualiza una instalación existente, controlando duplicados y validando el tipo
    public InstallationResponse updateInstallation(Long id, InstallationRequest request) {
        Installation installation = installationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Instalación no encontrada con id " + id));

        validateRequest(request);

        InstallationType newType = parseType(request.getType());
        Integer newNumber = request.getNumber();

        // Evita duplicados por tipo+número excluyendo la propia instalación
        if (newNumber != null) {
            installationRepository.findByTypeAndNumber(newType, newNumber)
                    .filter(other -> !other.getId().equals(id))
                    .ifPresent(other -> {
                        throw new BusinessException("Ya existe otra instalación de ese tipo con ese número");
                    });
        }

        installation.setName(request.getName().trim());
        installation.setType(newType);
        installation.setNumber(newNumber);
        installation.setActive(
                request.getActive() != null ? request.getActive() : installation.getActive()
        );

        Installation updated = installationRepository.save(installation);
        return toResponse(updated);
    }

    public List<InstallationResponse> getAllInstallations() {
        return installationRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<InstallationResponse> getActiveInstallations() {
        return installationRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public Installation getByIdOrThrow(Long id) {
        return installationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Instalación no encontrada con id " + id));
    }

    public void deleteInstallation(Long id) {
        if (!installationRepository.existsById(id)) {
            throw new BusinessException("No existe ninguna instalación con id " + id);
        }
        installationRepository.deleteById(id);
    }

    // Validación básica de los datos obligatorios de la instalación
    private void validateRequest(InstallationRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BusinessException("El nombre de la instalación es obligatorio");
        }
        if (request.getType() == null || request.getType().isBlank()) {
            throw new BusinessException("El tipo de instalación es obligatorio");
        }
    }

    // Traduce el string recibido a un InstallationType controlado
    private InstallationType parseType(String typeStr) {
        try {
            return InstallationType.fromDbValue(typeStr);
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Tipo de instalación inválido: " + typeStr);
        }
    }

    // Conversión de entidad Installation a DTO InstallationResponse
    private InstallationResponse toResponse(Installation installation) {
        return new InstallationResponse(
                installation.getId(),
                installation.getName(),
                installation.getType() != null ? installation.getType().getDbValue() : null,
                installation.getNumber(),
                installation.getActive(),
                installation.getCreatedAt()
        );
    }
}
