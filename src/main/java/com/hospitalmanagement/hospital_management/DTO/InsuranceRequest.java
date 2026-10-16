package com.hospitalmanagement.hospital_management.DTO;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class InsuranceRequest {
    @NotBlank(message = "Policy number is required")
    @JsonProperty("policyNumber")
    @JsonAlias({"PolicyNumber"})
    private String policyNumber;

    @NotBlank(message = "Provider is required")
    @JsonProperty("provider")
    @JsonAlias({"Provider"})
    private String provider;

    @JsonProperty("validUntil")
    @JsonAlias({"ValidUntil"})
    private LocalDate validUntil;

    @JsonProperty("createdAt")
    @JsonAlias({"CreatedAt"})
    private LocalDateTime createdAt;
}
