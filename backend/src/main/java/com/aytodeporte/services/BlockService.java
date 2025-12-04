// Servicio de negocio para gestionar bloqueos: creación, listado, filtrado y eliminación.
// Aplica validaciones de solapamiento, rangos de fechas y existencia de instalación/usuario.

package com.aytodeporte.services;

import com.aytodeporte.dto.BlockRequest;
import com.aytodeporte.dto.BlockResponse;
import com.aytodeporte.models.Block;
import com.aytodeporte.models.Installation;
import com.aytodeporte.models.User;
import com.aytodeporte.repositories.BlockRepository;
import com.aytodeporte.repositories.InstallationRepository;
import com.aytodeporte.repositories.UserRepository;
import com.aytodeporte.utils.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BlockService {

    private final BlockRepository blockRepository;
    private final InstallationRepository installationRepository;
    private final UserRepository userRepository;

    @Transactional
    public BlockResponse createBlock(BlockRequest request) {

        // Si viene instalación, el bloqueo es específico; si no, será global
        Installation installation = null;
        if (request.getInstallationId() != null) {
            installation = installationRepository.findById(request.getInstallationId())
                    .orElseThrow(() -> new BusinessException("Instalación no encontrada"));
        }

        User creator = userRepository.findById(request.getCreatedByUserId())
                .orElseThrow(() -> new BusinessException("Usuario creador no encontrado"));

        LocalDateTime start = LocalDateTime.parse(request.getStart());
        LocalDateTime end = LocalDateTime.parse(request.getEnd());

        if (end.isBefore(start)) {
            throw new BusinessException("La fecha fin no puede ser anterior al inicio");
        }

        // Validar solapamientos solo si el bloqueo es para una instalación concreta
        if (installation != null) {
            var overlapping = blockRepository.findOverlapping(installation, start, end);
            if (!overlapping.isEmpty()) {
                throw new BusinessException("Ya existe un bloqueo en ese horario para esa instalación");
            }
        }

        Block block = Block.builder()
                .installation(installation)
                .reason(request.getReason())
                .start(start)
                .end(end)
                .createdBy(creator)
                .createdAt(LocalDateTime.now())
                .build();

        Block saved = blockRepository.save(block);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BlockResponse> getAllBlocks() {
        return blockRepository.findAllByOrderByStartAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BlockResponse> getBlocksByInstallation(Long installationId) {
        Installation installation = installationRepository.findById(installationId)
                .orElseThrow(() -> new BusinessException("Instalación no encontrada"));

        return blockRepository.findByInstallationOrderByStartAsc(installation)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BlockResponse> getGlobalBlocks() {
        return blockRepository.findByInstallationIsNull()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteBlock(Long id) {
        if (!blockRepository.existsById(id)) {
            throw new BusinessException("Bloqueo no encontrado");
        }
        blockRepository.deleteById(id);
    }

    // Conversión de entidad Block a DTO BlockResponse
    private BlockResponse toResponse(Block b) {
        Long installationId = null;
        String installationName;

        if (b.getInstallation() != null) {
            installationId = b.getInstallation().getId();
            installationName = b.getInstallation().getName();
        } else {
            installationName = "TODAS LAS INSTALACIONES";
        }

        return new BlockResponse(
                b.getId(),
                installationId,
                installationName,
                b.getReason(),
                b.getStart().toString(),
                b.getEnd().toString(),
                b.getCreatedBy().getId(),
                b.getCreatedBy().getEmail(),
                b.getCreatedAt().toString()
        );
    }
}
