package com.tournoicenter.exception;

import org.springframework.http.HttpStatus;

public class InvalidResetTokenException extends ApiException {
    public InvalidResetTokenException() {
        super(HttpStatus.BAD_REQUEST, "Lien de réinitialisation invalide ou expiré.", "INVALID_RESET_TOKEN");
    }
}
