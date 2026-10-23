package com.potato;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PotatoApplication {

    public static void main(String[] args) {
        SpringApplication.run(PotatoApplication.class, args);
    }
}
