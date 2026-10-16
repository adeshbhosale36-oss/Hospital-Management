package com.hospitalmanagement.hospital_management.controller;
import com.hospitalmanagement.hospital_management.DTO.AppointmentRequest;
import com.hospitalmanagement.hospital_management.DTO.AppointmentResponse;
import com.hospitalmanagement.hospital_management.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class AppointmentController {
    public final AppointmentService appointmentService;
    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping("/Appointment")
    public List<AppointmentResponse> getAllAppointment(){
        return appointmentService.getAllAppointment();
    }

    @GetMapping("/Appointment/{Id}")
    public AppointmentResponse getAppointmentById(@PathVariable Long Id){
        return appointmentService.getAppointmentById(Id);
    }
    @PostMapping("/Appointment")
    public AppointmentResponse addAppointment(@Valid @RequestBody AppointmentRequest request) {
        return appointmentService.addAppointment(request);
    }

    @PutMapping("/Appointment/{Id}")
    public AppointmentResponse updateAppointment(@Valid @RequestBody AppointmentRequest request,@PathVariable Long Id) {
        return appointmentService.updateAppointment(request,Id);
    }

    @DeleteMapping("/Appointment")
    public void deleteAppointment() {
        appointmentService.deleteAppointment();
    }
    @DeleteMapping("/Appointment/{Id}")
    public void deleteAppointmentById(@PathVariable Long Id){
        appointmentService.deleteAppointmentById(Id);
    }



}
