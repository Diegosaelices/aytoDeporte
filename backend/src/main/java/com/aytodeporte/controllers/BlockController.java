// Controlador REST para gestionar bloqueos: creación, listado y eliminación.
// Expone endpoints para bloqueos globales y por instalación.

package com.aytodeporte.controllers;

import com.aytodeporte.dto.BlockRequest;
import com.aytodeporte.dto.BlockResponse;
import com.aytodeporte.services.BlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blocks")
@RequiredArgsConstructor
public class BlockController {

    private final BlockService blockService;

    // Crear un nuevo bloqueo (global o por instalación)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BlockResponse create(@RequestBody BlockRequest request) {
        return blockService.createBlock(request);
    }

    // Obtener todos los bloqueos existentes
    @GetMapping
    public List<BlockResponse> getAll() {
        return blockService.getAllBlocks();
    }

    // Listar únicamente bloqueos globales
    @GetMapping("/global")
    public List<BlockResponse> getGlobalBlocks() {
        return blockService.getGlobalBlocks();
    }

    // Listar bloqueos asociados a una instalación concreta
    @GetMapping("/installation/{installationId}")
    public List<BlockResponse> getByInstallation(@PathVariable Long installationId) {
        return blockService.getBlocksByInstallation(installationId);
    }

    // Eliminar un bloqueo por su ID
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        blockService.deleteBlock(id);
    }
}
