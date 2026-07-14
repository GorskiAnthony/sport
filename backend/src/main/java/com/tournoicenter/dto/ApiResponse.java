package com.tournoicenter.dto;

/**
 * Mirrors the { data: ... } envelope used by every resource route in the Node reference API.
 */
public record ApiResponse<T>(T data) {
    public static <T> ApiResponse<T> of(T data) {
        return new ApiResponse<>(data);
    }
}
