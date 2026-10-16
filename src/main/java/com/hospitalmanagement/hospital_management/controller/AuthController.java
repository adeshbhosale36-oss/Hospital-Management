package com.hospitalmanagement.hospital_management.controller;

import com.hospitalmanagement.hospital_management.DTO.LoginRequest;
import com.hospitalmanagement.hospital_management.DTO.LoginResponse;
import com.hospitalmanagement.hospital_management.DTO.SignupRequest;
import com.hospitalmanagement.hospital_management.service.AuthService;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request){
        return authService.login(request);
    }
    @PostMapping("/signup")
        public String signup(@RequestBody SignupRequest request){
            return authService.signup(request);
        }
}
