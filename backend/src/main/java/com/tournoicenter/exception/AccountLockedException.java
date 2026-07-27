package com.tournoicenter.exception;

import org.springframework.http.HttpStatus;

public class AccountLockedException extends ApiException {
    public AccountLockedException() {
        super(HttpStatus.TOO_MANY_REQUESTS, "Trop de tentatives échouées. Réessayez dans quelques minutes.", "ACCOUNT_LOCKED");
    }
}
