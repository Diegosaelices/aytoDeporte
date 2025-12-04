// Repositorio JPA para gestionar bloqueos en base de datos.
// Incluye consultas específicas para bloqueos globales, por instalación y solapamientos.

package com.aytodeporte.repositories;

import com.aytodeporte.models.Block;
import com.aytodeporte.models.Installation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface BlockRepository extends JpaRepository<Block, Long> {

    // Bloqueos globales (sin instalación asociada)
    List<Block> findByInstallationIsNull();

    // Bloqueos de una instalación concreta
    List<Block> findByInstallation(Installation installation);

    // Todos los bloqueos ordenados por fecha de inicio
    List<Block> findAllByOrderByStartAsc();

    // Bloqueos de una instalación ordenados por inicio
    List<Block> findByInstallationOrderByStartAsc(Installation installation);

    // Bloqueos que se solapan con un rango horario en una instalación
    @Query("""
        SELECT b FROM Block b
        WHERE b.installation = :installation
          AND (b.start < :end AND b.end > :start)
    """)
    List<Block> findOverlapping(Installation installation,
                                LocalDateTime start,
                                LocalDateTime end);
}
