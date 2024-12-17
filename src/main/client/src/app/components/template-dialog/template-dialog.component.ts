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
import { Letter } from 'src/app/shared/letter';

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
    @Inject(MAT_DIALOG_DATA) public data: {template: FileTemplate},
    public state: AppState,
    private service: AppService
  ) { }

  ngOnInit() {
    this.getAuthors('');
    if (this.data.template) {
      this.selectedTemplate = this.data.template;
    } else {
      this.selectedTemplate = this.state.fileConfig.templates[0];
    }
    
  }


getAuthors(e: string) {
  this.service.getAuthors(e, this.state.fileConfig.tenant ? this.state.fileConfig.tenant : '').subscribe((resp: any) => {
    this.authors_db = resp.authors;
    if (!this.selectedTemplate.author_db) {
      this.selectedTemplate.author_db = JSON.parse(JSON.stringify(this.authors_db[0]));
    }

    if (!this.selectedTemplate.recipient_db) {
      this.selectedTemplate.recipient_db = JSON.parse(JSON.stringify(this.authors_db[0]));
    }

    
  });
}

  save() {
    this.service.saveFile(this.state.selectedFile.filename, this.state.fileConfig).subscribe(res => {});
  }

  addTemplate() {
    const t: FileTemplate = new FileTemplate();
    t.name = 'Šablona ' + (this.state.fileConfig.templates.length + 1);
    if (!this.state.fileConfig.templates) {
      this.state.fileConfig.templates = [];
    }
    this.state.fileConfig.templates.push(t);
    this.selectedTemplate = t;
  }

  deleteTemplate() {
    const idx = this.state.fileConfig.templates.findIndex(t => t.name === this.selectedTemplate.name);
    this.state.fileConfig.templates.splice(idx, 1);
    this.selectedTemplate = this.state.fileConfig.templates[0];
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
