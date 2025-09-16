import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { Configuration } from './shared/config';
import { isPlatformBrowser } from '@angular/common';
import { AppState } from './app-state';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
}) export class AppConfiguration {

    public config: Configuration;
    public get context() {
        return this.config.context;
    }

    public get defaultLang() {
        return this.config.defaultLang;
    }

    public get hikoUrl() {
        return this.config.hikoUrl;
    }

    public get isTest() {
        return this.config.isTest;
    }

    public get test_mappings() {
        return this.config.test_mappings;
    }

    public get copyValues() {
        return this.config.copyValues;
    }

    constructor(
        private http: HttpClient,
        public state: AppState) { }

    public configLoaded() {
        return this.config && true;
    }

    public load() {
        return this.http.get('assets/config.json').pipe(
            switchMap((cfg: any) => {
                this.config = cfg as Configuration;
                return this.http.get('api/data/init').pipe(tap((res: any) => {
                    //return this.http.get('api/data/documents').pipe(tap((res: any) => {
                    this.state.tenants = res.tenants;
                    this.state.user = res.user;
                    
                    this.state.gptModels = res.gptModels;
                }));
            }),
            catchError((err) => {
                // this.alertSubject.next(err);
                return of(err);
            })
        );
    }

}
