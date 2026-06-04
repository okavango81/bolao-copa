import {Routes} from '@angular/router';
import {authGuard} from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent:
      () =>
        import ('./pages/public-accsess/public-accsess').then(m => m.PublicAccsess)
  },
  {
    path: 'login',
    loadComponent:
      () =>
        import('./pages/login-panel/login-panel').then(m => m.LoginPanel)
  },
  {
    path: 'admin',
    loadComponent:
      () =>
        import('./pages/admin-panel/admin-panel').then(m => m.AdminPanel),
    canActivate: [authGuard] // ----> exigida senha aqui
  },
  {
    path: '**',
    redirectTo: ''
  }
];
