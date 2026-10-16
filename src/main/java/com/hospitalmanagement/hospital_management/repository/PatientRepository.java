package com.hospitalmanagement.hospital_management.repository;

import com.hospitalmanagement.hospital_management.DTO.PatientResponse;
import com.hospitalmanagement.hospital_management.entity.PatientEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<PatientEntity,Long> {
}
