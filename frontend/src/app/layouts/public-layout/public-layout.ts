import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';
import { ToastContainer } from '../../shared/ui/toast-container/toast-container';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, ToastContainer],
  templateUrl: './public-layout.html',
})
export class PublicLayout {}
