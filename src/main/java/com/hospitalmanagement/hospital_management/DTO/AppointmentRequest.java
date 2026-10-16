package com.hospitalmanagement.hospital_management.DTO;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class AppointmentRequest {
    @NotNull(message = "Appointment date is required")
    @JsonProperty("appointmentDate")
    @JsonAlias({"AppointmentDate"})
    private LocalDate appointmentDate;

    @NotNull(message = "Reason is required")
    @JsonProperty("reason")
    @JsonAlias({"Reason"})
    private String reason;

    @NotNull(message = "Patient ID is required")
    @JsonProperty("patientId")
    @JsonAlias({"PatientId"})
    private Long patientId;

    @NotNull(message = "Doctor ID is required")
    @JsonProperty("doctorId")
    @JsonAlias({"DoctorId"})
    private Long doctorId;
}
