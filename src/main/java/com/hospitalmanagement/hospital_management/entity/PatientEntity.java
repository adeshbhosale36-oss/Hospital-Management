package com.hospitalmanagement.hospital_management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Data
@Entity
public class PatientEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long Id;

    private String PatientName;
    private String Gender;
    private Integer Age;
    @Email(message = "Email is not correct")
    private String Email;
    private Long MobileNumber;
    private String Address;
    

    public PatientEntity(){
    }
    public PatientEntity(Long Id,String PatientName,String Gender,Integer Age,String Email,Long MobileNumber,String Address){
        this.Id=Id;
        this.PatientName=PatientName;
        this.Gender=Gender;
        this.Age=Age;
        this.Email=Email;
        this.MobileNumber=MobileNumber;
        this.Address=Address;
    }

    @OneToOne(cascade=CascadeType.ALL)
    @JoinColumn(name = "Insurance_Id",referencedColumnName = "Id")
    private InsuranceEntity insurance;

    @OneToMany(mappedBy = "patient",cascade = CascadeType.ALL,fetch = FetchType.LAZY)
    private List<AppointmentEntity> appointment=new ArrayList<>();

}
