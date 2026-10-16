package com.hospitalmanagement.hospital_management.service;
import com.hospitalmanagement.hospital_management.DTO.AppointmentRequest;
import com.hospitalmanagement.hospital_management.DTO.AppointmentResponse;


import java.util.List;

public interface AppointmentService {
     List<AppointmentResponse> getAllAppointment();
     AppointmentResponse getAppointmentById(Long Id);
     AppointmentResponse addAppointment(AppointmentRequest request);
     AppointmentResponse updateAppointment(AppointmentRequest request,Long Id);
     void deleteAppointmentById(Long Id);
     void deleteAppointment();



}
