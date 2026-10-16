package com.hospitalmanagement.hospital_management.service;

import com.hospitalmanagement.hospital_management.DTO.LoginRequest;
import com.hospitalmanagement.hospital_management.DTO.LoginResponse;
import com.hospitalmanagement.hospital_management.DTO.SignupRequest;
import com.hospitalmanagement.hospital_management.config.JWTUtil;
import com.hospitalmanagement.hospital_management.entity.UserEntity;
import com.hospitalmanagement.hospital_management.entity.DoctorEntity;
import com.hospitalmanagement.hospital_management.entity.PatientEntity;
import com.hospitalmanagement.hospital_management.entity.Role;
import com.hospitalmanagement.hospital_management.repository.DoctorRepository;
import com.hospitalmanagement.hospital_management.repository.PatientRepository;
import com.hospitalmanagement.hospital_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JWTUtil jwtUtil;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    public String signup(SignupRequest request) {
        if(userRepository.findByUsername(request.getUsername()).isPresent()){
            return "Username already exists";
        }
        UserEntity user=new UserEntity();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        userRepository.save(user);

        // If registered as patient, ensure a patient profile exists
        if (request.getRole() == Role.PATIENT) {
            String uname = request.getUsername().trim();
            boolean patientExists = patientRepository.findAll().stream()
                    .anyMatch(p -> uname.equalsIgnoreCase(p.getEmail()) || uname.equalsIgnoreCase(p.getPatientName()));
            if (!patientExists) {
                PatientEntity newPatient = new PatientEntity();
                newPatient.setPatientName(uname);
                if (uname.contains("@")) {
                    newPatient.setEmail(uname);
                } else {
                    newPatient.setEmail(uname + "@patient.hospital.org");
                }
                newPatient.setGender("Other");
                newPatient.setAge(30);
                newPatient.setMobileNumber(9876543210L);
                newPatient.setAddress("Hospital Patient");
                patientRepository.save(newPatient);
            }
        }

        return "user registered successfully";
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication=authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );
        CustomUserDetails userDetails=(CustomUserDetails)authentication.getPrincipal();
        UserEntity user=userDetails.getUser();
        String token=jwtUtil.generateToken(user);

        Long profileId = null;
        String displayName = user.getUsername();

        if (user.getRole() == Role.DOCTOR) {
            Optional<DoctorEntity> docOpt = doctorRepository.findAll().stream()
                    .filter(d -> user.getUsername().equalsIgnoreCase(d.getEmail()) || user.getUsername().equalsIgnoreCase(d.getName()))
                    .findFirst();
            if (docOpt.isPresent()) {
                DoctorEntity doc = docOpt.get();
                profileId = doc.getId();
                displayName = doc.getName();
            }
        } else if (user.getRole() == Role.PATIENT) {
            Optional<PatientEntity> patOpt = patientRepository.findAll().stream()
                    .filter(p -> user.getUsername().equalsIgnoreCase(p.getEmail()) || user.getUsername().equalsIgnoreCase(p.getPatientName()))
                    .findFirst();
            if (patOpt.isPresent()) {
                PatientEntity pat = patOpt.get();
                profileId = pat.getId();
                displayName = pat.getPatientName();
            } else {
                // Ensure patient entity exists so patient has an ID to book appointments
                PatientEntity newPatient = new PatientEntity();
                newPatient.setPatientName(user.getUsername());
                if (user.getUsername().contains("@")) {
                    newPatient.setEmail(user.getUsername());
                } else {
                    newPatient.setEmail(user.getUsername() + "@patient.hospital.org");
                }
                newPatient.setGender("Other");
                newPatient.setAge(30);
                newPatient.setMobileNumber(9876543210L);
                newPatient.setAddress("Hospital Patient");
                PatientEntity saved = patientRepository.save(newPatient);
                profileId = saved.getId();
                displayName = saved.getPatientName();
            }
        } else if (user.getRole() == Role.ADMIN) {
            displayName = "Administrator";
        }

        return new LoginResponse(user.getId(), token, user.getRole().name(), profileId, displayName);
    }
}
