package com.hospitalmanagement.hospital_management.service;
import com.hospitalmanagement.hospital_management.DTO.DepartmentRequest;
import com.hospitalmanagement.hospital_management.DTO.DepartmentResponse;

import java.util.List;

public interface DepartmentService {
    List<DepartmentResponse> getDepartment();
    DepartmentResponse getDepartmentById(Long Id);
    DepartmentResponse addDepartment(DepartmentRequest request);
    DepartmentResponse updateDepartmentById(Long Id,DepartmentRequest request);
    void deleteDepartmentById(Long Id);
    void deleteDepartment();
}
