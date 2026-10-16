package com.hospitalmanagement.hospital_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Getter
@Setter
public class AppointmentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long Id;

    @Column(nullable = false)
    private LocalDate AppointmentDate;

    @Column(length = 500)
    private String Reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patientId",nullable = false)
    private PatientEntity patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctorId",nullable = false)
    private DoctorEntity doctor;
}