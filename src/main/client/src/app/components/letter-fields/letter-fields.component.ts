import { NgIf, NgTemplateOutlet, NgFor, DatePipe } from '@angular/common';
import { Component, EventEmitter, Inject, Input, Output, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from 'src/app/app.service';
import { Entity, Letter, LetterCopy, NameTag } from 'src/app/shared/letter';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslationDialogComponent } from '../translation-dialog/translation-dialog.component';
import { AnalyzeDialogComponent } from '../analyze-dialog/analyze-dialog.component';
import { AppState } from 'src/app/app-state';
import { AltoBlock, AltoLine } from 'src/app/shared/alto';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { Overlay } from '@angular/cdk/overlay';
import { AppConfiguration } from 'src/app/app-configuration';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-letter-fields',
  templateUrl: './letter-fields.component.html',
  styleUrls: ['./letter-fields.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'cs' },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } } 
  ],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgIf, RouterModule, TranslateModule, DatePipe,
    MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatAutocompleteModule,
    MatTabsModule, MatButtonModule, MatFormFieldModule, MatListModule, MatTooltipModule,
    MatInputModule, NgTemplateOutlet, NgFor, MatIconModule, MatDialogModule, MatCheckboxModule]
})
export class LetterFieldsComponent {

  showSelection = false;
  imgUrl = '';

  _letter: Letter;
  @Input() set letter(value: Letter) {
    if (!value) {
      return;
    }
    this._letter = value;
    if (!isNaN(Date.parse(this._letter.date))) {
      this.datum.setValue(new Date(this._letter.date));
    } else {
      this.datum.setValue(null);
    }
    console.log(this.datum.value)
    if (this._letter.authors_db) {
      this._letter.author_db = this._letter.authors_db.find(a => a.id === this._letter.author_db.id);
    }
    if (this._letter.recipients_db) {
      this._letter.recipient_db = this._letter.recipients_db.find(a => a.id === this._letter.recipient_db.id);
    }
    

  }
  @Output() onSetField = new EventEmitter<{ field: string, textBox: string, append: boolean }>();
  @Output() onShouldRefresh = new EventEmitter<string>();

  @ViewChild('abstract') abstract: any;

  entities: Entity[] = [];
  nametag: string;
  nametags: NameTag[];

  locations_db: {id: string, tenant: string, name: string, type: string}[] = [];
  repositories: {id: string, tenant: string, name: string}[] = [];
  archives: {id: string, tenant: string, name: string}[] = [];
  collections: {id: string, tenant: string, name: string}[] = [];

  datum = new FormControl();

  constructor(
    private _adapter: DateAdapter<any>,
    @Inject(MAT_DATE_LOCALE) private _locale: string,
    private overlay: Overlay,
    private route: ActivatedRoute,
    public config: AppConfiguration,
    private service: AppService,
    public state: AppState,
    public dialog: MatDialog) { }

  ngOnInit() {
    this._locale = 'cs';
    this._adapter.setLocale(this._locale);
    this.datum.valueChanges.subscribe(v => {
      console.log(this.datum.value)
    })
  }

  findTags() {
    this.service.findTags(this._letter.full_text, this.state.fileConfig.tenant).subscribe((resp: any) => {
      this.entities = resp.response.docs;
      this.nametag = resp.nametag.result;
      this.nametags = resp.nametag.tags;
      // console.log(this.nametags)
      this._letter.entities = this.entities;
      this._letter.nametags = this.nametags;
    });
  }

  detectLang() {
    this.service.detectLang(this._letter.full_text).subscribe((resp: any) => {
      alert(resp.lang)
    });
  }

  translate() {

    const dialogRef = this.dialog.open(TranslationDialogComponent, {
      width: '800px',
      data: this._letter.full_text,
    });
  }

  checkAuthors() {
    this.service.checkAuthors(this._letter.author, this._letter.recipient, this.state.fileConfig.tenant).subscribe((resp: any) => {
      this._letter.authors_db = resp.author;
      this._letter.recipients_db = resp.recipient;
      if (this._letter.authors_db.length > 0){
        this._letter.author_db = this._letter.authors_db[0];
      }
      if (this._letter.recipients_db.length > 0){
        this._letter.recipient_db = this._letter.recipients_db[0];
      }
    });
  }

  wordCount(str: string) {
    if (!str) {
      return 0;
    }
    return str.split(' ')
      .filter(function (n) { return n != '' })
      .length;
  }

  brackets(str: string) {
    let re = /{([^}]+)}/;  // /\(([^)]+)\)/;

    if (!str) {
      return '';
    }
    const ma = str.match(re);
    if (!ma) {
      return '';
    }
    return ma[1];
  }

  analyze() {
    if (!this._letter.full_text) {
      if (this.state.selectedBlocks.length === 0) {
        const tBlocks: AltoBlock[] = this.state.alto.Layout.Page.PrintSpace.TextBlock;
        this.state.selectedBlocks = tBlocks.filter((tb: AltoBlock) => {
          return true;
        });
      }
      this._letter.full_text = this.state.getBlockText();

      if (!this._letter.startPage || this._letter.startPage > this.state.currentPage) {
        this._letter.startPage = this.state.currentPage;
      }

      this._letter.selection = [{
          page: this.state.currentPage
        }
      ];
    }
    // console.log(this._letter.full_text);
    // console.log(this._letter.selection);

    let prompt = this.state.fileConfig.prompt;
    const brackets: string = this.brackets(prompt);
    if (brackets) {
      let ex = brackets.replace('words', this.wordCount(this._letter.full_text) + '');
      const val = Math.max(3, Math.floor(eval(ex)));
      prompt = prompt.replaceAll('{' + brackets + '}', val + '');
    }

    const dialogRef = this.dialog.open(AnalyzeDialogComponent, {
      width: '1200px',
      // scrollStrategy: this.overlay.scrollStrategies.noop(),
      disableClose: true,
      panelClass: 'analize-dialog',
      data: { letter: this._letter, text: this._letter.full_text, prompt: prompt, gptModel: this.state.fileConfig.gptModel }
    });

    dialogRef.afterClosed().subscribe(result => {
      // console.log(result);

      if (!isNaN(Date.parse(this._letter.date))) {
        this.datum.setValue(this._letter.date);
      } else {
        this.datum.setValue(null);
      }

      this.onShouldRefresh.emit(this._letter.id);
    })
  }

  saveLetter() {
    if (!this._letter.startPage) {
      this._letter.startPage = this.state.currentPage;
    }

    if (!this._letter.endPage) {
      this._letter.endPage = this.state.currentPage;
    }
    this.service.saveLetter(this.state.selectedFile.filename, this._letter).subscribe((res: any) => {
      this.onShouldRefresh.emit(this._letter.id);
      
    });
  }

  addSelection(append: boolean) {
    if (!this._letter.startPage || this._letter.startPage > this.state.currentPage) {
      this._letter.startPage = this.state.currentPage;
    }
    if (!this._letter.selection) {
      this._letter.selection = [];
    }
    const page = this._letter.selection.find(s => s.page === this.state.currentPage);
    if (page) {
      if (!this.state.selection) {
        delete page.selection;
      } else if (page.selection) {
        page.selection.push(this.state.selection);
      } else {
        page.selection = [this.state.selection];
      }
      
    } else {
      if (this.state.selection) {
        this._letter.selection.push({
          page: this.state.currentPage,
          selection: [this.state.selection]
        });
      } else {
        this._letter.selection.push({
          page: this.state.currentPage
        });
      }
      this._letter.selection.sort((s1, s2) =>  s1.page - s2.page);
    }
  }

  setField(field: string, textBox: string, e: MouseEvent) {
    const append: boolean = e.ctrlKey;
    const blockIds: string[] = [];
    if (field === 'full_text' && textBox === 'block') {

      if (this.state.selectedBlocks.length === 0) {
        const tBlocks: AltoBlock[] = this.state.alto.Layout.Page.PrintSpace.TextBlock;
        this.state.selectedBlocks = tBlocks.filter((tb: AltoBlock) => {
          return true;
        });

      } 

      if (append) {
        this._letter.full_text += '\n\n' + this.state.getBlockText();
      } else {
        this._letter.full_text = this.state.getBlockText();
      }

      if (!this._letter.startPage || this._letter.startPage > this.state.currentPage) {
        this._letter.startPage = this.state.currentPage;
      }

      this.addSelection(append);

    } else {
      this.onSetField.emit({ field, textBox, append });
    }

  }

  switchAuthors() {

    const a = this._letter.author;
    const r = this._letter.recipient;
    this._letter.author = r;
    this._letter.recipient = a;

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

  getImgUrl(selection: any) {
    const data = {
      filename: this.state.selectedFile.filename,
      selection
    }
    let url = this.config.context + 'api/img/selection?data=' + encodeURIComponent(JSON.stringify(data));
    return url;
  }

  gotoPage(page: number) {
    this.state.currentPage = page;
  }

  removeSelection(page: number) {
    this._letter.selection = this._letter.selection.filter(s => s.page !== page)
  }
}
