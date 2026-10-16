package com.hospitalmanagement.hospital_management.controller;

import com.hospitalmanagement.hospital_management.DTO.DoctorRequest;
import com.hospitalmanagement.hospital_management.DTO.DoctorResponse;
import com.hospitalmanagement.hospital_management.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class DoctorController {
    @Autowired
    public final DoctorService doctorService;
    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping("/Doctor")
    public List<DoctorResponse> getDoctor() {
        return doctorService.getDoctor();
    }
    @GetMapping("/Doctor/{Id}")
    public DoctorResponse getDoctorById(@PathVariable Long Id) {
        return doctorService.getDoctorById(Id);
    }

    @PostMapping("/Doctor")
    public DoctorResponse addDoctor(@RequestBody DoctorRequest doctorRequest) {
        return doctorService.addDoctor(doctorRequest);
    }
    @PutMapping("/Doctor/{Id}")
    public DoctorResponse updateDoctorById(@PathVariable Long Id, @RequestBody DoctorRequest doctorRequest) {
        return doctorService.updateDoctorById(Id,doctorRequest);
    }

    @DeleteMapping("/Doctor/{Id}")
    void deleteDoctorById(@PathVariable Long Id) {
        doctorService.deleteDoctorById(Id);
    }

    @DeleteMapping("/Doctor")
    void deleteDoctor(){
        doctorService.deleteDoctor();
    }
}
