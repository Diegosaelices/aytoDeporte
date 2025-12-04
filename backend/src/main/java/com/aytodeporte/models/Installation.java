package com.aytodeporte.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "instalaciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Installation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") 
    private Long id;

    @Column(name = "nombre", nullable = false, length = 120)
    private String name;

    @Column(name = "tipo_instalacion", nullable = false, length = 50)
    @Convert(converter = InstallationTypeConverter.class)
    private InstallationType type;

    @Column(name = "numero")
    private Integer number;    

    @Column(name = "activa", nullable = false)
    private Boolean active;

    @Column(name = "fecha_alta", nullable = false)
    private LocalDateTime createdAt;
}
