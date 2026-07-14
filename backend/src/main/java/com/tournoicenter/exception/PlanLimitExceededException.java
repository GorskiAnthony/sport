package com.tournoicenter.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

public class PlanLimitExceededException extends ApiException {
    public PlanLimitExceededException(String message) {
        super(HttpStatus.FORBIDDEN, message, null, Map.of("upgrade", "/pricing"));
    }
}
