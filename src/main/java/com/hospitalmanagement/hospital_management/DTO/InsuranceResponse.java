package com.hospitalmanagement.hospital_management.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class InsuranceResponse {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("policyNumber")
    private String policyNumber;

    @JsonProperty("provider")
    private String provider;

    @JsonProperty("validUntil")
    private LocalDate validUntil;

    @JsonProperty("createdAt")
    private LocalDateTime createdAt;
}
