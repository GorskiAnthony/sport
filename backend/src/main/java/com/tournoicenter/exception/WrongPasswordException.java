package com.tournoicenter.exception;

import org.springframework.http.HttpStatus;

public class WrongPasswordException extends ApiException {
    public WrongPasswordException() {
        super(HttpStatus.UNAUTHORIZED, "Mot de passe incorrect.", "WRONG_PASSWORD");
    }
}
