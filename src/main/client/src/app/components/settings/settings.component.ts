import { NgFor, NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSplitModule } from 'angular-split';
import { FileConfig } from 'src/app/shared/file-config';
import { AppService } from 'src/app/app.service';
import { AppState } from 'src/app/app-state';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [FormsModule, AngularSplitModule, NgIf, NgFor, RouterModule, TranslateModule, 
    MatTabsModule, MatButtonModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatIconModule, MatDialogModule, MatListModule, MatAutocompleteModule]
})
export class SettingsComponent {
  
  authors_db: {id: string, tenant: string, name: string}[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public fileConfig: FileConfig,
    public state: AppState,
    private service: AppService
  ) { }

  ngOnInit() {
    this.getAuthors('');
  }


getAuthors(e: string) {
  this.service.getAuthors(e, this.state.fileConfig.tenant ? this.state.fileConfig.tenant : '').subscribe((resp: any) => {
    this.authors_db = resp.authors;
    // this._letter.authors_db = resp.author;
    // this._letter.recipients_db = resp.recipient;
    // if (this._letter.authors_db.length > 0){
    //   this._letter.author_db = this._letter.authors_db[0];
    // }
    // if (this._letter.recipients_db.length > 0){
    //   this._letter.recipient_db = this._letter.recipients_db[0];
    // }
  });
}

  save() {
    this.service.saveFile(this.state.selectedFile.dir, this.fileConfig).subscribe(res => {});
  }
}
