import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { Configuration } from './shared/config';
import { isPlatformBrowser } from '@angular/common';
import { AppState } from './app-state';

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
                return this.http.get('api/data/documents').pipe(tap((res: any) => {
                    this.state.tenants = Object.keys(res.tenants);
                    this.state.gptModels = res.gptModels;
                    this.state.files = res.dirs;
                    this.state.files.forEach(f => {
                        f.letters = res.totals[f.filename] ? res.totals[f.filename] : 0;
                    });
                }));
            }),
            catchError((err) => {
                // this.alertSubject.next(err);
                return of(err);
            })
        );
    }

}
