import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppState } from './app-state';

export const authGuard: CanActivateFn = (route, state) => {
  const appstate = inject(AppState);
  const router = inject(Router);
  if (appstate.user) {
      return true;
    } else {
      const params: any = Object.assign({}, route.queryParams);
      params.url = decodeURIComponent(state.url.split('?')[0]);
      router.navigate(['/login'], {queryParams: params});
      return false;
    }
};
