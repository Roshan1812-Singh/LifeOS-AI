# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# wget (BusyBox) is used by the container HEALTHCHECK below.
RUN addgroup -S lifeos && adduser -S lifeos -G lifeos \
    && mkdir -p /app/data \
    && chown -R lifeos:lifeos /app

COPY --from=build /app/target/lifeos-backend.jar app.jar
RUN chown lifeos:lifeos app.jar

USER lifeos

# Persist locally-stored uploads (when STORAGE_PROVIDER=local).
VOLUME ["/app/data"]

# Honour container memory limits and run the production profile by default.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC" \
    SPRING_PROFILES_ACTIVE="prod"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
    CMD wget -qO- http://127.0.0.1:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
