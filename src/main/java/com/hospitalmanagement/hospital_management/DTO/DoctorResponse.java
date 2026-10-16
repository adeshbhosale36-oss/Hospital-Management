package com.hospitalmanagement.hospital_management.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DoctorResponse {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("specialization")
    private String specialization;

    @JsonProperty("email")
    private String email;

    @JsonProperty("departmentId")
    private List<Long> departmentId;

    @JsonProperty("appointmentId")
    private List<Long> appointmentId;
}
