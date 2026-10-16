package com.hospitalmanagement.hospital_management.service;

import com.hospitalmanagement.hospital_management.DTO.PatientRequest;
import com.hospitalmanagement.hospital_management.DTO.PatientResponse;
import com.hospitalmanagement.hospital_management.entity.AppointmentEntity;
import com.hospitalmanagement.hospital_management.entity.DoctorEntity;
import com.hospitalmanagement.hospital_management.entity.InsuranceEntity;
import com.hospitalmanagement.hospital_management.entity.PatientEntity;
import com.hospitalmanagement.hospital_management.entity.Role;
import com.hospitalmanagement.hospital_management.entity.UserEntity;
import com.hospitalmanagement.hospital_management.repository.AppointmentRepository;
import com.hospitalmanagement.hospital_management.repository.DoctorRepository;
import com.hospitalmanagement.hospital_management.repository.InsuranceRepository;
import com.hospitalmanagement.hospital_management.repository.PatientRepository;
import com.hospitalmanagement.hospital_management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PatientServiceImp implements PatientService {
    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private InsuranceRepository insuranceRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

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

    private PatientResponse mapToResponse(PatientEntity p) {
        return new PatientResponse(
                p.getId(),
                p.getPatientName(),
                p.getGender(),
                p.getAge(),
                p.getEmail(),
                p.getMobileNumber(),
                p.getAddress(),
                p.getInsurance() != null ? p.getInsurance().getId() : null
        );
    }

    @Override
    public List<PatientResponse> getAllPatient() {
        DoctorEntity doctor = getCurrentDoctor();
        if (doctor != null) {
            // A doctor must see only patients who have appointments assigned to that doctor
            Set<Long> doctorPatientIds = appointmentRepository.findAll().stream()
                    .filter(a -> a.getDoctor() != null && a.getDoctor().getId().equals(doctor.getId()))
                    .map(a -> a.getPatient() != null ? a.getPatient().getId() : null)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            return patientRepository.findAll().stream()
                    .filter(p -> doctorPatientIds.contains(p.getId()))
                    .map(this::mapToResponse)
                    .toList();
        }

        PatientEntity patient = getCurrentPatient();
        if (patient != null) {
            return List.of(mapToResponse(patient));
        }

        return patientRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    @Override
    public PatientResponse getPatientById(Long Id){
        PatientEntity p = patientRepository.findById(Id)
                .orElseThrow(() -> new RuntimeException("Id not found"));

        DoctorEntity doctor = getCurrentDoctor();
        if (doctor != null) {
            boolean hasAppointment = appointmentRepository.findAll().stream()
                    .anyMatch(a -> a.getDoctor() != null && a.getDoctor().getId().equals(doctor.getId())
                            && a.getPatient() != null && a.getPatient().getId().equals(Id));
            if (!hasAppointment) {
                throw new RuntimeException("Access denied to patient details");
            }
        }

        PatientEntity patient = getCurrentPatient();
        if (patient != null && !patient.getId().equals(Id)) {
            throw new RuntimeException("Access denied to patient details");
        }

        return mapToResponse(p);
    }

    @Override
    public PatientResponse addPatient(PatientRequest request){
        PatientEntity p=new PatientEntity();
        p.setPatientName(request.getPatientName());
        p.setGender(request.getGender());
        p.setAge(request.getAge());
        p.setEmail(request.getEmail());
        p.setMobileNumber(request.getMobileNumber());
        p.setAddress(request.getAddress());
        if(request.getInsuranceId()!=null){
            InsuranceEntity insurance=insuranceRepository.findById(request.getInsuranceId()).orElseThrow(()->new RuntimeException("Insurance Id not found"));
            p.setInsurance(insurance);
        }

        PatientEntity save=patientRepository.save(p);

        // Connect patient account and login credentials if password provided
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            String uname = (save.getEmail() != null && !save.getEmail().trim().isEmpty())
                    ? save.getEmail().trim()
                    : save.getPatientName().trim();
            UserEntity user = userRepository.findByUsername(uname).orElseGet(UserEntity::new);
            user.setUsername(uname);
            user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
            user.setRole(Role.PATIENT);
            userRepository.save(user);
        }

        return mapToResponse(save);
    }

    @Override
    public PatientResponse updatePatient(PatientRequest request,Long Id){
        PatientEntity patient = getCurrentPatient();
        if (patient != null && !patient.getId().equals(Id)) {
            throw new RuntimeException("Access denied: cannot update another patient's profile");
        }

        PatientEntity p= patientRepository.findById(Id).orElseThrow(()->new RuntimeException("Id not found"));
        String oldEmail = p.getEmail();
        String oldName = p.getPatientName();

        p.setPatientName(request.getPatientName());
        p.setGender(request.getGender());
        p.setAge(request.getAge());
        p.setEmail(request.getEmail());
        p.setMobileNumber(request.getMobileNumber());
        p.setAddress(request.getAddress());
        if(request.getInsuranceId()!=null){
            InsuranceEntity insurance=insuranceRepository.findById(request.getInsuranceId()).orElseThrow(()->new RuntimeException("Insurance Id not found"));
            p.setInsurance(insurance);
        }
        else{
            p.setInsurance(null);
        }
        PatientEntity save=patientRepository.save(p);

        String newUname = (save.getEmail() != null && !save.getEmail().trim().isEmpty())
                ? save.getEmail().trim()
                : save.getPatientName().trim();

        // Update login credentials if password provided or email changed
        String lookupKey = (oldEmail != null && !oldEmail.trim().isEmpty()) ? oldEmail.trim() : (oldName != null ? oldName.trim() : "");
        Optional<UserEntity> userOpt = !lookupKey.isEmpty() ? userRepository.findByUsername(lookupKey) : Optional.empty();
        if (userOpt.isPresent()) {
            UserEntity user = userOpt.get();
            user.setUsername(newUname);
            if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
                user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
            }
            userRepository.save(user);
        } else if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            UserEntity user = new UserEntity();
            user.setUsername(newUname);
            user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
            user.setRole(Role.PATIENT);
            userRepository.save(user);
        }

        return mapToResponse(save);
    }

    @Override
    public void deletePatientById(Long Id){
        UserEntity user = getCurrentUser();
        if (user != null && user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Access denied: only administrators can delete patient records");
        }
        patientRepository.findById(Id).ifPresent(p -> {
            if (p.getEmail() != null) {
                userRepository.findByUsername(p.getEmail()).ifPresent(userRepository::delete);
            }
            if (p.getPatientName() != null) {
                userRepository.findByUsername(p.getPatientName()).ifPresent(userRepository::delete);
            }
        });
        patientRepository.deleteById(Id);
    }

    @Override
    public void deleteAllPatient(){
        UserEntity user = getCurrentUser();
        if (user != null && user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Access denied: only administrators can delete all patient records");
        }
        List<PatientEntity> patients = patientRepository.findAll();
        for (PatientEntity p : patients) {
            if (p.getEmail() != null) {
                userRepository.findByUsername(p.getEmail()).ifPresent(userRepository::delete);
            }
            if (p.getPatientName() != null) {
                userRepository.findByUsername(p.getPatientName()).ifPresent(userRepository::delete);
            }
        }
        patientRepository.deleteAll();
    }

}
