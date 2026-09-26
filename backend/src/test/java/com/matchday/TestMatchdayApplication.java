package com.matchday;

import org.springframework.boot.SpringApplication;

public class TestMatchdayApplication {

	public static void main(String[] args) {
		SpringApplication.from(MatchdayApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
