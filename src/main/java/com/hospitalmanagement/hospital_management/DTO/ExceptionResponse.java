package com.hospitalmanagement.hospital_management.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ExceptionResponse {
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;

    @JsonProperty("status")
    private int status;

    @JsonProperty("error")
    private String error;

    @JsonProperty("message")
    private String message;

    @JsonProperty("path")
    private String path;
}
