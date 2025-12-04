// Repositorio JPA para gestionar usuarios, con métodos de búsqueda por email.
// Permite validar duplicados y recuperar usuarios para autenticación.

package com.aytodeporte.repositories;

import com.aytodeporte.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);
}
