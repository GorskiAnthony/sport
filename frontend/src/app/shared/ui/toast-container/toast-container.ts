import { Component, inject } from '@angular/core';
import { ToastService, ToastType } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  templateUrl: './toast-container.html',
})
export class ToastContainer {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  private static readonly BORDER: Record<ToastType, string> = {
    success: 'border-green-500/40',
    error: 'border-red-500/40',
    warning: 'border-amber-500/40',
    info: 'border-blue-500/40',
  };

  private static readonly ICON_COLOR: Record<ToastType, string> = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400',
  };

  border(type: ToastType): string {
    return ToastContainer.BORDER[type];
  }

  iconColor(type: ToastType): string {
    return ToastContainer.ICON_COLOR[type];
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
