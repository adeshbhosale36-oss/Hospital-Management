package com.hospitalmanagement.hospital_management.controller;

import com.hospitalmanagement.hospital_management.DTO.DepartmentRequest;
import com.hospitalmanagement.hospital_management.DTO.DepartmentResponse;
import com.hospitalmanagement.hospital_management.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class DepartmentController {
    private final DepartmentService departmentService;
    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping({"/Department", "/department"})
    public List<DepartmentResponse> getDepartment(){
        return departmentService.getDepartment();
    }

    @GetMapping({"/Department/{Id}", "/department/{Id}"})
    public DepartmentResponse getDepartmentById(@PathVariable Long Id){
        return departmentService.getDepartmentById(Id);
    }

    @PostMapping({"/Department", "/department"})
    public DepartmentResponse addDepartment(@Valid @RequestBody DepartmentRequest request){
        return departmentService.addDepartment(request);
    }

    @PutMapping({"/Department/{Id}", "/department/{Id}"})
    public DepartmentResponse updateDepartmentById(@PathVariable Long Id, @Valid @RequestBody DepartmentRequest request){
        return departmentService.updateDepartmentById(Id, request);
    }

    @DeleteMapping({"/Department/{Id}", "/department/{Id}"})
    public void deleteDepartmentById(@PathVariable long Id){
        departmentService.deleteDepartmentById(Id);
    }

    @DeleteMapping({"/Department", "/department"})
    public void deleteDepartment(){
        departmentService.deleteDepartment();
    }
}
