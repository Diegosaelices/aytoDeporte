package com.aytodeporte.models;

import jakarta.persistence.*;
import lombok.*;
import lombok.Builder;


import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") // BIGINT UNSIGNED AUTO_INCREMENT
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instalacion_id", nullable = false)
    private Installation installation;

    @Column(name = "inicio", nullable = false)
    private LocalDateTime start;

    @Column(name = "fin", nullable = false)
    private LocalDateTime end;

    @Column(name = "estado", nullable = false, length = 20)
    @Convert(converter = ReservationStatusConverter.class)
    private ReservationStatus status;

    @Column(name = "codigo_6", length = 6)
    private String code;

    @Column(name = "verificado_en_mostrador")
    private LocalDateTime verifiedAt;

    @Column(name = "importe_calculado", nullable = false)
    private BigDecimal amount;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime createdAt;

    //Para pasar duracion en minutos
    @Transient
    private Integer durationMinutes;

    public Integer getDurationMinutes() {
        if (durationMinutes != null) {
            return durationMinutes;
        }
        if (start != null && end != null) {
            return (int) Duration.between(start, end).toMinutes();
        }
        return null;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
        if (durationMinutes != null && start != null) {
            this.end = this.start.plusMinutes(durationMinutes);
        }
    }
}
