package com.hospitalmanagement.hospital_management.service;

import com.hospitalmanagement.hospital_management.DTO.DoctorRequest;
import com.hospitalmanagement.hospital_management.DTO.DoctorResponse;

import java.util.List;

public interface DoctorService {
    List<DoctorResponse> getDoctor();
    DoctorResponse getDoctorById(Long Id);
    DoctorResponse addDoctor(DoctorRequest doctorRequest);
    DoctorResponse updateDoctorById(Long id, DoctorRequest doctorRequest);
    void deleteDoctorById(Long Id);
    void deleteDoctor();

}

