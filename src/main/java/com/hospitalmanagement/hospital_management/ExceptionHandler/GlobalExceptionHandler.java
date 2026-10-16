package com.hospitalmanagement.hospital_management.ExceptionHandler;

import com.hospitalmanagement.hospital_management.DTO.ExceptionResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ExceptionResponse> handleResourceNotFoundException(ResourceNotFoundException ex, HttpServletRequest request) {
        ExceptionResponse exceptionResponse = new ExceptionResponse(
                LocalDateTime.now(),
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exceptionResponse);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ExceptionResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .filter(msg -> msg != null && !msg.isBlank())
                .collect(Collectors.joining("; "));
        if (message.isBlank()) {
            message = "Validation failed for one or more fields.";
        }
        ExceptionResponse exceptionResponse = new ExceptionResponse(
                LocalDateTime.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                message,
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(exceptionResponse);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ExceptionResponse> handleDataIntegrityViolationException(DataIntegrityViolationException ex, HttpServletRequest request) {
        String rawMsg = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        String userMsg = "Data constraint violation.";
        HttpStatus status = HttpStatus.CONFLICT;

        if (rawMsg != null) {
            if (rawMsg.toLowerCase().contains("duplicate entry")) {
                userMsg = "A record with this name or identifier already exists.";
                status = HttpStatus.CONFLICT;
            } else if (rawMsg.toLowerCase().contains("foreign key") || rawMsg.toLowerCase().contains("cannot delete or update a parent row")) {
                userMsg = "This record cannot be modified or deleted because it is linked to other records.";
                status = HttpStatus.CONFLICT;
            } else if (rawMsg.toLowerCase().contains("cannot be null")) {
                userMsg = "A required field was missing or null.";
                status = HttpStatus.BAD_REQUEST;
            }
        }

        ExceptionResponse exceptionResponse = new ExceptionResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                userMsg,
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(exceptionResponse);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ExceptionResponse> handleUsernameNotFoundException(UsernameNotFoundException ex, HttpServletRequest request) {
        ExceptionResponse exceptionResponse = new ExceptionResponse(
                LocalDateTime.now(),
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exceptionResponse);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ExceptionResponse> handleBadCredentialsException(BadCredentialsException ex, HttpServletRequest request) {
        ExceptionResponse exceptionResponse = new ExceptionResponse(
                LocalDateTime.now(),
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exceptionResponse);
    }

    @ExceptionHandler(GenericException.class)
    public ResponseEntity<ExceptionResponse> handleGenericException(GenericException ex, HttpServletRequest request) {
        ExceptionResponse exceptionResponse = new ExceptionResponse(
                LocalDateTime.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(exceptionResponse);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ExceptionResponse> handleRuntimeException(RuntimeException ex, HttpServletRequest request) {
        ExceptionResponse exceptionResponse = new ExceptionResponse(
                LocalDateTime.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(exceptionResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ExceptionResponse> handleException(Exception ex, HttpServletRequest request) {
        ExceptionResponse exceptionResponse = new ExceptionResponse(
                LocalDateTime.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(exceptionResponse);
    }
}
