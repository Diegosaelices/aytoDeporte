// Utilidad para generar, validar y leer tokens JWT usados en la autenticación.
// Firma tokens con HS256 y establece un tiempo de expiración de 24h.

package com.aytodeporte.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // Clave secreta para firmar los tokens (debería venir de configuración externa)
    private static final String SECRET_KEY ="SDA91!as_d812HAs92@asD9182Lasd_912hASD89!as_d81HA92@sdaL812asD912h";

    // Expiración del token: 24 horas
    private static final long EXPIRATION_TIME = 1000L * 60 * 60 * 24;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            extractEmail(token);  // si falla, no es válido
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}
