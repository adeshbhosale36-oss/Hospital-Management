package com.hospitalmanagement.hospital_management.service;
import com.hospitalmanagement.hospital_management.DTO.InsuranceRequest;
import com.hospitalmanagement.hospital_management.DTO.InsuranceResponse;
import com.hospitalmanagement.hospital_management.entity.InsuranceEntity;
import com.hospitalmanagement.hospital_management.repository.InsuranceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InsuranceServiceImp implements InsuranceService {
    @Autowired
    private InsuranceRepository insuranceRepository;

    @Override
    public InsuranceResponse getInsuranceById(Long Id) {
        return insuranceRepository.findById(Id).stream().map(p->new InsuranceResponse(
                p.getId(),
                p.getPolicyNumber(),
                p.getProvider(),
                p.getValidUntil(),
                p.getCreatedAt()
        )).findFirst().orElseThrow(()->new RuntimeException("not found"));
    }

    @Override
    public List<InsuranceResponse> getInsurance() {
        return insuranceRepository.findAll().stream().map(p->new InsuranceResponse(
                p.getId(),
                p.getPolicyNumber(),
                p.getProvider(),
                p.getValidUntil(),
                p.getCreatedAt()
        )).toList();
    }

    @Override
    public InsuranceResponse addInsurance(InsuranceRequest insuranceRequest) {

        InsuranceEntity insurance = new InsuranceEntity();

        insurance.setPolicyNumber(insuranceRequest.getPolicyNumber());
        insurance.setProvider(insuranceRequest.getProvider());
        insurance.setValidUntil(insuranceRequest.getValidUntil());
        insurance.setCreatedAt(insuranceRequest.getCreatedAt());

        InsuranceEntity save = insuranceRepository.save(insurance);

        return new InsuranceResponse(
                save.getId(),
                save.getPolicyNumber(),
                save.getProvider(),
                save.getValidUntil(),
                save.getCreatedAt()
        );
    }

    @Override
    public InsuranceResponse updateInsuranceById(Long Id, InsuranceRequest insuranceRequest) {
        InsuranceEntity  insuranceEntity =insuranceRepository.findById(Id).orElseThrow(()->new RuntimeException("not found"));
        insuranceEntity.setPolicyNumber(insuranceRequest.getPolicyNumber());
        insuranceEntity.setProvider(insuranceRequest.getProvider());
        insuranceEntity.setValidUntil(insuranceRequest.getValidUntil());
        insuranceEntity.setCreatedAt(insuranceRequest.getCreatedAt());
        InsuranceEntity save=insuranceRepository.save(insuranceEntity);
        return new InsuranceResponse(
                save.getId(),
                save.getPolicyNumber(),
                save.getProvider(),
                save.getValidUntil(),
                save.getCreatedAt()
        );
    }

    @Override
    public void deleteInsuranceById(Long Id) {
        insuranceRepository.deleteById(Id);
    }

    @Override
    public void deleteInsurance() {
        insuranceRepository.deleteAll();
    }
}
