package com.hospitalmanagement.hospital_management.service;

import com.hospitalmanagement.hospital_management.DTO.AppointmentRequest;
import com.hospitalmanagement.hospital_management.DTO.AppointmentResponse;
import com.hospitalmanagement.hospital_management.entity.AppointmentEntity;
import com.hospitalmanagement.hospital_management.entity.DoctorEntity;
import com.hospitalmanagement.hospital_management.entity.PatientEntity;
import com.hospitalmanagement.hospital_management.repository.AppointmentRepository;
import com.hospitalmanagement.hospital_management.repository.DoctorRepository;
import com.hospitalmanagement.hospital_management.repository.PatientRepository;
import com.hospitalmanagement.hospital_management.entity.Role;
import com.hospitalmanagement.hospital_management.entity.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppointmentServiceImp implements AppointmentService {
    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    private UserEntity getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof CustomUserDetails) {
            return ((CustomUserDetails) auth.getPrincipal()).getUser();
        }
        return null;
    }

    private DoctorEntity getCurrentDoctor() {
        UserEntity user = getCurrentUser();
        if (user == null || user.getRole() != Role.DOCTOR) return null;
        String uname = user.getUsername();
        return doctorRepository.findAll().stream()
                .filter(d -> uname.equalsIgnoreCase(d.getEmail()) || uname.equalsIgnoreCase(d.getName()))
                .findFirst().orElse(null);
    }

    private PatientEntity getCurrentPatient() {
        UserEntity user = getCurrentUser();
        if (user == null || user.getRole() != Role.PATIENT) return null;
        String uname = user.getUsername();
        return patientRepository.findAll().stream()
                .filter(p -> uname.equalsIgnoreCase(p.getEmail()) || uname.equalsIgnoreCase(p.getPatientName()))
                .findFirst().orElse(null);
    }

    private AppointmentResponse mapToResponse(AppointmentEntity p) {
        return new AppointmentResponse(
                p.getId(),
                p.getAppointmentDate(),
                p.getReason(),
                p.getPatient() != null ? p.getPatient().getId() : null,
                p.getDoctor() != null ? p.getDoctor().getId() : null
        );
    }

    @Override
    public List<AppointmentResponse> getAllAppointment() {
        DoctorEntity doctor = getCurrentDoctor();
        if (doctor != null) {
            return appointmentRepository.findAll().stream()
                    .filter(p -> p.getDoctor() != null && p.getDoctor().getId().equals(doctor.getId()))
                    .map(this::mapToResponse)
                    .toList();
        }

        PatientEntity patient = getCurrentPatient();
        if (patient != null) {
            return appointmentRepository.findAll().stream()
                    .filter(p -> p.getPatient() != null && p.getPatient().getId().equals(patient.getId()))
                    .map(this::mapToResponse)
                    .toList();
        }

        return appointmentRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    @Override
    public AppointmentResponse getAppointmentById(Long Id) {
        AppointmentEntity appt = appointmentRepository.findById(Id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        DoctorEntity doctor = getCurrentDoctor();
        if (doctor != null && (appt.getDoctor() == null || !appt.getDoctor().getId().equals(doctor.getId()))) {
            throw new RuntimeException("Access denied to appointment");
        }

        PatientEntity patient = getCurrentPatient();
        if (patient != null && (appt.getPatient() == null || !appt.getPatient().getId().equals(patient.getId()))) {
            throw new RuntimeException("Access denied to appointment");
        }

        return mapToResponse(appt);
    }

    @Override
    public AppointmentResponse addAppointment(AppointmentRequest request) {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setReason(request.getReason());

        Long patientId = request.getPatientId();
        PatientEntity currentPatient = getCurrentPatient();
        if (currentPatient != null) {
            patientId = currentPatient.getId();
        }

        PatientEntity patient = patientRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        appointment.setPatient(patient);

        Long doctorId = request.getDoctorId();
        DoctorEntity currentDoctor = getCurrentDoctor();
        if (currentDoctor != null) {
            doctorId = currentDoctor.getId();
        }

        DoctorEntity doctor = doctorRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));
        appointment.setDoctor(doctor);

        AppointmentEntity save = appointmentRepository.save(appointment);
        return mapToResponse(save);
    }

    @Override
    public AppointmentResponse updateAppointment(AppointmentRequest request, Long Id) {
        AppointmentEntity appointment = appointmentRepository.findById(Id).orElseThrow(() -> new RuntimeException("Appointment not found"));

        DoctorEntity doctor = getCurrentDoctor();
        if (doctor != null && (appointment.getDoctor() == null || !appointment.getDoctor().getId().equals(doctor.getId()))) {
            throw new RuntimeException("Access denied to appointment");
        }

        PatientEntity currentPatient = getCurrentPatient();
        if (currentPatient != null && (appointment.getPatient() == null || !appointment.getPatient().getId().equals(currentPatient.getId()))) {
            throw new RuntimeException("Access denied to appointment");
        }

        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setReason(request.getReason());

        Long patientId = request.getPatientId();
        if (currentPatient != null) {
            patientId = currentPatient.getId();
        }
        PatientEntity patient = patientRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        appointment.setPatient(patient);

        Long doctorId = request.getDoctorId();
        if (doctor != null) {
            doctorId = doctor.getId();
        }
        DoctorEntity doc = doctorRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));
        appointment.setDoctor(doc);

        AppointmentEntity save = appointmentRepository.save(appointment);
        return mapToResponse(save);
    }

    @Override
    public void deleteAppointmentById(Long Id) {
        AppointmentEntity appt = appointmentRepository.findById(Id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        DoctorEntity doctor = getCurrentDoctor();
        if (doctor != null && (appt.getDoctor() == null || !appt.getDoctor().getId().equals(doctor.getId()))) {
            throw new RuntimeException("Access denied to appointment");
        }

        PatientEntity patient = getCurrentPatient();
        if (patient != null && (appt.getPatient() == null || !appt.getPatient().getId().equals(patient.getId()))) {
            throw new RuntimeException("Access denied to appointment");
        }

        appointmentRepository.deleteById(Id);
    }

    @Override
    public void deleteAppointment() {
        UserEntity user = getCurrentUser();
        if (user != null && user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Access denied: only administrators can delete all appointments");
        }
        appointmentRepository.deleteAll();
    }
}
