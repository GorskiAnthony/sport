package com.tournoicenter.service;

import com.tournoicenter.domain.BuvetteProduct;
import com.tournoicenter.domain.BuvetteSale;
import com.tournoicenter.domain.Plan;
import com.tournoicenter.domain.Role;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.User;
import com.tournoicenter.dto.buvette.BuvetteProductRequest;
import com.tournoicenter.dto.buvette.BuvetteProductResponse;
import com.tournoicenter.dto.buvette.BuvetteSaleItemRequest;
import com.tournoicenter.dto.buvette.BuvetteSaleRequest;
import com.tournoicenter.dto.buvette.BuvetteSummaryResponse;
import com.tournoicenter.exception.ApiException;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.repository.BuvetteProductRepository;
import com.tournoicenter.repository.BuvetteSaleRepository;
import com.tournoicenter.repository.TournamentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BuvetteServiceTest {

    @Mock
    private BuvetteProductRepository productRepository;
    @Mock
    private BuvetteSaleRepository saleRepository;
    @Mock
    private TournamentRepository tournamentRepository;

    private BuvetteService service;

    @BeforeEach
    void setUp() {
        service = new BuvetteService(productRepository, saleRepository, tournamentRepository, new ObjectMapper());
    }

    private User organizer(Long id, Plan plan) {
        User user = new User("organizer@example.com", "hash", "Organisateur", Role.ORGANIZER);
        setId(user, id);
        user.setPlan(plan);
        return user;
    }

    private static void setId(Object entity, Long id) {
        try {
            var field = entity.getClass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }

    private Tournament tournament(User organizer) {
        Tournament tournament = new Tournament("Cup", "football", "u15", "Lyon",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 3), 14, organizer);
        setId(tournament, 10L);
        return tournament;
    }

    private BuvetteProduct product(Tournament tournament, Long id, String name, String price) {
        BuvetteProduct product = new BuvetteProduct(tournament, name, new BigDecimal(price));
        setId(product, id);
        return product;
    }

    @Test
    void createProductRejectedForNonProPlan() {
        User organizer = organizer(1L, Plan.CLASSIC);
        Tournament tournament = tournament(organizer);
        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));

        assertThatThrownBy(() -> service.createProduct(10L, 1L, new BuvetteProductRequest("Sandwich", new BigDecimal("3.50"))))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Pro");
    }

    @Test
    void createProductRejectedWhenNotOwner() {
        User organizer = organizer(1L, Plan.PRO);
        Tournament tournament = tournament(organizer);
        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));

        assertThatThrownBy(() -> service.createProduct(10L, 999L, new BuvetteProductRequest("Sandwich", new BigDecimal("3.50"))))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void createProductAllowedForProPlan() {
        User organizer = organizer(1L, Plan.PRO);
        Tournament tournament = tournament(organizer);
        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));
        when(productRepository.save(any(BuvetteProduct.class))).thenAnswer(invocation -> {
            BuvetteProduct p = invocation.getArgument(0);
            setId(p, 100L);
            return p;
        });

        BuvetteProductResponse response = service.createProduct(10L, 1L, new BuvetteProductRequest("Sandwich", new BigDecimal("3.50")));

        assertThat(response.name()).isEqualTo("Sandwich");
        assertThat(response.price()).isEqualByComparingTo("3.50");
    }

    @Test
    void recordSalePricesFromCatalogNotFromClient() {
        User organizer = organizer(1L, Plan.PRO);
        Tournament tournament = tournament(organizer);
        BuvetteProduct sandwich = product(tournament, 100L, "Sandwich", "3.50");
        BuvetteProduct soda = product(tournament, 101L, "Soda", "1.50");

        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));
        when(productRepository.findById(100L)).thenReturn(Optional.of(sandwich));
        when(productRepository.findById(101L)).thenReturn(Optional.of(soda));
        when(saleRepository.save(any(BuvetteSale.class))).thenAnswer(invocation -> {
            BuvetteSale s = invocation.getArgument(0);
            setId(s, 500L);
            return s;
        });

        var response = service.recordSale(10L, 1L, new BuvetteSaleRequest(List.of(
                new BuvetteSaleItemRequest(100L, 2), // 2 x 3.50 = 7.00
                new BuvetteSaleItemRequest(101L, 3)  // 3 x 1.50 = 4.50
        )));

        assertThat(response.total()).isEqualByComparingTo("11.50");
        assertThat(response.items()).hasSize(2);
        assertThat(response.items().get(0).unitPrice()).isEqualByComparingTo("3.50");
    }

    @Test
    void recordSaleRejectsProductFromAnotherTournament() {
        User organizer = organizer(1L, Plan.PRO);
        Tournament tournament = tournament(organizer);
        Tournament otherTournament = new Tournament("Other", "football", "u15", "Paris",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 3), 14, organizer);
        setId(otherTournament, 20L);
        BuvetteProduct foreignProduct = product(otherTournament, 200L, "Sandwich", "3.50");

        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));
        when(productRepository.findById(200L)).thenReturn(Optional.of(foreignProduct));

        assertThatThrownBy(() -> service.recordSale(10L, 1L, new BuvetteSaleRequest(List.of(new BuvetteSaleItemRequest(200L, 1)))))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void summaryAggregatesAcrossSales() {
        User organizer = organizer(1L, Plan.PRO);
        Tournament tournament = tournament(organizer);
        ObjectMapper mapper = new ObjectMapper();
        String saleOneItems = mapper.writeValueAsString(List.of(
                new com.tournoicenter.dto.buvette.BuvetteSaleItemSnapshot("Sandwich", new BigDecimal("3.50"), 2)));
        String saleTwoItems = mapper.writeValueAsString(List.of(
                new com.tournoicenter.dto.buvette.BuvetteSaleItemSnapshot("Sandwich", new BigDecimal("3.50"), 1),
                new com.tournoicenter.dto.buvette.BuvetteSaleItemSnapshot("Soda", new BigDecimal("1.50"), 4)));

        BuvetteSale saleOne = new BuvetteSale(tournament, saleOneItems, new BigDecimal("7.00"));
        BuvetteSale saleTwo = new BuvetteSale(tournament, saleTwoItems, new BigDecimal("9.50"));

        when(tournamentRepository.findById(10L)).thenReturn(Optional.of(tournament));
        when(saleRepository.findByTournamentIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(saleOne, saleTwo));

        BuvetteSummaryResponse summary = service.summary(10L, 1L);

        assertThat(summary.totalRevenue()).isEqualByComparingTo("16.50");
        assertThat(summary.saleCount()).isEqualTo(2);
        assertThat(summary.byProduct()).hasSize(2);
        var sandwichLine = summary.byProduct().stream().filter(p -> p.productName().equals("Sandwich")).findFirst().orElseThrow();
        assertThat(sandwichLine.quantitySold()).isEqualTo(3);
        assertThat(sandwichLine.revenue()).isEqualByComparingTo("10.50");
    }
}
