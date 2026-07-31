import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular/common';
import { toDataURL } from 'qrcode';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonContent,
  IonSpinner,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';
import { TournamentService } from '../../core/services/tournament.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';

/** L'organisateur montre ce QR code à ses arbitres — le scanner leur donne un accès direct au
 *  tournoi, sans compte (voir mobile/src/app/features/join/join.page.ts). */
@Component({
  selector: 'app-referee-code',
  templateUrl: './referee-code.page.html',
  styleUrls: ['./referee-code.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonContent, IonSpinner, EmptyStateComponent],
})
export class RefereeCodePage implements ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);
  private readonly alertController = inject(AlertController);

  private tournamentId!: number;

  readonly qrDataUrl = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly regenerating = signal(false);

  constructor() {
    addIcons({ alertCircleOutline });
  }

  ionViewWillEnter(): void {
    this.tournamentId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.tournamentService.getRefereeJoinInfo(this.tournamentId).subscribe({
      next: (info) => {
        this.renderQrCode(info.joinUrl);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  async confirmRegenerate(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Régénérer le code ?',
      message: "L'ancien QR code cessera immédiatement de fonctionner, y compris pour les arbitres déjà connectés.",
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Régénérer', role: 'confirm', handler: () => this.regenerate() },
      ],
    });
    await alert.present();
  }

  regenerate(): void {
    this.regenerating.set(true);
    this.tournamentService.regenerateRefereeJoinToken(this.tournamentId).subscribe({
      next: (info) => {
        this.renderQrCode(info.joinUrl);
        this.regenerating.set(false);
      },
      error: () => {
        this.regenerating.set(false);
      },
    });
  }

  private renderQrCode(joinUrl: string): void {
    this.qrDataUrl.set(null);
    toDataURL(joinUrl, { margin: 1, width: 240 })
      .then((dataUrl) => this.qrDataUrl.set(dataUrl))
      .catch(() => this.qrDataUrl.set(null));
  }
}
