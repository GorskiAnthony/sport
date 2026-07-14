package com.tournoicenter;

import org.springframework.boot.SpringApplication;

public class TestTournoiCenterApplication {

	public static void main(String[] args) {
		SpringApplication.from(TournoiCenterApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
