package com.hospitalmanagement.hospital_management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class DoctorEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long Id;

    @Column(nullable = false,length=100)
    private String Name;

    @Column(length = 100)
    private String Specialization;

    @Column(nullable = false,unique = true,length = 100)
    private String Email;


    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "DoctorDepartment",joinColumns=@JoinColumn(name = "Doctor_Id"),inverseJoinColumns = @JoinColumn(name = "DepartmentId"))
    private List<DepartmentEntity> departments=new ArrayList<>();

    @OneToMany(mappedBy = "doctor", fetch = FetchType.LAZY,cascade = CascadeType.ALL)
    private List<AppointmentEntity> appointment= new ArrayList<>();
}
