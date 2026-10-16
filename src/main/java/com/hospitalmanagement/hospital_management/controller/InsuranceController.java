package com.hospitalmanagement.hospital_management.controller;
import com.hospitalmanagement.hospital_management.DTO.InsuranceRequest;
import com.hospitalmanagement.hospital_management.DTO.InsuranceResponse;
import com.hospitalmanagement.hospital_management.service.InsuranceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class InsuranceController {
    @Autowired
    public final InsuranceService insuranceService;
    public InsuranceController(InsuranceService insuranceService) {
        this.insuranceService = insuranceService;
    }

    @GetMapping("/Insurance")
    public List<InsuranceResponse> getInsurance() {
        return insuranceService.getInsurance();
    }
    @GetMapping("/Insurance/{Id}")
    public InsuranceResponse getInsuranceById(@PathVariable Long Id) {
        return insuranceService.getInsuranceById(Id);
    }

    @PostMapping("/Insurance")
    public InsuranceResponse addInsurance(@RequestBody InsuranceRequest insuranceRequest) {
        return insuranceService.addInsurance(insuranceRequest);
    }
    @PutMapping("/Insurance/{Id}")
    public InsuranceResponse updateInsuranceById(@PathVariable Long Id, @RequestBody InsuranceRequest insuranceRequest) {
        return insuranceService.updateInsuranceById(Id,insuranceRequest);
    }

    @DeleteMapping("/Insurance/{Id}")
    void deleteInsuranceById(@PathVariable Long Id) {
        insuranceService.deleteInsuranceById(Id);
    }

    @DeleteMapping("/Insurance")
    void deleteInsurance(){
        insuranceService.deleteInsurance();
    }
}
