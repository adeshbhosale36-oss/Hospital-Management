package com.hospitalmanagement.hospital_management.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PatientResponse {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("patientName")
    private String patientName;

    @JsonProperty("gender")
    private String gender;

    @JsonProperty("age")
    private Integer age;

    @Email(message = "Email is invalid")
    @JsonProperty("email")
    private String email;

    @JsonProperty("mobileNumber")
    private Long mobileNumber;

    @JsonProperty("address")
    private String address;

    @JsonProperty("insuranceId")
    private Long insuranceId;
}
