package com.tournoicenter.exception;

import org.springframework.http.HttpStatus;

public class EmailTakenException extends ApiException {
    public EmailTakenException() {
        super(HttpStatus.CONFLICT, "Un compte existe déjà avec cet email.", "EMAIL_TAKEN");
    }
}
