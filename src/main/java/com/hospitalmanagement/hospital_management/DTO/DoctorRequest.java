package com.hospitalmanagement.hospital_management.DTO;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DoctorRequest {
    @NotBlank(message = "Doctor name is required")
    @JsonProperty("name")
    @JsonAlias({"Name"})
    private String name;

    @JsonProperty("specialization")
    @JsonAlias({"Specialization"})
    private String specialization;

    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    @JsonProperty("email")
    @JsonAlias({"Email"})
    private String email;

    @JsonProperty("departmentId")
    @JsonAlias({"DepartmentId"})
    private List<Long> departmentId;

    @JsonProperty("password")
    @JsonAlias({"Password"})
    private String password;
}
