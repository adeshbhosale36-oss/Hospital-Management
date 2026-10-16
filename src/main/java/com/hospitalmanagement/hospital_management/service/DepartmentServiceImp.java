package com.hospitalmanagement.hospital_management.service;

import com.hospitalmanagement.hospital_management.DTO.DepartmentRequest;
import com.hospitalmanagement.hospital_management.DTO.DepartmentResponse;
import com.hospitalmanagement.hospital_management.entity.DepartmentEntity;
import com.hospitalmanagement.hospital_management.entity.DoctorEntity;
import com.hospitalmanagement.hospital_management.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepartmentServiceImp implements DepartmentService{

    @Autowired
    private DepartmentRepository departmentRepository;

    @Override
    public List<DepartmentResponse> getDepartment() {
        return departmentRepository.findAll().stream().map(p-> new DepartmentResponse(
                p.getId(),
                p.getName(),
                p.getDoctor()!=null? p.getDoctor().stream().map(DoctorEntity::getId).collect(Collectors.toList()):null
        )).toList();
    }

    @Override
    public DepartmentResponse getDepartmentById(Long Id) {
        return departmentRepository.findById(Id).stream().map(p->new DepartmentResponse(
                p.getId(),
                p.getName(),
                p.getDoctor()!=null? p.getDoctor().stream().map(DoctorEntity::getId).collect(Collectors.toList()):null
        )).findFirst().orElseThrow(()->new RuntimeException("department not found"));
    }

    @Override
    public DepartmentResponse addDepartment(DepartmentRequest request) {
       DepartmentEntity department=new DepartmentEntity();
       department.setName(request.getName());
       DepartmentEntity save=departmentRepository.save(department);
       return new DepartmentResponse(
               save.getId(),
               save.getName(),
               save.getDoctor()!=null? save.getDoctor().stream().map(DoctorEntity::getId).collect(Collectors.toList()):null
       );
    }

    @Override
    public DepartmentResponse updateDepartmentById(Long Id, DepartmentRequest request) {
        DepartmentEntity department=departmentRepository.findById(Id).orElseThrow(()->new RuntimeException("Department not found"));
        department.setName(request.getName());
        DepartmentEntity save=departmentRepository.save(department);
        return new DepartmentResponse(
                save.getId(),
                save.getName(),
                save.getDoctor()!=null? save.getDoctor().stream().map(DoctorEntity::getId).collect(Collectors.toList()):null
        );
    }

    @Override
    public void deleteDepartmentById(Long Id) {
        departmentRepository.deleteById(Id);
    }

    @Override
    public void deleteDepartment() {
    departmentRepository.deleteAll();
    }
}
