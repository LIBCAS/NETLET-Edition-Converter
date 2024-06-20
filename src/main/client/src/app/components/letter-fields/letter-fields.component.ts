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
import { Entity, Letter, NameTag } from 'src/app/shared/letter';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslationDialogComponent } from '../translation-dialog/translation-dialog.component';
import { AnalyzeDialogComponent } from '../analyze-dialog/analyze-dialog.component';
import { AppState } from 'src/app/app-state';
import { AltoBlock, AltoLine } from 'src/app/shared/alto';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepicker, MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { Overlay } from '@angular/cdk/overlay';
import { AppConfiguration } from 'src/app/app-configuration';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Moment } from 'moment';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS } from '@angular/material-moment-adapter';
import { MultiDateFormat } from 'src/app/shared/multi-date-format';


@Component({
  selector: 'app-letter-fields',
  templateUrl: './letter-fields.component.html',
  styleUrls: ['./letter-fields.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'cs-CZ' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    // {provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS},
    { provide: MAT_DATE_FORMATS, useClass: MultiDateFormat },
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
    @Inject(MAT_DATE_FORMATS) private dateFormatConfig: MultiDateFormat,
    // @Inject(MAT_DATE_LOCALE) private _locale: string,
    private overlay: Overlay,
    private route: ActivatedRoute,
    public config: AppConfiguration,
    private service: AppService,
    public state: AppState,
    public dialog: MatDialog) { }

  ngOnInit() {
    //this._locale = 'cs';
    //this._adapter.setLocale(this._locale);
    // this.datum.valueChanges.subscribe(v => {
    //   console.log(this.datum.value)
    // })
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
      this._letter.full_text = this.state.getBlockText(this.state.selectedBlocks);

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
      data: { 
        letter: this._letter, 
        // text: this._letter.full_text, 
        prompt: prompt, 
        gptModel: this.state.fileConfig.gptModel }
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

  getTextFromSelection(selection: {page: number, selection?: DOMRect[], blocks?: AltoBlock[], text?: string}[]): string {
    let ret = '';
    selection.forEach(s => {
      ret += s.text + '\n\n';
    });
    
    return ret;
  }

  mergeBlocks(currentBlocks: AltoBlock[], newBlocks: AltoBlock[]): AltoBlock[] {
    if (!currentBlocks) {
      return newBlocks;
    }
    newBlocks.forEach(tb => {
      if (!currentBlocks.find((b: AltoBlock) => tb.ID === b.ID)) {
        currentBlocks.push(tb);
      }
    });
    return currentBlocks;
  }

  addSelection(append: boolean) {
    if (!this._letter.startPage || this._letter.startPage > this.state.currentPage) {
      this._letter.startPage = this.state.currentPage;
    }
    if (!this._letter.selection) {
      this._letter.selection = [];
    }


    const blocks: AltoBlock[] = this.state.selection ? 
      this.state.getBlocksFromSelection(this.state.selection) : this.state.alto.Layout.Page.PrintSpace.TextBlock;

    const page = this._letter.selection.find(s => s.page === this.state.currentPage);
    if (page) {
      
      if (!this.state.selection) {
        delete page.selection;
        page.blocks = blocks;
        page.text = this.state.getBlockText(blocks);
      } else if (page.selection) {
        page.selection.push(this.state.selection);
        page.blocks = this.mergeBlocks(page.blocks, blocks);
        page.text = this.state.getBlockText(page.blocks);
      } else {
        page.selection = [this.state.selection];
        page.blocks = this.mergeBlocks(page.blocks, blocks);
        page.text = this.state.getBlockText(page.blocks);
      }
      
    } else {
      if (this.state.selection) {
        this._letter.selection.push({
          page: this.state.currentPage,
          selection: [this.state.selection],
          blocks: blocks,
          text: this.state.getBlockText(blocks)
        });
      } else {
        this._letter.selection.push({
          page: this.state.currentPage,
          blocks: blocks,
          text: this.state.getBlockText(blocks)
        });
      }
      this._letter.selection.sort((s1, s2) =>  s1.page - s2.page);
    }

    this._letter.full_text = this.getTextFromSelection(this._letter.selection);
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
        this._letter.full_text += '\n\n' + this.state.getBlockText(this.state.selectedBlocks);
      } else {
        this._letter.full_text = this.state.getBlockText(this.state.selectedBlocks);
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
      selection: {page: selection.page, selection: selection.selection}
    }
    let url = this.config.context + 'api/img/selection?data=' + encodeURIComponent(JSON.stringify(data));
    return url;
  }

  gotoPage(page: number) {
    this.state.clearSelection();
    this.state.currentPage = page;

    this.service.getAlto(this.state.selectedFile.filename, (this.state.currentPage - 1) + '').subscribe((res: any) => {

      if (res.error) {
        this.state.alto = null;
      } else {
        this.state.alto = res.alto;
        this.state.addIdx();
      }
    });

  }

  removeSelection(page: number) {
    this._letter.selection = this._letter.selection.filter(s => s.page !== page);
    this._letter.full_text = this.getTextFromSelection(this._letter.selection);
  }

  setMonthAndYear(normalizedMonthAndYear: Moment, datepicker: MatDatepicker<Moment>, control: FormControl) {
      const ctrlValue = control.value ? control.value : new Date();
      ctrlValue.setMonth(normalizedMonthAndYear.month());
      ctrlValue.setFullYear(normalizedMonthAndYear.year());
      control.setValue(ctrlValue);
    // this.seriesDateTo = ctrlValue;
    //  datepicker.close();
  }

}
