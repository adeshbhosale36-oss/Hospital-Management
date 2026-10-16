package com.hospitalmanagement.hospital_management.service;

import com.hospitalmanagement.hospital_management.DTO.DoctorRequest;
import com.hospitalmanagement.hospital_management.DTO.DoctorResponse;
import com.hospitalmanagement.hospital_management.entity.AppointmentEntity;
import com.hospitalmanagement.hospital_management.entity.DepartmentEntity;
import com.hospitalmanagement.hospital_management.entity.DoctorEntity;
import com.hospitalmanagement.hospital_management.entity.Role;
import com.hospitalmanagement.hospital_management.entity.UserEntity;
import com.hospitalmanagement.hospital_management.repository.DepartmentRepository;
import com.hospitalmanagement.hospital_management.repository.DoctorRepository;
import com.hospitalmanagement.hospital_management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DoctorServiceImp implements DoctorService {
    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public List<DoctorResponse> getDoctor() {
        return doctorRepository.findAll().stream().map(p->new DoctorResponse(
                p.getId(),
                p.getName(),
                p.getSpecialization(),
                p.getEmail(),
                p.getDepartments()!=null ? p.getDepartments().stream().map(DepartmentEntity::getId).collect(Collectors.toList()):null,
                p.getAppointment()!=null ? p.getAppointment().stream().map(AppointmentEntity::getId).collect(Collectors.toList()):null)).toList();
    }

    @Override
    public DoctorResponse getDoctorById(Long Id) {
        return doctorRepository.findById(Id).map(p->new DoctorResponse(
                p.getId(),
                p.getName(),
                p.getSpecialization(),
                p.getEmail(),
                p.getDepartments()!=null? p.getDepartments().stream().map(DepartmentEntity::getId).collect(Collectors.toList()):null,
                p.getAppointment()!=null? p.getAppointment().stream().map(AppointmentEntity::getId).collect(Collectors.toList()):null)).orElseThrow(()->new RuntimeException("doctor not found"));
    }

    @Override
    public DoctorResponse addDoctor(DoctorRequest doctorRequest) {
        DoctorEntity doctor=new DoctorEntity();
        doctor.setName(doctorRequest.getName());
        doctor.setSpecialization( doctorRequest.getSpecialization() );
        doctor.setEmail(doctorRequest.getEmail());

        if(doctorRequest.getDepartmentId()!=null && !doctorRequest.getDepartmentId().isEmpty()){
            List<DepartmentEntity>departments=departmentRepository.findAllById( doctorRequest.getDepartmentId() );
            doctor.setDepartments(departments);
        }

        DoctorEntity save=doctorRepository.save(doctor);

        // Connect doctor account and login credentials if password provided
        if (doctorRequest.getPassword() != null && !doctorRequest.getPassword().trim().isEmpty()) {
            UserEntity user = userRepository.findByUsername(save.getEmail())
                    .orElseGet(UserEntity::new);
            user.setUsername(save.getEmail());
            user.setPassword(passwordEncoder.encode(doctorRequest.getPassword().trim()));
            user.setRole(Role.DOCTOR);
            userRepository.save(user);
        }

        return new DoctorResponse(
                save.getId(),
                save.getName(),
                save.getSpecialization(),
                save.getEmail(),
                save.getDepartments() != null ? save.getDepartments().stream().map(DepartmentEntity::getId).collect(Collectors.toList()) : null,
                save.getAppointment() != null ? save.getAppointment().stream().map(AppointmentEntity::getId).collect(Collectors.toList()) : null
        );
    }

    @Override
    public DoctorResponse updateDoctorById(Long id, DoctorRequest doctorRequest) {
        DoctorEntity doctor=doctorRepository.findById(id).orElseThrow(()->new RuntimeException("Doctor not found"));
        String oldEmail = doctor.getEmail();
        doctor.setName(doctorRequest.getName());
        doctor.setSpecialization(doctorRequest.getSpecialization());
        doctor.setEmail(doctorRequest.getEmail());
        if(doctorRequest.getDepartmentId()!=null){
            List<DepartmentEntity>departments=departmentRepository.findAllById( doctorRequest.getDepartmentId() );
            doctor.setDepartments(departments);
        }
        else{
            doctor.setDepartments(null);
        }
        DoctorEntity save=doctorRepository.save(doctor);

        // Update login credentials if password provided or email changed
        Optional<UserEntity> userOpt = userRepository.findByUsername(oldEmail);
        if (userOpt.isPresent()) {
            UserEntity user = userOpt.get();
            user.setUsername(save.getEmail());
            if (doctorRequest.getPassword() != null && !doctorRequest.getPassword().trim().isEmpty()) {
                user.setPassword(passwordEncoder.encode(doctorRequest.getPassword().trim()));
            }
            userRepository.save(user);
        } else if (doctorRequest.getPassword() != null && !doctorRequest.getPassword().trim().isEmpty()) {
            UserEntity user = new UserEntity();
            user.setUsername(save.getEmail());
            user.setPassword(passwordEncoder.encode(doctorRequest.getPassword().trim()));
            user.setRole(Role.DOCTOR);
            userRepository.save(user);
        }

        return new DoctorResponse(
                save.getId(),
                save.getName(),
                save.getSpecialization(),
                save.getEmail(),
                save.getDepartments() != null ? save.getDepartments().stream().map(DepartmentEntity::getId).collect(Collectors.toList()) : null,
                save.getAppointment()!=null?save.getAppointment().stream().map(AppointmentEntity::getId).collect(Collectors.toList()):null
        );
    }

    @Override
    public void deleteDoctorById(Long Id){
        doctorRepository.findById(Id).ifPresent(doc -> {
            userRepository.findByUsername(doc.getEmail()).ifPresent(userRepository::delete);
        });
        doctorRepository.deleteById(Id);
    }

    @Override
    public void deleteDoctor() {
        List<DoctorEntity> doctors = doctorRepository.findAll();
        for (DoctorEntity doc : doctors) {
            userRepository.findByUsername(doc.getEmail()).ifPresent(userRepository::delete);
        }
        doctorRepository.deleteAll();
    }
}
