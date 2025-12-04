// Configuración principal de seguridad: define endpoints públicos/privados, JWT, CORS y sesiones sin estado.
// Usa un filtro JWT y permite protección por roles/anotaciones en controladores.

package com.aytodeporte.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // Desactiva CSRF porque trabajamos con API REST + JWT (sin cookies de sesión)
        http.csrf(csrf -> csrf.disable());

        // Indica que la API es stateless: no se mantienen sesiones en el servidor
        http.sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        );

        // Configuración de CORS para permitir peticiones desde el front
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));

        // Define qué rutas son públicas y cuáles requieren autenticación
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers(
                        "/",
                        "/index.html",
                        "/sobre-mi.html",
                        "/css/**",
                        "/js/**",
                        "/img/**",
                        "/docs/**"
                ).permitAll()
                .requestMatchers(
                        "/api/users/login",
                        "/api/users/register",
                        "/api/users/ping"
                ).permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
        );

        // Inserta el filtro JWT antes del filtro estándar de autenticación por usuario/contraseña
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Configuración de CORS para permitir el front en local
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(
                "http://localhost",
                "http://127.0.0.1",
                "http://localhost:5500",
                "http://127.0.0.1:5500"
        ));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
