package com.hospitalmanagement.hospital_management.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class DepartmentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long Id;

    @Column(nullable = false,unique = true,length = 100)
    private String Name;

    @ManyToMany(mappedBy = "departments",fetch = FetchType.LAZY)
    private List<DoctorEntity> doctor=new ArrayList<>();

}
