import { ChangeDetectionStrategy, Component, OnChanges, inject, input, output, signal } from '@angular/core';
import { toDataURL } from 'qrcode';
import { LucideRefreshCw } from '@lucide/angular';
import { TournamentService } from '../../../core/services/tournament.service';

/** Web equivalent of mobile/src/app/features/tournaments/referee-code.page.ts — same backend
 *  endpoints, same "regenerate = kill switch" behavior. An organizer configuring a tournament
 *  from a computer shouldn't need the mobile app just to show this QR code to arbitrators. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-referee-code-modal',
  standalone: true,
  imports: [LucideRefreshCw],
  templateUrl: './referee-code-modal.html',
})
export class RefereeCodeModal implements OnChanges {
  private readonly tournamentService = inject(TournamentService);

  readonly open = input.required<boolean>();
  readonly tournamentId = input.required<number>();

  readonly closed = output<void>();

  readonly qrDataUrl = signal<string | null>(null);
  readonly joinUrl = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly regenerating = signal(false);
  readonly confirmingRegenerate = signal(false);
  readonly copied = signal(false);

  ngOnChanges(): void {
    if (!this.open()) return;
    this.confirmingRegenerate.set(false);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.tournamentService.getRefereeJoinInfo(this.tournamentId()).subscribe({
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

  regenerate(): void {
    this.regenerating.set(true);
    this.confirmingRegenerate.set(false);
    this.tournamentService.regenerateRefereeJoinToken(this.tournamentId()).subscribe({
      next: (info) => {
        this.renderQrCode(info.joinUrl);
        this.regenerating.set(false);
      },
      error: () => {
        this.regenerating.set(false);
      },
    });
  }

  copyLink(): void {
    const url = this.joinUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  close(): void {
    this.closed.emit();
  }

  private renderQrCode(joinUrl: string): void {
    this.joinUrl.set(joinUrl);
    this.qrDataUrl.set(null);
    toDataURL(joinUrl, { margin: 1, width: 220 })
      .then((dataUrl) => this.qrDataUrl.set(dataUrl))
      .catch(() => this.qrDataUrl.set(null));
  }
}
