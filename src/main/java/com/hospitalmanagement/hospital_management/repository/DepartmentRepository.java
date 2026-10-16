package com.hospitalmanagement.hospital_management.repository;

import com.hospitalmanagement.hospital_management.entity.DepartmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<DepartmentEntity,Long> {
}
