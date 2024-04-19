import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularSplitModule } from 'angular-split';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { TranslateService, TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { AppService } from './app/app.service';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
import { AppConfiguration } from './app/app-configuration';
import { AppState } from './app/app-state';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
  }

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, AppRoutingModule, 
        // CommonModule,
        AngularSplitModule, FormsModule, ReactiveFormsModule, TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient]
            }
        })),
        AppState, AppConfiguration, HttpClient, AppService,
        { provide: APP_INITIALIZER, useFactory: (config: AppConfiguration) => () => config.load(), deps: [AppConfiguration], multi: true },
        TranslateService,
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations()
    ]
})
  .catch(err => console.error(err));
