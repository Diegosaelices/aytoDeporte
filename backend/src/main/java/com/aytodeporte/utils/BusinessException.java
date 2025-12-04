// Excepción de negocio personalizada para validar reglas y lanzar errores controlados.
// Permite distinguir fallos funcionales de errores internos del servidor.

package com.aytodeporte.utils;

public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
