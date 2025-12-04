// Repositorio JPA para gestionar instalaciones, con consultas por orden, estado y duplicados.
// Permite buscar instalaciones activas y verificar si existe otra con mismo tipo y número.

package com.aytodeporte.repositories;

import com.aytodeporte.models.Installation;
import com.aytodeporte.models.InstallationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstallationRepository extends JpaRepository<Installation, Long> {

    List<Installation> findAllByOrderByNameAsc();

    List<Installation> findByActiveTrueOrderByNameAsc();

    Optional<Installation> findByTypeAndNumber(InstallationType type, Integer number);
}
