package com.hospitalmanagement.hospital_management.ExceptionHandler;

public class ResourceNotFoundException extends Throwable {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
