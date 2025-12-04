// Controlador sencillo para comprobar que la API está operativa.
// Devuelve un JSON básico con un mensaje de estado.

package com.aytodeporte.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class TestController {

    // Endpoint de test para verificar disponibilidad del servidor
    @GetMapping("/api/test")
    public Map<String, Object> test() {
        return Map.of(
                "status", "ok",
                "message", "AytoDeporte API funcionando correctamente"
        );
    }
}
