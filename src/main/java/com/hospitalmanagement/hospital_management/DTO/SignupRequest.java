package com.hospitalmanagement.hospital_management.DTO;

import com.hospitalmanagement.hospital_management.entity.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {
    private String username;
    private String password;
    private Role role;
}
