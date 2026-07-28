import { Component, OnChanges, computed, input, output, signal } from '@angular/core';
import { toDataURL } from 'qrcode';
import { LucidePrinter, LucideMessageCircle, LucideMail, LucideShare2 } from '@lucide/angular';
import { tournamentShareSlug } from '../../utils/slug';
import { formatDateFr } from '../../utils/date';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [LucidePrinter, LucideMessageCircle, LucideMail, LucideShare2],
  templateUrl: './share-modal.html',
})
export class ShareModal implements OnChanges {
  readonly open = input.required<boolean>();
  readonly tournamentId = input.required<number>();
  readonly name = input.required<string>();
  readonly format = input<string | null>(null);
  readonly sport = input<string | null>(null);
  readonly location = input<string | null>(null);
  readonly startDate = input<string | null>(null);
  readonly endDate = input<string | null>(null);
  readonly teamsCount = input<number | null>(null);

  readonly closed = output<void>();

  readonly qrDataUrl = signal<string | null>(null);
  readonly copied = signal(false);
  readonly canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  readonly shareUrl = computed(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/t/${tournamentShareSlug(this.tournamentId(), this.name())}`;
  });

  readonly printUrl = computed(() => `/print/tournaments/${this.tournamentId()}`);

  /** Only a pool format (round-robin / group-knockout) has a meaningful "round by round"
   *  planning to print — a single-elimination bracket is already just one match per box. */
  readonly showPlanningPrint = computed(() => this.format() === 'ROUND_ROBIN' || this.format() === 'GROUP_KNOCKOUT');
  readonly planningPrintUrl = computed(() => `/print/tournaments/${this.tournamentId()}/planning`);

  readonly displayDates = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    return start && end ? `Du ${formatDateFr(start)} au ${formatDateFr(end)}` : null;
  });

  readonly shareText = computed(() => {
    const lines = [this.name()];
    const meta = [this.sport(), this.location()].filter(Boolean).join(' · ');
    if (meta) lines.push(meta);
    if (this.startDate() && this.endDate()) {
      lines.push(`Du ${formatDateFr(this.startDate()!)} au ${formatDateFr(this.endDate()!)}`);
    }
    if (this.teamsCount() !== null) lines.push(`${this.teamsCount()} équipes`);
    lines.push('', `Suivez le tournoi en direct : ${this.shareUrl()}`);
    return lines.join('\n');
  });

  ngOnChanges(): void {
    if (!this.open()) return;
    this.copied.set(false);
    this.qrDataUrl.set(null);
    toDataURL(this.shareUrl(), { margin: 1, width: 240 })
      .then((dataUrl) => this.qrDataUrl.set(dataUrl))
      .catch(() => this.qrDataUrl.set(null));
  }

  close(): void {
    this.closed.emit();
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.shareUrl()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  shareOnWhatsApp(): void {
    window.open(`https://wa.me/?text=${encodeURIComponent(this.shareText())}`, '_blank', 'noopener');
  }

  shareByEmail(): void {
    const subject = encodeURIComponent(`Suivez "${this.name()}" en direct`);
    const body = encodeURIComponent(this.shareText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  shareNative(): void {
    navigator.share?.({ title: this.name(), text: this.shareText(), url: this.shareUrl() }).catch(() => {});
  }

  print(): void {
    window.open(this.printUrl(), '_blank', 'noopener');
  }

  printPlanning(): void {
    window.open(this.planningPrintUrl(), '_blank', 'noopener');
  }
}
