import { NgIf, NgFor } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
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
import { AppConfiguration } from 'src/app/app-configuration';
import { AppState } from 'src/app/app-state';
import { AppService } from 'src/app/app.service';
import { FileTemplate, FileConfig } from 'src/app/shared/file-config';
import {MatChipInputEvent, MatChipsModule} from '@angular/material/chips';

@Component({
  selector: 'app-template-dialog',
  standalone: true,
  imports: [FormsModule, AngularSplitModule, NgIf, RouterModule, TranslateModule,
    MatTabsModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatTooltipModule,
    MatInputModule, MatIconModule, MatDialogModule, MatListModule, MatAutocompleteModule,
  MatChipsModule],
  templateUrl: './template-dialog.component.html',
  styleUrl: './template-dialog.component.scss'
})
export class TemplateDialogComponent {

  authors_db = signal<{ id: number, marked: string, name?: string }[]>([]);
  
  
  recipients_db = signal<{ id: number, marked: string, name?: string, salutation?: string }[]>([]);
  recipient_db: { id: number, marked: string, name?: string, salutation?: string } = {marked:'', id:-1};

  selectedTemplate: FileTemplate;
  new_template: string;

  origins_db = signal<{ id: number, marked: string, name?: string }[]>([]);
  destinations_db = signal<{ id: number, marked: string, name?: string }[]>([]);

  keyword : { id: number, name: string };
  keywords = signal<{ id: number, name: string }[]>([]);
  keywords_db = signal<{ id: number, name: string }[]>([]);

  mentioned : { id: number, name: string };
  mentionedIds = signal<{ id: number, name: string }[]>([]);
  mentioned_db = signal<{ id: number, name: string }[]>([]);

  language : string;
  languages = signal<string[]>([]);
  languages_db = signal<string[]>([]);


  locations_db: { id: string, tenant: string, name: string, type: string }[] = [];
  repositories: { id: string, tenant: string, name: string }[] = [];
  archives: { id: string, tenant: string, name: string }[] = [];
  collections: { id: string, tenant: string, name: string }[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { template: FileTemplate },
    public config: AppConfiguration,
    public state: AppState,
    private service: AppService
  ) { }

  ngOnInit() {
    // this.checkAuthors('', true);
    if (this.data.template) {
      this.selectedTemplate = this.data.template;
    } else {
      this.selectedTemplate = this.state.fileConfig.templates[0];
    }
    this.setFromTemplate();

  }

  setFromTemplate() {
    if (!this.selectedTemplate.author_db) {
      this.selectedTemplate.author_db = { id: -1, name: null };
    }
    if (!this.selectedTemplate.recipient_db) {
      this.selectedTemplate.recipient_db = { id: -1, name: null, salutation: null };
    }
    if (!this.selectedTemplate.origin_db) {
      this.selectedTemplate.origin_db = { id: -1, name: null };
    }
    if (!this.selectedTemplate.destination_db) {
      this.selectedTemplate.destination_db = { id: -1, name: null };
    }
    if (!this.selectedTemplate.keywords) {
      this.selectedTemplate.keywords = [];
    }

    this.keywords.set(this.selectedTemplate.keywords);
    this.mentionedIds.set(this.selectedTemplate.mentioned);
  }

  

  displayFn(o: any) {
    return o ? o.name : '';
  }

  checkAuthors(e:any, extended: boolean, list: any) {
    const val = e.target ? e.target.value : e;
    this.service.checkAuthors(val, this.state.user.tenant, extended).subscribe((resp: any) => {
      list.set(resp.authors);
    });
  }

  checkPlaces(e: any, extended: boolean, list: any) {
    const val = e.target ? e.target.value : e;
    this.service.checkPlaces(val, this.state.user.tenant, extended).subscribe((resp: any) => {
      list.set(resp.places);
    });
  }


  checkKeywords(e: any, extended: boolean) {
    const val = e.target ? e.target.value : e;
    this.service.getKeywords(val, this.state.user.tenant, extended).subscribe((resp: any) => {
      this.keywords_db.set(resp.keywords);
    });
  }

  removeChip(id: number, list: any) {
    list.update((c: { id: number, name: string }[]) => {
      const index = c.findIndex(k => k.id === id);
      if (index < 0) {
        return c;
      }

      c.splice(index, 1);
      return [...c];
    });
  }

  removeLang(name: string) {
    this.languages.update((c: string[]) => {
      const index = c.findIndex(k => k === name);
      if (index < 0) {
        return c;
      }

      c.splice(index, 1);
      return [...c];
    });
  }

  checkLanguages(e: any) {
    const val = e.target ? e.target.value : e;
    const keys = this.config.languages.filter(n => n.toLowerCase().indexOf(val.toLowerCase()) > -1);
    this.languages_db.set(keys);
  }


  addLanguage(e: any): void {
    if (this.language) {
      this.languages.update(ls => [...ls, this.language]);
    }

    this.language = null;
  }

  addKeyword(e: any): void {
    if (this.keyword) {
      this.keywords.update(keywords => [...keywords, {id: this.keyword.id, name: this.keyword.name}]);
    }

    this.keyword = null;
  }

  addMentioned(e: any): void {
    if (this.mentioned) {
      this.mentionedIds.update(c => [...c, {id: this.mentioned.id, name: this.mentioned.name}]);
    }

    this.mentioned = null;
  }


  setLists() {
    this.selectedTemplate.author_db.marked = this.selectedTemplate.author_marked;
    this.selectedTemplate.recipient_db.marked = this.selectedTemplate.recipient_marked;
    this.selectedTemplate.recipient_db.salutation = this.selectedTemplate.salutation;
    this.selectedTemplate.mentioned = this.mentionedIds();
    
    this.selectedTemplate.origin_db.marked = this.selectedTemplate.origin_marked;
    
    this.selectedTemplate.destination_db.marked = this.selectedTemplate.destination_marked;
    
    this.selectedTemplate.keywords = this.keywords();
    this.selectedTemplate.languages = this.languages();
  }

  save() {
    this.setLists();
    this.service.saveFile(this.state.selectedFile.filename, this.state.fileConfig).subscribe(res => { });
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
    this.service.getLocations(e, this.state.user.tenant ? this.state.user.tenant : '', type).subscribe((resp: any) => {
      this.locations_db = resp.locations;
      switch (type) {
        case 'repository': this.repositories = this.locations_db.filter(l => l.type === 'repository'); break;
        case 'archive': this.archives = this.locations_db.filter(l => l.type === 'archive'); break;
        case 'collection': this.collections = this.locations_db.filter(l => l.type === 'collection'); break;
      }
    });
  }
}
