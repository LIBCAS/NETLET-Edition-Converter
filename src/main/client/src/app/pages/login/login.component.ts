import { NgIf, DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, ActivatedRouteSnapshot, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppState } from 'src/app/app-state';
import { AppService } from 'src/app/app.service';
import { AuthService } from 'src/app/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterModule, TranslateModule,
      MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatAutocompleteModule, MatCardModule,
      MatTabsModule, MatButtonModule, MatFormFieldModule, MatListModule, MatTooltipModule, 
      MatMenuModule, MatProgressBarModule,
      MatInputModule, MatIconModule, MatDialogModule, MatCheckboxModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email: string;
  pwd: string;
  tenant: string;
  private activatedRoute = inject(ActivatedRoute);

  constructor(public state: AppState,
    private auth: AuthService
  ) {}

  login() {
    const url = this.activatedRoute.snapshot.queryParams['url'];
    this.auth.login(this.email, this.pwd, this.tenant, url);
  }
}
