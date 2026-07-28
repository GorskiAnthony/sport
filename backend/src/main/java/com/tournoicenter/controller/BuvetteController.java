package com.tournoicenter.controller;

import com.tournoicenter.dto.ApiResponse;
import com.tournoicenter.dto.buvette.BuvetteProductRequest;
import com.tournoicenter.dto.buvette.BuvetteProductResponse;
import com.tournoicenter.dto.buvette.BuvetteSaleRequest;
import com.tournoicenter.dto.buvette.BuvetteSaleResponse;
import com.tournoicenter.dto.buvette.BuvetteSummaryResponse;
import com.tournoicenter.security.JwtPrincipal;
import com.tournoicenter.service.BuvetteService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class BuvetteController {

    private final BuvetteService buvetteService;

    public BuvetteController(BuvetteService buvetteService) {
        this.buvetteService = buvetteService;
    }

    @GetMapping("/api/tournaments/{tournamentId}/buvette/products")
    public ApiResponse<List<BuvetteProductResponse>> listProducts(@AuthenticationPrincipal JwtPrincipal principal,
                                                                    @PathVariable Long tournamentId) {
        return ApiResponse.of(buvetteService.listProducts(tournamentId, principal.userId()));
    }

    @PostMapping("/api/tournaments/{tournamentId}/buvette/products")
    public ApiResponse<BuvetteProductResponse> createProduct(@AuthenticationPrincipal JwtPrincipal principal,
                                                               @PathVariable Long tournamentId,
                                                               @Valid @RequestBody BuvetteProductRequest request) {
        return ApiResponse.of(buvetteService.createProduct(tournamentId, principal.userId(), request));
    }

    @PutMapping("/api/buvette/products/{id}")
    public ApiResponse<BuvetteProductResponse> updateProduct(@AuthenticationPrincipal JwtPrincipal principal,
                                                               @PathVariable Long id,
                                                               @Valid @RequestBody BuvetteProductRequest request) {
        return ApiResponse.of(buvetteService.updateProduct(id, principal.userId(), request));
    }

    @DeleteMapping("/api/buvette/products/{id}")
    public ApiResponse<Map<String, Boolean>> deleteProduct(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long id) {
        buvetteService.deleteProduct(id, principal.userId());
        return ApiResponse.of(Map.of("success", true));
    }

    @GetMapping("/api/tournaments/{tournamentId}/buvette/sales")
    public ApiResponse<List<BuvetteSaleResponse>> listSales(@AuthenticationPrincipal JwtPrincipal principal,
                                                              @PathVariable Long tournamentId) {
        return ApiResponse.of(buvetteService.listSales(tournamentId, principal.userId()));
    }

    @PostMapping("/api/tournaments/{tournamentId}/buvette/sales")
    public ApiResponse<BuvetteSaleResponse> recordSale(@AuthenticationPrincipal JwtPrincipal principal,
                                                         @PathVariable Long tournamentId,
                                                         @Valid @RequestBody BuvetteSaleRequest request) {
        return ApiResponse.of(buvetteService.recordSale(tournamentId, principal.userId(), request));
    }

    @DeleteMapping("/api/buvette/sales/{id}")
    public ApiResponse<Map<String, Boolean>> deleteSale(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long id) {
        buvetteService.deleteSale(id, principal.userId());
        return ApiResponse.of(Map.of("success", true));
    }

    @GetMapping("/api/tournaments/{tournamentId}/buvette/summary")
    public ApiResponse<BuvetteSummaryResponse> summary(@AuthenticationPrincipal JwtPrincipal principal,
                                                         @PathVariable Long tournamentId) {
        return ApiResponse.of(buvetteService.summary(tournamentId, principal.userId()));
    }
}
