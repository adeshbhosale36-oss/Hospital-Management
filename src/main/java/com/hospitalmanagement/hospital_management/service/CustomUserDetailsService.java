package com.hospitalmanagement.hospital_management.service;

import com.hospitalmanagement.hospital_management.entity.DoctorEntity;
import com.hospitalmanagement.hospital_management.entity.PatientEntity;
import com.hospitalmanagement.hospital_management.entity.UserEntity;
import com.hospitalmanagement.hospital_management.repository.DoctorRepository;
import com.hospitalmanagement.hospital_management.repository.PatientRepository;
import com.hospitalmanagement.hospital_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<UserEntity> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty()) {
            // Try matching doctor by email or name
            Optional<DoctorEntity> doc = doctorRepository.findAll().stream()
                    .filter(d -> username.equalsIgnoreCase(d.getEmail()) || username.equalsIgnoreCase(d.getName()))
                    .findFirst();
            if (doc.isPresent()) {
                userOpt = userRepository.findByUsername(doc.get().getEmail());
            }
        }

        if (userOpt.isEmpty()) {
            // Try matching patient by email or name
            Optional<PatientEntity> pat = patientRepository.findAll().stream()
                    .filter(p -> username.equalsIgnoreCase(p.getEmail()) || username.equalsIgnoreCase(p.getPatientName()))
                    .findFirst();
            if (pat.isPresent()) {
                userOpt = userRepository.findByUsername(pat.get().getEmail());
                if (userOpt.isEmpty() && pat.get().getPatientName() != null) {
                    userOpt = userRepository.findByUsername(pat.get().getPatientName());
                }
            }
        }

        UserEntity user = userOpt
                .orElseThrow(() -> new UsernameNotFoundException("user not found: " + username));
        return new CustomUserDetails(user);
    }
}
