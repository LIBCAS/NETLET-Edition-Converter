import { NgFor, NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSplitModule } from 'angular-split';
import { FileConfig } from 'src/app/shared/file-config';
import { AppService } from 'src/app/app.service';
import { AppState } from 'src/app/app-state';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AppConfiguration } from 'src/app/app-configuration';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [FormsModule, AngularSplitModule, NgIf, NgFor, RouterModule, TranslateModule,
    MatTabsModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatTooltipModule,
    MatInputModule, MatIconModule, MatDialogModule, MatListModule, MatAutocompleteModule]
})
export class SettingsComponent {

  prompt: string;
  locations_db: {id: string, tenant: string, name: string, type: string, acronyms: string[]}[] = [];
  location_str: string;
  location: {id: string, tenant: string, name: string, type: string, acronyms: string[]};
  new_acronym: string;

  constructor(
    public config: AppConfiguration,
    public state: AppState,
    private service: AppService
  ) { }

  ngOnInit() {
    this.getPrompt();
    this.getLocations();
  }


  getPrompt() {
    this.service.getPrompt().subscribe((resp: any) => {
      this.prompt = resp.prompt;

    });
  }

  save() {
    this.service.savePrompt(this.prompt).subscribe(res => { });
  }

  getLocations() {
    this.service.getAllLocations(this.state.fileConfig.tenant ? this.state.fileConfig.tenant : '').subscribe((resp: any) => {
      this.locations_db = resp.locations;
    });
  }

  addAcronym() {
    this.location.acronyms.push(this.new_acronym);
  }

  removeAcronym(idx: number) {
    this.location.acronyms.splice(idx, 1);
  }
}
