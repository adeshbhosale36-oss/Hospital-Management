package com.hospitalmanagement.hospital_management.repository;

import com.hospitalmanagement.hospital_management.entity.InsuranceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InsuranceRepository extends JpaRepository<InsuranceEntity,Long> {
}
