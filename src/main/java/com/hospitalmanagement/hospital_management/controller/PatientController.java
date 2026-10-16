package com.hospitalmanagement.hospital_management.controller;
import com.hospitalmanagement.hospital_management.DTO.PatientRequest;
import com.hospitalmanagement.hospital_management.DTO.PatientResponse;
import com.hospitalmanagement.hospital_management.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class PatientController {
    public final PatientService patientService;
    public PatientController(PatientService patientService) {
        this.patientService =patientService;
    }

    @GetMapping("/Patient")
    public List<PatientResponse> getAllPatient(){
        return patientService.getAllPatient();
    }

    @GetMapping("/Patient/{Id}")
    public PatientResponse getPatientById(@PathVariable Long Id){
        return patientService.getPatientById(Id);
    }

    @PostMapping("/Patient")
    public ResponseEntity<PatientResponse> addPatient(@Valid @RequestBody PatientRequest request){
        PatientResponse response= patientService.addPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/Patient/{Id}")
    public ResponseEntity<PatientResponse> updatePatient(@Valid @RequestBody PatientRequest request,@PathVariable Long Id){
        PatientResponse response=patientService.updatePatient(request,Id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/Patient/{Id}")
    public void DeletePatientById(@PathVariable Long Id){
        patientService.deletePatientById(Id);
    }

    @DeleteMapping("/Patient")
    public void deleteAllPatient(){
        patientService.deleteAllPatient();
    }

}
