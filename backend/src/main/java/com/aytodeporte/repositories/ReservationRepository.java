// Repositorio JPA para gestionar reservas, con consultas filtradas por instalación, usuario y estado.
// Facilita obtener reservas confirmadas o canceladas según criterios.

package com.aytodeporte.repositories;

import com.aytodeporte.models.Installation;
import com.aytodeporte.models.Reservation;
import com.aytodeporte.models.ReservationStatus;
import com.aytodeporte.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByInstallationAndStatus(Installation installation, ReservationStatus status);

    List<Reservation> findByUserAndStatus(User user, ReservationStatus status);
}
