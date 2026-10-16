package com.hospitalmanagement.hospital_management.service;
import com.hospitalmanagement.hospital_management.DTO.PatientRequest;
import com.hospitalmanagement.hospital_management.DTO.PatientResponse;
import java.util.List;

public interface PatientService {

    PatientResponse getPatientById(Long Id);
    List<PatientResponse> getAllPatient();
    PatientResponse addPatient(PatientRequest request);
    PatientResponse updatePatient(PatientRequest request,Long Id);
    void deletePatientById(Long Id);
    void deleteAllPatient();

}