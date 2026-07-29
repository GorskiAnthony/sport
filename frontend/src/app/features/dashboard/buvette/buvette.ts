import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { TournamentService } from '../../../core/services/tournament.service';
import { BuvetteService } from '../../../core/services/buvette.service';
import { TournamentSummary } from '../../../core/models/tournament.model';
import { BuvetteProduct, BuvetteSale, BuvetteSummary } from '../../../core/models/buvette.model';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModal } from '../../../shared/ui/confirm-modal/confirm-modal';

interface CartLine {
  product: BuvetteProduct;
  quantity: number;
}

type Tab = 'caisse' | 'produits' | 'resume';

@Component({
  selector: 'app-dashboard-buvette-page',
  standalone: true,
  imports: [RouterLink, DatePipe, ConfirmModal],
  templateUrl: './buvette.html',
})
export class DashboardBuvettePage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tournamentService = inject(TournamentService);
  private readonly buvetteService = inject(BuvetteService);
  private readonly toast = inject(ToastService);

  readonly isPro = computed(() => this.authService.currentUser()?.plan === 'PRO');

  readonly tournaments = signal<TournamentSummary[]>([]);
  readonly selectedTournamentId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly tab = signal<Tab>('caisse');

  readonly products = signal<BuvetteProduct[]>([]);
  readonly cart = signal<CartLine[]>([]);
  readonly submittingSale = signal(false);

  readonly summary = signal<BuvetteSummary | null>(null);
  readonly sales = signal<BuvetteSale[]>([]);
  readonly loadingSummary = signal(false);

  readonly productForm = signal({ name: '', price: '' });
  readonly editingProductId = signal<number | null>(null);
  readonly productPanelOpen = signal(false);
  readonly pendingDeleteProduct = signal<BuvetteProduct | null>(null);

  readonly cartTotal = computed(() =>
    this.cart().reduce((sum, line) => sum + line.product.price * line.quantity, 0),
  );

  ngOnInit(): void {
    // Same staleness concern as edit-tournament.ts — an organizer landing here right after
    // upgrading shouldn't have to know to visit Paramètres first for the page to notice.
    this.authService.refreshUser().subscribe({ error: () => {} });

    this.tournamentService.getMine().subscribe({
      next: (tournaments) => {
        this.tournaments.set(tournaments);
        if (tournaments.length > 0) {
          this.selectedTournamentId.set(tournaments[0].id);
          this.loadProducts(tournaments[0].id);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  private loadProducts(tournamentId: number): void {
    this.loading.set(true);
    this.buvetteService.getProducts(tournamentId).subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onTournamentChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.selectedTournamentId.set(id);
    this.cart.set([]);
    this.summary.set(null);
    this.sales.set([]);
    this.loadProducts(id);
  }

  switchTab(tab: Tab): void {
    this.tab.set(tab);
    const tournamentId = this.selectedTournamentId();
    if (tab === 'resume' && tournamentId) {
      this.loadSummary(tournamentId);
    }
  }

  private loadSummary(tournamentId: number): void {
    this.loadingSummary.set(true);
    this.buvetteService.getSummary(tournamentId).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loadingSummary.set(false);
      },
      error: () => this.loadingSummary.set(false),
    });
    this.buvetteService.getSales(tournamentId).subscribe({
      next: (sales) => this.sales.set(sales),
    });
  }

  addToCart(product: BuvetteProduct): void {
    this.cart.update((lines) => {
      const existing = lines.find((l) => l.product.id === product.id);
      if (existing) {
        return lines.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...lines, { product, quantity: 1 }];
    });
  }

  removeFromCart(productId: number): void {
    this.cart.update((lines) =>
      lines
        .map((l) => (l.product.id === productId ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  clearCart(): void {
    this.cart.set([]);
  }

  checkout(): void {
    const tournamentId = this.selectedTournamentId();
    const lines = this.cart();
    if (!tournamentId || lines.length === 0) return;

    this.submittingSale.set(true);
    this.buvetteService
      .recordSale(tournamentId, {
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      })
      .subscribe({
        next: (sale) => {
          this.submittingSale.set(false);
          this.cart.set([]);
          this.toast.success(`Vente enregistrée : ${this.formatPrice(sale.total)}.`, 'Encaissé');
        },
        error: () => {
          this.submittingSale.set(false);
          this.toast.error('Une erreur est survenue.');
        },
      });
  }

  openAddProduct(): void {
    this.editingProductId.set(null);
    this.productForm.set({ name: '', price: '' });
    this.productPanelOpen.set(true);
  }

  openEditProduct(product: BuvetteProduct): void {
    this.editingProductId.set(product.id);
    this.productForm.set({ name: product.name, price: String(product.price) });
    this.productPanelOpen.set(true);
  }

  updateProductField<K extends keyof { name: string; price: string }>(field: K, value: string): void {
    this.productForm.update((f) => ({ ...f, [field]: value }));
  }

  saveProduct(): void {
    const tournamentId = this.selectedTournamentId();
    const form = this.productForm();
    const price = Number(form.price.replace(',', '.'));
    if (!form.name.trim() || !Number.isFinite(price) || price < 0) {
      this.toast.error('Nom et prix valides requis.');
      return;
    }
    if (!tournamentId) return;

    const editId = this.editingProductId();
    const payload = { name: form.name.trim(), price };
    const request$ = editId !== null
      ? this.buvetteService.updateProduct(editId, payload)
      : this.buvetteService.createProduct(tournamentId, payload);

    request$.subscribe({
      next: (product) => {
        this.products.update((list) =>
          editId !== null ? list.map((p) => (p.id === editId ? product : p)) : [...list, product],
        );
        this.toast.success(editId !== null ? 'Produit mis à jour.' : 'Produit ajouté.');
        this.productPanelOpen.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const message = (err.error as { message?: string } | null)?.message;
        this.toast.error(message ?? 'Une erreur est survenue.');
      },
    });
  }

  confirmDeleteProduct(): void {
    const target = this.pendingDeleteProduct();
    if (!target) return;
    this.buvetteService.deleteProduct(target.id).subscribe({
      next: () => {
        this.products.update((list) => list.filter((p) => p.id !== target.id));
        this.cart.update((lines) => lines.filter((l) => l.product.id !== target.id));
        this.toast.success(`${target.name} supprimé.`);
        this.pendingDeleteProduct.set(null);
      },
      error: () => {
        this.toast.error('Une erreur est survenue.');
        this.pendingDeleteProduct.set(null);
      },
    });
  }

  formatPrice(amount: number): string {
    return amount.toFixed(2).replace('.', ',') + ' €';
  }
}
