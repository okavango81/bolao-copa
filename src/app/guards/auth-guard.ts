import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {Auth} from '../service/auth';

export const authGuard: CanActivateFn = async () =>
{
  const auth = inject(Auth);
  const router = inject(Router);

  const authenticated =
    await auth.isAuthenticated();

  if (authenticated)
  {
    return true;
  }

  return router.createUrlTree(['/login']);
};
