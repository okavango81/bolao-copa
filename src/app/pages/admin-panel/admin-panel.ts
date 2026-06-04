import {Component, inject} from '@angular/core';
import {Auth} from '../../service/auth';
import {Router} from '@angular/router';

@Component({
  selector: 'app-admin-panel',
  imports: [],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss',
})
export class AdminPanel {

  private authService = inject(Auth);
  private router = inject(Router);

  async logout()
  {
    await this.authService.logout();

    this.router.navigate(['/login']);
  }
}
