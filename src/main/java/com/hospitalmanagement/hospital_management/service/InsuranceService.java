package com.hospitalmanagement.hospital_management.service;

import com.hospitalmanagement.hospital_management.DTO.InsuranceRequest;
import com.hospitalmanagement.hospital_management.DTO.InsuranceResponse;

import java.util.List;

public interface InsuranceService {
    InsuranceResponse getInsuranceById(Long Id);
    List<InsuranceResponse> getInsurance();
    InsuranceResponse addInsurance(InsuranceRequest insuranceRequest);
    InsuranceResponse updateInsuranceById(Long Id,InsuranceRequest insuranceRequest);
    void deleteInsuranceById(Long Id);
    void deleteInsurance();
}
