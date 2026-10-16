package com.hospitalmanagement.hospital_management.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class AppointmentResponse {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("appointmentDate")
    private LocalDate appointmentDate;

    @JsonProperty("reason")
    private String reason;

    @JsonProperty("patientId")
    private Long patientId;

    @JsonProperty("doctorId")
    private Long doctorId;
}
