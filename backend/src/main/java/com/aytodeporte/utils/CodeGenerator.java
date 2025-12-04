// Generador de códigos numéricos para reservas y otros usos internos.
// Utiliza SecureRandom para obtener valores seguros e impredecibles.

package com.aytodeporte.utils;

import java.security.SecureRandom;

public class CodeGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();

    // Genera un código numérico de la longitud indicada
    public static String generateNumericCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }

    // Genera un código estándar de reserva de 6 dígitos
    public static String generateReservationCode() {
        return generateNumericCode(6);
    }
}
