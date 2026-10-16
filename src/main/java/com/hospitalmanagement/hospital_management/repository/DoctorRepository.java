package com.hospitalmanagement.hospital_management.repository;

import com.hospitalmanagement.hospital_management.entity.DoctorEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorRepository extends JpaRepository<DoctorEntity,Long> {
}
