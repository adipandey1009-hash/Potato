# Multi-stage Dockerfile for Potato Backend (Java 21 Spring Boot)
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

COPY pom.xml .
COPY src ./src

# Build JAR skipping unit tests (already tested in CI/CD pipeline)
RUN ./mvnw clean package -DskipTests || \
    (apk add --no-cache maven && mvn clean package -DskipTests)

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S potato && adduser -S potato -G potato
USER potato

COPY --from=builder /workspace/target/potato-backend-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseZGC", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
