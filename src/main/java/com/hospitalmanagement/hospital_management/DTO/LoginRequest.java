package com.hospitalmanagement.hospital_management.DTO;

import lombok.Getter;
import lombok.Setter;
import org.jspecify.annotations.Nullable;
@Getter
@Setter
public class LoginRequest {
    private String username;
    private String password;
}
