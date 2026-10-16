# Hospital Management System

A web-based Hospital Management System built using **Java, Spring Boot, Spring Security, MySQL, HTML, CSS, and JavaScript**. The project is designed to simplify hospital operations by organizing patient, doctor, appointment, department, and insurance information in one application.

## About the Project

Managing hospital information manually can be time-consuming and difficult to maintain. This project aims to provide a centralized web application where hospital-related information can be managed more efficiently.

The application follows a backend-and-frontend approach. The Spring Boot backend handles application logic, database operations, and authentication, while the frontend provides web pages for users to interact with the system.

## Objectives

- Simplify hospital information management.
- Organize patient and doctor records.
- Manage appointments and departments.
- Maintain insurance-related information.
- Provide user registration and login functionality.
- Apply authentication and authorization to protect application resources.
- Practice real-world backend development and full-stack integration.

## Features

- **User Authentication:** User registration and login functionality.
- **Security:** Spring Security and JWT-based authentication components.
- **Patient Management:** Organize and access patient-related information.
- **Doctor Management:** Manage doctor records.
- **Appointment Management:** Handle appointment-related information.
- **Department Management:** Organize hospital departments.
- **Insurance Management:** Maintain insurance-related records.
- **Dashboard:** Provides a central interface for accessing application sections.
- **REST API Backend:** Controllers and services handle application requests and business logic.
- **Database Integration:** MySQL stores application data.
- **Web Interface:** HTML, CSS, and JavaScript provide the frontend.

## Technologies Used

| Technology | Purpose |
|---|---|
| Java | Main programming language |
| Spring Boot | Backend application development |
| Spring Web | Web endpoints and REST APIs |
| Spring Security | Application security |
| JWT | Token-based authentication |
| Spring Data JPA / Hibernate | Database access and persistence |
| MySQL | Relational database |
| HTML5 | Web page structure |
| CSS3 | Styling and layout |
| JavaScript | Frontend interaction and API communication |
| Maven | Dependency management and build automation |
| Git and GitHub | Version control and project hosting |

## Project Structure

```text
hospital_management/
├── .github/
├── .gitignore
├── .mvn/
├── pom.xml
├── mvnw
├── mvnw.cmd
├── README.md
└── src/
    ├── main/
    │   ├── java/com/hospitalmanagement/
    │   │   └── hospital_management/
    │   │       ├── DTO/
    │   │       ├── ExceptionHandler/
    │   │       ├── config/
    │   │       ├── controller/
    │   │       ├── entity/
    │   │       ├── repository/
    │   │       ├── service/
    │   │       └── HospitalManagementApplication.java
    │   └── resources/
    │       └── static/
    │           ├── css/
    │           ├── images/
    │           ├── js/
    │           ├── partials/
    │           ├── index.html
    │           ├── dashboard.html
    │           ├── patients.html
    │           ├── doctors.html
    │           ├── appointments.html
    │           ├── departments.html
    │           ├── insurance.html
    │           └── signup.html
    └── test/
```

## Architecture

The project uses a layered backend structure:

1. **Controller Layer:** Receives HTTP requests and returns responses.
2. **Service Layer:** Handles business logic and application operations.
3. **Repository Layer:** Interacts with the database.
4. **Entity Layer:** Represents database entities.
5. **DTO Layer:** Transfers request and response data.
6. **Security Configuration:** Configures authentication and access control.
7. **Frontend Layer:** Displays web pages and communicates with backend APIs using JavaScript.

## Requirements

Before running the project, install:

- Java JDK compatible with the version configured in `pom.xml`.
- MySQL Server.
- Git.
- An IDE such as IntelliJ IDEA or Visual Studio Code.

Maven can be run using the included Maven Wrapper scripts.

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/adeshbhosale36-oss/Hospital-Management.git
cd Hospital-Management
```

### 2. Create the MySQL database

Open MySQL and create a database:

```sql
CREATE DATABASE hospital_management;
```

Use the database name expected by your application configuration if it differs.

### 3. Configure application properties

Create `src/main/resources/application.properties` locally. Configure the MySQL connection and any other required settings using your own credentials.

Example configuration:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/hospital_management
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

Set `DB_USERNAME` and `DB_PASSWORD` in your local environment before starting the application. Add any additional properties required by your security and JWT implementation.

**Security note:** Do not commit real database passwords, JWT secrets, or other credentials to GitHub. The local `application.properties` file should remain excluded through `.gitignore`.

### 4. Run the application

On Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

Alternatively, if Maven is installed:

```bash
mvn spring-boot:run
```

Wait for Spring Boot to start successfully. Then open the local address configured for your application, commonly:

```text
http://localhost:8080
```

If the application uses a different port, open that port instead.

## Testing

Run the available automated tests using:

```powershell
.\mvnw.cmd test
```

Review the console output to confirm whether the tests pass.

## Learning Outcomes

This project demonstrates practical experience with:

- Java and Spring Boot backend development.
- REST API design and layered architecture.
- Database integration using MySQL.
- Authentication and application security concepts.
- Frontend and backend communication.
- Maven-based project builds.
- Organizing and maintaining a multi-layered application.

## Future Improvements

Potential improvements include:

- Role-based access control for different hospital users.
- Improved form validation and error messages.
- Pagination and search for large datasets.
- Automated testing for controllers and services.
- Deployment to a cloud platform.
- Environment-based configuration for development and production.

## Author

**Adesh Bhosale**

GitHub: [adeshbhosale36-oss](https://github.com/adeshbhosale36-oss)

---

*This project was developed for learning and demonstrating hospital-management workflows, backend development, database integration, and web application security.*