package com.hospitalmanagement.hospital_management.controller;

import com.hospitalmanagement.hospital_management.repository.UserRepository;
import com.hospitalmanagement.hospital_management.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
public class UserController {
    private final UserService userService;
    @GetMapping("/report")
    public String report() {
        return userService.getAdminReport();
    }
}
