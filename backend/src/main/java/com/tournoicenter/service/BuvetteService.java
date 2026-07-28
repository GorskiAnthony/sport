package com.tournoicenter.service;

import com.tournoicenter.domain.BuvetteProduct;
import com.tournoicenter.domain.BuvetteSale;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.dto.buvette.BuvetteProductRequest;
import com.tournoicenter.dto.buvette.BuvetteProductResponse;
import com.tournoicenter.dto.buvette.BuvetteProductSalesResponse;
import com.tournoicenter.dto.buvette.BuvetteSaleItemRequest;
import com.tournoicenter.dto.buvette.BuvetteSaleItemSnapshot;
import com.tournoicenter.dto.buvette.BuvetteSaleRequest;
import com.tournoicenter.dto.buvette.BuvetteSaleResponse;
import com.tournoicenter.dto.buvette.BuvetteSummaryResponse;
import com.tournoicenter.exception.ApiException;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.BuvetteProductRepository;
import com.tournoicenter.repository.BuvetteSaleRepository;
import com.tournoicenter.repository.TournamentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class BuvetteService {

    private final BuvetteProductRepository productRepository;
    private final BuvetteSaleRepository saleRepository;
    private final TournamentRepository tournamentRepository;
    private final ObjectMapper objectMapper;

    public BuvetteService(BuvetteProductRepository productRepository, BuvetteSaleRepository saleRepository,
                           TournamentRepository tournamentRepository, ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
        this.tournamentRepository = tournamentRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<BuvetteProductResponse> listProducts(Long tournamentId, Long requesterId) {
        Tournament tournament = requireOwnedTournament(tournamentId, requesterId);
        return productRepository.findByTournamentIdOrderByNameAsc(tournament.getId()).stream()
                .map(BuvetteProductResponse::from).toList();
    }

    @Transactional
    public BuvetteProductResponse createProduct(Long tournamentId, Long requesterId, BuvetteProductRequest request) {
        Tournament tournament = requireOwnedTournament(tournamentId, requesterId);
        requireBuvettePlan(tournament);
        BuvetteProduct product = new BuvetteProduct(tournament, request.name(), request.price());
        return BuvetteProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public BuvetteProductResponse updateProduct(Long id, Long requesterId, BuvetteProductRequest request) {
        BuvetteProduct product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable."));
        requireOwner(product.getTournament(), requesterId);
        requireBuvettePlan(product.getTournament());
        product.setName(request.name());
        product.setPrice(request.price());
        return BuvetteProductResponse.from(product);
    }

    @Transactional
    public void deleteProduct(Long id, Long requesterId) {
        BuvetteProduct product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable."));
        requireOwner(product.getTournament(), requesterId);
        productRepository.delete(product);
    }

    @Transactional(readOnly = true)
    public List<BuvetteSaleResponse> listSales(Long tournamentId, Long requesterId) {
        Tournament tournament = requireOwnedTournament(tournamentId, requesterId);
        return saleRepository.findByTournamentIdOrderByCreatedAtDesc(tournament.getId()).stream()
                .map(this::toSaleResponse).toList();
    }

    /** Prices are read from the product catalog at sale time, never trusted from the client —
     *  a till app that let the browser dictate the price would let anyone ring up a free
     *  sandwich by editing the request body. */
    @Transactional
    public BuvetteSaleResponse recordSale(Long tournamentId, Long requesterId, BuvetteSaleRequest request) {
        Tournament tournament = requireOwnedTournament(tournamentId, requesterId);
        requireBuvettePlan(tournament);

        List<BuvetteSaleItemSnapshot> snapshots = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (BuvetteSaleItemRequest item : request.items()) {
            BuvetteProduct product = productRepository.findById(item.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable."));
            if (!product.getTournament().getId().equals(tournament.getId())) {
                throw new ForbiddenException();
            }
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(item.quantity())));
            snapshots.add(new BuvetteSaleItemSnapshot(product.getName(), product.getPrice(), item.quantity()));
        }

        BuvetteSale sale = new BuvetteSale(tournament, objectMapper.writeValueAsString(snapshots), total);
        return toSaleResponse(saleRepository.save(sale));
    }

    /** Lets the organizer void a mis-entered sale (fat-fingered quantity, wrong product) —
     *  not plan-gated, since correcting a mistake shouldn't require Pro any more than deleting
     *  a team does. */
    @Transactional
    public void deleteSale(Long id, Long requesterId) {
        BuvetteSale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vente introuvable."));
        requireOwner(sale.getTournament(), requesterId);
        saleRepository.delete(sale);
    }

    @Transactional(readOnly = true)
    public BuvetteSummaryResponse summary(Long tournamentId, Long requesterId) {
        Tournament tournament = requireOwnedTournament(tournamentId, requesterId);
        List<BuvetteSale> sales = saleRepository.findByTournamentIdOrderByCreatedAtDesc(tournament.getId());

        BigDecimal totalRevenue = BigDecimal.ZERO;
        Map<String, BigDecimal> revenueByProduct = new LinkedHashMap<>();
        Map<String, Integer> quantityByProduct = new LinkedHashMap<>();

        for (BuvetteSale sale : sales) {
            totalRevenue = totalRevenue.add(sale.getTotal());
            for (BuvetteSaleItemSnapshot item : parseItems(sale.getItems())) {
                BigDecimal lineTotal = item.unitPrice().multiply(BigDecimal.valueOf(item.quantity()));
                revenueByProduct.merge(item.productName(), lineTotal, BigDecimal::add);
                quantityByProduct.merge(item.productName(), item.quantity(), Integer::sum);
            }
        }

        List<BuvetteProductSalesResponse> byProduct = revenueByProduct.entrySet().stream()
                .map(entry -> new BuvetteProductSalesResponse(entry.getKey(), quantityByProduct.get(entry.getKey()), entry.getValue()))
                .sorted(Comparator.comparing(BuvetteProductSalesResponse::revenue).reversed())
                .toList();

        return new BuvetteSummaryResponse(totalRevenue, sales.size(), byProduct);
    }

    private BuvetteSaleResponse toSaleResponse(BuvetteSale sale) {
        return new BuvetteSaleResponse(sale.getId(), sale.getTournament().getId(), parseItems(sale.getItems()),
                sale.getTotal(), sale.getCreatedAt());
    }

    private List<BuvetteSaleItemSnapshot> parseItems(String json) {
        return objectMapper.readValue(json, new TypeReference<List<BuvetteSaleItemSnapshot>>() {
        });
    }

    private Tournament requireOwnedTournament(Long tournamentId, Long requesterId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournoi introuvable."));
        if (!tournament.getOrganizer().getId().equals(requesterId)) {
            throw new ForbiddenException();
        }
        return tournament;
    }

    private void requireOwner(Tournament tournament, Long requesterId) {
        if (!tournament.getOrganizer().getId().equals(requesterId)) {
            throw new ForbiddenException();
        }
    }

    private void requireBuvettePlan(Tournament tournament) {
        if (!PlanLimits.of(tournament.getOrganizer().getPlan()).buvette()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "La buvette est réservée au plan Pro.");
        }
    }
}
