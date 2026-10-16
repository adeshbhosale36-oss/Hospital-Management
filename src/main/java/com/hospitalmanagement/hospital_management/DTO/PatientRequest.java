package com.hospitalmanagement.hospital_management.DTO;

import com.fasterxml.jackson.annotation.JsonAlias;
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
public class PatientRequest {
    @JsonProperty("patientName")
    @JsonAlias({"PatientName"})
    private String patientName;

    @JsonProperty("gender")
    @JsonAlias({"Gender"})
    private String gender;

    @JsonProperty("age")
    @JsonAlias({"Age"})
    private Integer age;

    @Email(message = "Email is invalid")
    @JsonProperty("email")
    @JsonAlias({"Email"})
    private String email;

    @JsonProperty("mobileNumber")
    @JsonAlias({"MobileNumber"})
    private Long mobileNumber;

    @JsonProperty("address")
    @JsonAlias({"Address"})
    private String address;

    @JsonProperty("insuranceId")
    @JsonAlias({"InsuranceId"})
    private Long insuranceId;

    @JsonProperty("password")
    @JsonAlias({"Password"})
    private String password;
}
