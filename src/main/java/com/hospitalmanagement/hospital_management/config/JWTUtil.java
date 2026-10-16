package com.hospitalmanagement.hospital_management.config;
import io.jsonwebtoken.Claims;
import org.springframework.security.core.userdetails.UserDetails;
import com.hospitalmanagement.hospital_management.entity.UserEntity;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@Getter
@Setter
public class JWTUtil {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms:600000}")
    private long expirationMs;

    private SecretKey secretKey;

    @PostConstruct
    public void init(){
        secretKey=Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );
    }

    public String generateToken(UserEntity user){
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId",user.getId())
                .claim("role", user.getRole() != null ? user.getRole().name() : "")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+expirationMs))
                .signWith(secretKey)
                .compact();
    }

    //it take token as input and extract from usenames by .getsubject()
    public String extractUsername(String token){
        Claims claims=getAllClaims(token);
        return claims.getSubject();
    }
    public boolean isTokenValid(String token,UserDetails userDetails){
        String username=extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }
    private boolean isTokenExpired(String token){
        Date expirationDate=extractExpiration(token);
        return expirationDate.before(new Date());
    }
    private Date extractExpiration(String token){
        Claims claims=getAllClaims(token);
        return claims.getExpiration();
    }
    private Claims getAllClaims(String token){
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
