package com.tournoicenter.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final Map<String, Object> extra;

    public ApiException(HttpStatus status, String message) {
        this(status, message, null, Map.of());
    }

    public ApiException(HttpStatus status, String message, String code) {
        this(status, message, code, Map.of());
    }

    public ApiException(HttpStatus status, String message, String code, Map<String, Object> extra) {
        super(message);
        this.status = status;
        this.code = code;
        this.extra = extra;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public Map<String, Object> getExtra() {
        return extra;
    }
}
