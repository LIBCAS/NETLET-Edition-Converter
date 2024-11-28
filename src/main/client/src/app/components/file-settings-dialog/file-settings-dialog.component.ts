import { NgFor, NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSplitModule } from 'angular-split';
import { FileConfig, FileTemplate } from 'src/app/shared/file-config';
import { AppService } from 'src/app/app.service';
import { AppState } from 'src/app/app-state';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TemplateDialogComponent } from '../template-dialog/template-dialog.component';

@Component({
  selector: 'app-file-settings-dialog',
  templateUrl: './file-settings-dialog.component.html',
  styleUrls: ['./file-settings-dialog.component.scss'],
  standalone: true,
  imports: [FormsModule, AngularSplitModule, NgIf, NgFor, RouterModule, TranslateModule, 
    MatTabsModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatTooltipModule,
    MatInputModule, MatIconModule, MatDialogModule, MatListModule, MatAutocompleteModule]
})
export class FileSettingsDialogComponent {
  
  authors_db: {id: string, tenant: string, name: string}[] = [];
  selectedTemplate: FileTemplate;
  new_template: string;
  

  locations_db: {id: string, tenant: string, name: string, type: string}[] = [];
  repositories: {id: string, tenant: string, name: string}[] = [];
  archives: {id: string, tenant: string, name: string}[] = [];
  collections: {id: string, tenant: string, name: string}[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public fileConfig: FileConfig,
    public state: AppState,
    private service: AppService,
    public dialog: MatDialog
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
    this.service.saveFile(this.state.selectedFile.filename, this.fileConfig).subscribe(res => {});
  }

  editTemplates() {
    const dialogRef = this.dialog.open(TemplateDialogComponent, {
      data: {} ,
      width: '800px'
    });

    dialogRef.afterClosed().subscribe(result => {

    });
  }

  addTemplate() {
    const t: FileTemplate = new FileTemplate();
    t.name = this.new_template;
    if (!this.fileConfig.templates) {
      this.fileConfig.templates = [];
    }
    this.fileConfig.templates.push(t);
  }

  getLocations(e: string, type: string) {
    this.service.getLocations(e, this.state.fileConfig.tenant ? this.state.fileConfig.tenant : '', type).subscribe((resp: any) => {
      this.locations_db = resp.locations;
      switch(type) {
        case 'repository': this.repositories = this.locations_db.filter(l => l.type === 'repository'); break;
        case 'archive':this.archives = this.locations_db.filter(l => l.type === 'archive'); break;
        case 'collection':this.collections = this.locations_db.filter(l => l.type === 'collection'); break;
      }
      
      // this.archives = this.locations_db.filter(l => l.type === 'archive');
      // this.collections = this.locations_db.filter(l => l.type === 'collection');
    });
  }
}
