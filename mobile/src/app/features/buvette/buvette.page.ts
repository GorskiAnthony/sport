import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonList,
  IonItem,
  IonInput,
  IonText,
  IonSpinner,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  addOutline,
  checkmarkOutline,
  closeOutline,
  createOutline,
  trashOutline,
  cartOutline,
  listOutline,
  statsChartOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/auth/auth.service';
import { BuvetteService } from '../../core/services/buvette.service';
import { BuvetteProduct, BuvetteSale, BuvetteSummary } from '../../core/models/buvette.model';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';
import { BreadcrumbComponent, BreadcrumbSegment } from '../../shared/ui/breadcrumb/breadcrumb';

interface CartLine {
  product: BuvetteProduct;
  quantity: number;
}

type Tab = 'caisse' | 'produits' | 'resume';

/** Portage mobile de frontend/src/app/features/dashboard/buvette/buvette.ts — scopé à un seul
 *  tournoi (celui de la route), sans le sélecteur de tournoi de la version web puisqu'on arrive
 *  ici depuis tournament-detail.page.ts. Édition produit en ligne plutôt qu'en panneau séparé,
 *  et AlertController pour la confirmation de suppression, comme le reste de l'écran de détail
 *  de tournoi (pas de ConfirmModal côté mobile). */
@Component({
  selector: 'app-buvette',
  templateUrl: './buvette.page.html',
  styleUrls: ['./buvette.page.scss'],
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonIcon,
    IonList,
    IonItem,
    IonInput,
    IonText,
    IonSpinner,
    EmptyStateComponent,
    BreadcrumbComponent,
  ],
})
export class BuvettePage implements ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly buvetteService = inject(BuvetteService);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  // Lu par le fil d'Ariane du template — pas private (voir referee-code.page.ts, même convention).
  tournamentId!: number;

  readonly isPro = computed(() => this.authService.currentUser()?.plan === 'PRO');

  readonly tab = signal<Tab>('caisse');
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly products = signal<BuvetteProduct[]>([]);
  readonly cart = signal<CartLine[]>([]);
  readonly submittingSale = signal(false);

  readonly summary = signal<BuvetteSummary | null>(null);
  readonly sales = signal<BuvetteSale[]>([]);
  readonly loadingSummary = signal(false);

  readonly productForm = signal({ name: '', price: '' });
  readonly editingProductId = signal<number | null>(null);
  readonly addingProduct = signal(false);
  readonly savingProduct = signal(false);
  readonly pendingDeleteProduct = signal<BuvetteProduct | null>(null);

  readonly cartTotal = computed(() =>
    this.cart().reduce((sum, line) => sum + line.product.price * line.quantity, 0),
  );

  // Méthode plutôt que computed() : tournamentId est un champ simple (pas un signal) affecté
  // dans ionViewWillEnter, comme referee-code.page.ts.
  breadcrumbSegments(): BreadcrumbSegment[] {
    return [{ label: 'Tournoi', route: ['/tournaments', this.tournamentId] }, { label: 'Buvette' }];
  }

  constructor() {
    addIcons({
      alertCircleOutline,
      addOutline,
      checkmarkOutline,
      closeOutline,
      createOutline,
      trashOutline,
      cartOutline,
      listOutline,
      statsChartOutline,
    });
  }

  ionViewWillEnter(): void {
    this.tournamentId = Number(this.route.snapshot.paramMap.get('id'));
    this.tab.set('caisse');
    this.cart.set([]);
    if (this.isPro()) {
      this.load();
    } else {
      this.loading.set(false);
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.buvetteService.getProducts(this.tournamentId).subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  switchTab(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'resume') {
      this.loadSummary();
    }
  }

  private loadSummary(): void {
    this.loadingSummary.set(true);
    this.buvetteService.getSummary(this.tournamentId).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loadingSummary.set(false);
      },
      error: () => this.loadingSummary.set(false),
    });
    this.buvetteService.getSales(this.tournamentId).subscribe({
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
    const lines = this.cart();
    if (lines.length === 0) return;

    this.submittingSale.set(true);
    this.buvetteService
      .recordSale(this.tournamentId, {
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      })
      .subscribe({
        next: (sale) => {
          this.submittingSale.set(false);
          this.cart.set([]);
          void this.showToast(`Vente enregistrée : ${this.formatPrice(sale.total)}.`, 'success');
        },
        error: () => {
          this.submittingSale.set(false);
          void this.showToast('Une erreur est survenue.', 'danger');
        },
      });
  }

  startAddProduct(): void {
    this.editingProductId.set(null);
    this.productForm.set({ name: '', price: '' });
    this.addingProduct.set(true);
  }

  startEditProduct(product: BuvetteProduct): void {
    this.editingProductId.set(product.id);
    this.productForm.set({ name: product.name, price: String(product.price) });
    this.addingProduct.set(false);
  }

  cancelProductEdit(): void {
    this.addingProduct.set(false);
    this.editingProductId.set(null);
  }

  onProductNameInput(value: string | null | undefined): void {
    this.productForm.update((f) => ({ ...f, name: value ?? '' }));
  }

  onProductPriceInput(value: string | null | undefined): void {
    this.productForm.update((f) => ({ ...f, price: value ?? '' }));
  }

  saveProduct(): void {
    if (this.savingProduct()) return;
    const form = this.productForm();
    const price = Number(form.price.replace(',', '.'));
    if (!form.name.trim() || !Number.isFinite(price) || price < 0) {
      void this.showToast('Nom et prix valides requis.', 'danger');
      return;
    }

    this.savingProduct.set(true);
    const editId = this.editingProductId();
    const payload = { name: form.name.trim(), price };
    const request$ =
      editId !== null
        ? this.buvetteService.updateProduct(editId, payload)
        : this.buvetteService.createProduct(this.tournamentId, payload);

    request$.subscribe({
      next: (product) => {
        this.products.update((list) =>
          editId !== null ? list.map((p) => (p.id === editId ? product : p)) : [...list, product],
        );
        this.savingProduct.set(false);
        this.cancelProductEdit();
        void this.showToast(editId !== null ? 'Produit mis à jour.' : 'Produit ajouté.', 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.savingProduct.set(false);
        const message = (err.error as { message?: string } | null)?.message;
        void this.showToast(message ?? 'Une erreur est survenue.', 'danger');
      },
    });
  }

  async confirmDeleteProduct(): Promise<void> {
    const target = this.pendingDeleteProduct();
    if (!target) return;
    const alert = await this.alertController.create({
      header: 'Supprimer le produit ?',
      message: `${target.name} sera retiré du catalogue.`,
      buttons: [
        { text: 'Annuler', role: 'cancel', handler: () => this.pendingDeleteProduct.set(null) },
        { text: 'Supprimer', role: 'confirm', handler: () => this.deleteProduct(target.id) },
      ],
    });
    await alert.present();
  }

  private deleteProduct(id: number): void {
    this.buvetteService.deleteProduct(id).subscribe({
      next: () => {
        this.products.update((list) => list.filter((p) => p.id !== id));
        this.cart.update((lines) => lines.filter((l) => l.product.id !== id));
        this.pendingDeleteProduct.set(null);
      },
      error: () => {
        this.pendingDeleteProduct.set(null);
        void this.showToast('Une erreur est survenue.', 'danger');
      },
    });
  }

  formatPrice(amount: number): string {
    return amount.toFixed(2).replace('.', ',') + ' €';
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }
}
