package com.hospitalmanagement.hospital_management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter @Setter
public class InsuranceEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long Id;

    @Column(nullable = false,unique = true,length = 50)
    private String PolicyNumber;

    @Column(nullable = false,length = 100)
    private String Provider;

    @Column(nullable = false)
    private LocalDate ValidUntil;

    @CreationTimestamp
    @Column(nullable = false,updatable = false)
    private LocalDateTime CreatedAt;

    @OneToOne(mappedBy = "insurance")
    private PatientEntity patient;
}
