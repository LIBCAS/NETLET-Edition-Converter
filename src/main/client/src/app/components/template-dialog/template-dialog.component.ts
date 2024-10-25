import { NgIf, NgFor } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSplitModule } from 'angular-split';
import { AppState } from 'src/app/app-state';
import { AppService } from 'src/app/app.service';
import { FileTemplate, FileConfig } from 'src/app/shared/file-config';

@Component({
  selector: 'app-template-dialog',
  standalone: true,
  imports: [FormsModule, AngularSplitModule, NgIf, NgFor, RouterModule, TranslateModule, 
    MatTabsModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatTooltipModule,
    MatInputModule, MatIconModule, MatDialogModule, MatListModule, MatAutocompleteModule],
  templateUrl: './template-dialog.component.html',
  styleUrl: './template-dialog.component.scss'
})
export class TemplateDialogComponent {
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
    private service: AppService
  ) { }

  ngOnInit() {
    this.getAuthors('');
    this.selectedTemplate = this.fileConfig.templates[0];
  }


getAuthors(e: string) {
  this.service.getAuthors(e, this.state.fileConfig.tenant ? this.state.fileConfig.tenant : '').subscribe((resp: any) => {
    this.authors_db = resp.authors;
  });
}

  save() {
    this.service.saveFile(this.state.selectedFile.filename, this.fileConfig).subscribe(res => {});
  }

  addTemplate() {
    const t: FileTemplate = new FileTemplate();
    t.name = 'Šablona ' + (this.fileConfig.templates.length + 1);
    if (!this.fileConfig.templates) {
      this.fileConfig.templates = [];
    }
    this.fileConfig.templates.push(t);
    this.selectedTemplate = t;
  }

  deleteTemplate() {
    const idx = this.fileConfig.templates.findIndex(t => t.name === this.selectedTemplate.name);
    this.fileConfig.templates.splice(idx, 1);
    this.selectedTemplate = this.fileConfig.templates[0];
  }

  getLocations(e: string, type: string) {
    this.service.getLocations(e, this.state.fileConfig.tenant ? this.state.fileConfig.tenant : '', type).subscribe((resp: any) => {
      this.locations_db = resp.locations;
      switch(type) {
        case 'repository': this.repositories = this.locations_db.filter(l => l.type === 'repository'); break;
        case 'archive':this.archives = this.locations_db.filter(l => l.type === 'archive'); break;
        case 'collection':this.collections = this.locations_db.filter(l => l.type === 'collection'); break;
      }
    });
  }
}
