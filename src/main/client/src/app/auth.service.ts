

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, forkJoin, Observable, of, tap } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { User } from './shared/user';
import { AppService } from './app.service';
import { AppState } from './app-state';
import { AppConfiguration } from './app-configuration';

@Injectable({ providedIn: 'root' })
export class AuthService {

    remaining = 0;
    remainingPercent = 100;
    loggedChecker: any;
    timerRemain: any;
    intervalMilis = 10000;

    constructor(
        private http: HttpClient,
        private router: Router,
        public translator: TranslateService,
        private service: AppService,
        private config: AppConfiguration,
        private state: AppState
    ) { }



    login(email: string, password: string, tenant: string, url: string = '/home') {
        this.service.login({email, password}, tenant).subscribe((res: User) => {
            this.state.user = res;
            this.state.user.tenant = tenant;
            this.router.navigate([url]);
        });
    }

    login2(email: string, password: string, tenant: string, url: string = '/home') {
        //const url2 = `${this.config.context}api/data/login?tenant=${tenant}&email=${email}&password=${password}&`;
        const url2 = `${this.config.context}api/data/login?tenant=${tenant}`;
        //this.http.get(url2).subscribe((res: any) => {
        this.http.post(url2, {email, password}).subscribe((res: any) => {
            console.log(res);
            this.state.user = res;
            this.state.user.tenant = tenant;
            this.router.navigate([url]);
        });
    }

    logout() {
        return this.service.logout(this.state.user.tenant).subscribe((result: any) => {
            this.state.user = null;
            this.router.navigate(['/login']);
        });
    }
}
