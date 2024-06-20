import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { Observable, map, startWith } from 'rxjs';

export class Location {
  id: string; tenant: string; name: string = ''; type: string; acronyms: string[];
  toString() {
    return this.name;
  }
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [FormsModule, AngularSplitModule, NgIf, NgFor, RouterModule, TranslateModule,
    MatTabsModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatTooltipModule,
    MatInputModule, MatIconModule, MatDialogModule, MatListModule, MatAutocompleteModule,
    ReactiveFormsModule,
    AsyncPipe]
})
export class SettingsComponent {

  prompt: string;
  locations_db: Location[] = [];
  filteredLocations: Observable<Location[]>;

  location_str = new FormControl<Location>(new Location())
  location: Location;

  new_acronym: string;

  constructor(
    public config: AppConfiguration,
    public state: AppState,
    private service: AppService
  ) { }

  ngOnInit() {

    this.filteredLocations = this.location_str.valueChanges.pipe(
      startWith(''),
      map(value => {
        // const name = typeof value === 'string' ? value : value?.name;
        const name = value
        return name ? this._filterLocations(name as string) : this.locations_db.slice();
      }),
    );

    this.getLocations();
    this.getPrompt();
  }

  private _filterLocations(value: any): Location[] {
    // const filterValue = value.toLowerCase();
    const filterValue = typeof value === 'string' ? value : value?.name;
    return this.locations_db.filter(option => option.name.toLowerCase().includes(filterValue));
  }

  selectLocation(e: any) {
    this.location = e.option.value;
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
    this.service.getAllLocations(this.state.fileConfig?.tenant ? this.state.fileConfig.tenant : '').subscribe((resp: any) => {
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
