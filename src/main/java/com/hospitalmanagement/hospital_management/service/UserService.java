package com.hospitalmanagement.hospital_management.service;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @PreAuthorize("hasRole('ADMIN')")
    public String getAdmin(){
        return "Secrete admin reported";
    }

    public String getAdminReport() {
        return "";
    }
}
