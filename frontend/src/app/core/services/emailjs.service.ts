import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailjsService {
  sendPasswordResetEmail(toEmail: string, resetLink: string): Promise<unknown> {
    const { serviceId, templateId, publicKey } = environment.emailJs;

    return emailjs.send(
      serviceId,
      templateId,
      { to_email: toEmail, reset_link: resetLink },
      { publicKey },
    );
  }
}
