import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { ToastContainer } from '../../shared/ui/toast-container/toast-container';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-public-layout-no-footer',
  standalone: true,
  imports: [RouterOutlet, Navbar, ToastContainer],
  templateUrl: './public-layout-no-footer.html',
})
export class PublicLayoutNoFooter {}
