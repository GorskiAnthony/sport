package com.tournoicenter.exception;

import org.springframework.http.HttpStatus;

public class EmailNotFoundException extends ApiException {
    public EmailNotFoundException() {
        super(HttpStatus.NOT_FOUND, "Aucun compte trouvé.", "EMAIL_NOT_FOUND");
    }
}
