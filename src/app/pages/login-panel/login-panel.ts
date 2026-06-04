import {Component, inject, signal, ElementRef, ViewChild,} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Auth} from '../../service/auth';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login-panel',
  imports: [
    FormsModule
  ],
  templateUrl: './login-panel.html',
  styleUrl: './login-panel.scss',
})
export class LoginPanel
{
  @ViewChild('passwordInput')
  passwordInput!: ElementRef<HTMLInputElement>;
  password = signal('');
  errorMessage = signal<string>('');
  private authService = inject(Auth);
  private router = inject(Router);

  constructor()
  {
    this.password.set('');
  }

  async enterThePanel()
  {
    const success =
      await this.authService.login(this.password());

    if (success)
    {
      this.errorMessage.set('');
      this.password.set('');
      this.router.navigate(['/admin']);
    }
    else
    {
      this.password.set('');
      this.errorMessage.set('Senha vazia ou incorreta');
      this.passwordInput.nativeElement.focus();
    }
  }

  showPassword = signal(false);
}
