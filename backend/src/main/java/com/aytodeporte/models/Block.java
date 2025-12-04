package com.aytodeporte.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bloqueos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Block {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instalacion_id")
    private Installation installation;

    @Column(name = "motivo", nullable = false, length = 200)
    private String reason;

    @Column(name = "inicio", nullable = false)
    private LocalDateTime start;

    @Column(name = "fin", nullable = false)
    private LocalDateTime end;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por", nullable = false)
    private User createdBy;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime createdAt;
}
