package com.hospitalmanagement.hospital_management.DTO;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class DepartmentRequest {
    @NotBlank(message = "Department name is required")
    @JsonProperty("name")
    @JsonAlias({"Name"})
    private String name;

    @JsonProperty("doctorId")
    @JsonAlias({"DoctorId"})
    private List<Long> doctorId;
}
