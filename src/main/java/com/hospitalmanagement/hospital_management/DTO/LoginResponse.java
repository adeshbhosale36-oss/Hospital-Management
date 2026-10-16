package com.hospitalmanagement.hospital_management.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class LoginResponse {
    private long userId;
    private String token;
    private String role;
    private Long profileId;
    private String name;

    public LoginResponse(long userId, String token) {
        this.userId = userId;
        this.token = token;
    }
}
