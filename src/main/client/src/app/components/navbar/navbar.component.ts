import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { SettingsComponent } from '../settings/settings.component';
import { AppState } from 'src/app/app-state';
import { AuthService } from 'src/app/auth.service';
import { AppService } from 'src/app/app.service';
import { UIService } from 'src/app/ui.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatDialogModule,
    RouterModule, TranslateModule, MatMenuModule, MatProgressSpinnerModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {

  synchronizing = signal<boolean>(false);

  constructor(
    public dialog: MatDialog,
    public translator: TranslateService,
    private ui: UIService,
    public state: AppState,
    private auth: AuthService,
    private service: AppService
  ) { }

  onLanguageChanged(lang: string) {
    //localStorage.setItem('lang', lang);
    this.translator.use(lang);
  }

  ngOnInit(): void {
    this.onLanguageChanged('cs');
  }

  openSettings() {
    const dialogRef = this.dialog.open(SettingsComponent, {
      width: '800px'
    });

    dialogRef.afterClosed().subscribe(result => {

    });
  }

  synchronize(type: string) {
    this.synchronizing.set(true);
    this.service.synchronize(type).subscribe((res: any) => {
    this.synchronizing.set(false);
      if (res.error) {
        this.ui.showErrorSnackBar(res.error);
      } else {
        this.ui.showInfoSnackBar('Sync success');
      }
    })
  }

  logout() {
    this.auth.logout();
  }
}
