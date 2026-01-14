import { NgIf, NgTemplateOutlet, NgFor, DatePipe } from '@angular/common';
import { Component, EventEmitter, Inject, Input, Output, Signal, signal, ViewChild } from '@angular/core';
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
import { Identity, Keyword, Letter, LetterCopy, NameTag, PlaceMeta } from 'src/app/shared/letter';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslationDialogComponent } from '../translation-dialog/translation-dialog.component';
import { AnalyzeDialogComponent } from '../analyze-dialog/analyze-dialog.component';
import { AppState } from 'src/app/app-state';
import { AltoBlock, AltoLine } from 'src/app/shared/alto';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepicker, MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { Overlay } from '@angular/cdk/overlay';
import { AppConfiguration } from 'src/app/app-configuration';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Moment } from 'moment';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS } from '@angular/material-moment-adapter';
import { MultiDateFormat } from 'src/app/shared/multi-date-format';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';


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
    MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatAutocompleteModule, MatCardModule,
    MatTabsModule, MatButtonModule, MatFormFieldModule, MatListModule, MatTooltipModule, 
    MatMenuModule, MatProgressBarModule, MatChipsModule,
    MatInputModule, NgTemplateOutlet, MatIconModule, MatDialogModule, MatCheckboxModule]
})
export class LetterFieldsComponent {

  showSelection = false;
  imgUrl = '';

  language : string;
  languages = signal<string[]>([]);
  languages_db = signal<string[]>([]);

  keyword: Keyword;
  keywords = signal<Keyword[]>([]);
  keywords_db = signal<Keyword[]>([]);

  mentioned1: Identity;
  mentioned = signal<Identity[]>([]);
  mentioned_db = signal<Identity[]>([]);

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
    
    if (this._letter.hiko.authors) {
      this.authors_db.set(this._letter.hiko.authors);
      //this.author_db = this._letter.hiko.authors[0];
    }
    if (this._letter.hiko.recipients) {
      this.recipients_db.set(this._letter.hiko.recipients);
      //this.recipient_db = this._letter.hiko.recipients[0];
    }
    
    if (this._letter.origins?.length > 0) {
      this.origins_db.set(this._letter.origins);
      this.origin_db = this._letter.origins[0];
    } else {
      this._letter.origins = [];
    }
    
    if (this._letter.destinations?.length > 0) {
      this.destinations_db.set(this._letter.destinations);
      this.destination_db = this._letter.destinations[0];
    } else {
      this._letter.destinations = [];
    }

    if (!this._letter.detected_keywords) {
      this._letter.detected_keywords = [];
    }

    if (this._letter.user_keywords) {
      this.keywords.set([...this._letter.user_keywords]);
    } else {
      this._letter.user_keywords = [];
      this.keywords.set([]);
    }

    if (!this._letter.detected_mentioned) {
      this._letter.detected_mentioned = [];
    }

    if (this._letter.user_mentioned) {
      this.mentioned.set([...this._letter.user_mentioned]);
    } else {
      this._letter.user_mentioned = [];
      this.mentioned.set([]);
    }

  }
  @Output() onSetField = new EventEmitter<{ field: string, textBox: string, append: boolean }>();
  @Output() onShouldRefresh = new EventEmitter<string>();
  
    authors_db = signal<Identity[]>([]);
    //author_db: Identity = {marked:'', id:-1};
    noauthor = {marked:'', id:-1, name: ''};
    recipients_db = signal<Identity[]>([]);
    //recipient_db: { id: number, marked?: string, name?: string, salutation?: string } = {marked:'', id:-1};
    norecipient = {marked:'', id:-1, name: ''};
    
  
    origins_db = signal<{ id: number, marked?: string, name?: string, tenant?: string }[]>([]);
    origin_db: { id: number, marked?: string, name?: string, tenant?: string } = {marked:'', id:-1, name: ''};
    noorigin = {marked:'', id:-1, name: ''};
    destinations_db = signal<{ id: number, marked?: string, name?: string }[]>([]);
    destination_db: { id: number, marked?: string, name?: string } = {marked:'', id:-1, name: ''};
    nodestination = {marked:'', id:-1, name: ''};

  // entities: Keyword[] = [];
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

    if (this._letter.hiko.languages) {
      this.languages.set(this._letter.hiko.languages.split(';'));
    }
    
  }

  findTags() {
    this.service.findTags(this._letter.hiko.content, this.state.user.tenant).subscribe((resp: any) => {
      // this.entities = resp.response.docs;
      this.nametag = resp.nametag.result;
      this.nametags = resp.nametag.tags;
      // console.log(this.nametags)
      this._letter.detected_keywords = resp.response.docs;
      this._letter.nametags = this.nametags;
    });
  }

  findKeywords() {
    this.state.loading.set(true);
    this.service.findKeywords(this._letter.hiko.content, this.state.user.tenant).subscribe((resp: any) => {
      this._letter.detected_keywords = resp.response.docs;
      this.state.loading.set(false);
    });
  }

  findIdentities() {
    this.state.loading.set(true);
    this.service.findIdentities(this._letter.hiko.content, this.state.user.tenant).subscribe((resp: any) => {
      // const nametags = resp.nametag.tags;
      // const solrTags = resp.tags.filter((tag: any) => {return tag.matchText});

      this._letter.detected_mentioned = resp.response.docs;
      this.state.loading.set(false);
    });
  }

  detectLang() {
    this.service.detectLang(this._letter.hiko.content).subscribe((resp: any) => {
      //alert(resp.lang)
      // alert(resp.languages)
      this._letter.hiko.languages = resp.languages;
    });
  }

  translate() {

    const dialogRef = this.dialog.open(TranslationDialogComponent, {
      width: '800px',
      data: this._letter.hiko.content,
    });
  }

  checkAuthorDb(s: string) {
    if (this._letter.hiko.authors?.length > 0) {
      this._letter.hiko.authors[0].marked = s;
    }
  }

  setAuthorDb(e: any, idx: number) {
    const m = this._letter.hiko.authors[idx].marked;
    // this._letter.hiko.authors[idx].name = e.option.value.name;
    // this._letter.hiko.authors[idx].id = e.option.value.id;
    this._letter.hiko.authors[idx] = e.option.value;
      this._letter.hiko.authors[idx].marked = m;
  }

  checkRecipientDb(s: string) {
    if (this._letter.hiko.recipients?.length > 0) {
      this._letter.hiko.recipients[0].marked = s;
      this._letter.hiko.recipients[0].salutation = this._letter.salutation;
    }
  }

  setRecipientDb(e: any, idx: number) {
    const m = this._letter.hiko.recipients[idx].marked;
    this._letter.hiko.recipients[idx] = e.option.value;
    this._letter.hiko.recipients[idx].marked = m;
  }

  checkOriginDb() {
    if (this._letter.origins?.length > 0) {
      this._letter.origins[0].marked = this._letter.origin;
    }
  }

  setOriginDb(e: any) {
    this._letter.origins = [this.origin_db];
    this._letter.origins[0].marked = this._letter.origin;
  }

  checkDestinationDb() {
    if (this._letter.destinations?.length > 0) {
      this._letter.destinations[0].marked = this._letter.destination;
    }
  }

  setDestinationDb(e: any) {
    this._letter.destinations = [this.destination_db];
    this._letter.destinations[0].marked = this._letter.destination;
  }

  checkAuthors(e:any, extended: boolean, list: any) {
    const val = e.target ? e.target.value : e;
    this.service.checkAuthors(val, this.state.user.tenant, extended).subscribe((resp: any) => {
      list.set(resp.authors);
    });
  }

  checkPlaces(e:any, extended: boolean, list: any) {
    const val = e.target ? e.target.value : e;
    this.service.checkPlaces(val, this.state.user.tenant, extended).subscribe((resp: any) => {
      list.set(resp.places);
    });
  }

  displayFn(a: any) {
    if (a?.name) {
      const b = a.birth_year ? '(' + a.birth_year + ' - ' + a.death_year + ')' : ''
      return `${a.name} ${ b } (${ a.tenant === 'global' ? 'global' : 'local' })`
    } else {
      return ''
    }
  }

  // 

  // checkPlacesOrigin(e: any, extended: boolean) {
  //   console.log(e)
  //   const val = e.target ? e.target.value : e;
  //   this.service.checkPlaces(val, null, this.state.user.tenant, true).subscribe((resp: any) => {
  //     this.origins_db = resp.origin;
  //     this.destinations_db = resp.destination;
  //   });
  // }

  checkPlacesDestination(e: any, extended: boolean) {
    const val = e.target ? e.target.value : e;
    this.service.checkPlaces(val, this.state.user.tenant, true).subscribe((resp: any) => {
      this.origins_db = resp.origin;
      this.destinations_db = resp.destination;
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

  getPrompt() {
    let prompt = this.state.fileConfig.prompt;
    const brackets: string = this.brackets(prompt);
    if (brackets) {
      let ex = brackets.replace('words', this.wordCount(this._letter.hiko.content) + '');
      const val = Math.max(3, Math.floor(eval(ex)));
      prompt = prompt.replaceAll('{' + brackets + '}', val + '');
    }
    return prompt;
  }

  showCurrent() {
    this.onShouldRefresh.emit(this._letter.id);
  }

  showAnalysis(a: any) {
    this._letter.letter_number = a.analysis.letter_number;
    if (this._letter.letter_number && this._letter.hiko.copies[0] && !this._letter.hiko.copies[0].l_number) {
      this._letter.hiko.copies[0].l_number = this._letter.letter_number;
    }
    this._letter.letter_title = a.analysis.letter_title;
    this._letter.page_number = a.analysis.page_number;
    this._letter.end_page_number = a.analysis.end_page_number;
    this._letter.hiko.authors[0].marked = a.analysis.sender;

    this._letter.hiko.recipients[0].marked = a.analysis.recipient;
    this._letter.salutation = a.analysis.salutation;
    this._letter.hiko.recipients[0].salutation = a.analysis.salutation;

    this._letter.origin = a.analysis.location || a.analysis.place;
    this._letter.destination = a.analysis.destination;

    // v db



    this._letter.sign_off = a.analysis.sign_off;
    this._letter.signature = a.analysis.signature;

    this._letter.hiko.abstract.cs = a.analysis.abstract_cs;
    this._letter.hiko.abstract.en = a.analysis.abstract_en;
    this._letter.hiko.date_marked = a.analysis.date_as_show_in_text;
    this._letter.date = a.analysis.date;
    if (this.isDate(this._letter.date)) {
      this.datum.setValue(new Date(a.analysis.date));
    }

    this._letter.hiko.incipit = a.analysis.incipit;
    this._letter.hiko.explicit = a.analysis.explicit;
    // this._letterAnalyzed.full_text = this.data.letter.full_text;

  }

  analyzeByModel(gptModel: string) {

    this.state.loading.set(true);
    this.findTags();
    if (gptModel === 'gpt-3.5-turbo') {
      this.annotate(gptModel);
    } else {
      this.analyzeImages(gptModel);
    }
    
    this.detectLang();
  }

  analyzeImages(gptModel: string) {
    // const pages = this.data.letter.selection.map(s => s.page+'');
    const d = {
      filename: this.state.selectedFile.filename,
      // selection: this.data.letter.selection,
      prompt: this.getPrompt(),
      gptModel: gptModel,
      selection: this._letter.selection
    };

    
    this.state.loading.set(true);
    this.service.analyzeImages(d).subscribe((resp: any) => {
      
      this.state.loading.set(false);
      if (resp.error) {
        console.log(resp);
        this.service.showSnackBarError(resp.error, 'action.close');
        // this.letter.abstract_cs = orig;
      } else {
        this.setAnalysis(resp);
        // this.checkAuthors(this._letter.author, false, this.authors_db);
        // this.checkAuthors(this._letter.recipient, false, this.recipients_db);
      }
    });
  }

  annotate(gptModel: string) {
    this.service.annotate({text: this._letter.hiko.content, prompt: this.getPrompt(), gptModel: gptModel}).subscribe((resp: any) => {
      this.state.loading.set(false);
      if (resp.error) {
        console.log(resp);
        this.service.showSnackBarError(resp.error, 'action.close');
        // this.letter.abstract_cs = orig;
      } else {
        this.setAnalysis(resp);
        this.checkAuthors(this._letter.hiko.authors[0].marked, false, this.authors_db);
        this.checkAuthors(this._letter.hiko.recipients[0].marked, false, this.recipients_db);
        //this.checkPlaces(false);
      }
    });
  }

  setAnalysis(resp: any) {
        
    const analysis = JSON.parse(resp.choices[0].message.content);
    
        console.log(analysis);
    if (!this._letter.ai) {
      this._letter.ai = [];
    }
    const a = {date: new Date(), analysis: analysis };
    this._letter.ai.unshift(a);
    this.showAnalysis(a);
  }

  analyze() {
    

    let prompt = this.state.fileConfig.prompt;
    const brackets: string = this.brackets(prompt);
    if (brackets) {
      let ex = brackets.replace('words', this.wordCount(this._letter.hiko.content) + '');
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
        // text: this._letter.content, 
        prompt: prompt, 
        gptModel: this.state.fileConfig.gptModel ? this.state.fileConfig.gptModel : this.state.gptModels[0] }
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

    this._letter.hiko.content = this.getTextFromSelection(this._letter.selection);
  }

  setField(field: string, textBox: string, e: MouseEvent) {
    const append: boolean = e.ctrlKey;
    const blockIds: string[] = [];
    if (field === 'content' && textBox === 'block') {

      if (this.state.selectedBlocks.length === 0) {
        const tBlocks: AltoBlock[] = this.state.alto.Layout.Page.PrintSpace.TextBlock;
        this.state.selectedBlocks = tBlocks.filter((tb: AltoBlock) => {
          return true;
        });
      } 

      if (append) {
        this._letter.hiko.content += '\n\n' + this.state.getBlockText(this.state.selectedBlocks);
      } else {
        this._letter.hiko.content = this.state.getBlockText(this.state.selectedBlocks);
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

    const a = this._letter.hiko.authors;
    const r = this._letter.hiko.recipients;
    this._letter.hiko.authors = r;
    this._letter.hiko.recipients = a;

  }

  getLocations(e: string, type: string) {
    this.service.getLocations(e, this.state.user.tenant ? this.state.user.tenant : '', type).subscribe((resp: any) => {
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
    this._letter.hiko.content = this.getTextFromSelection(this._letter.selection);
  }

  setMonthAndYear(normalizedMonthAndYear: Moment, datepicker: MatDatepicker<Moment>, control: FormControl) {
      const ctrlValue = control.value ? control.value : new Date();
      ctrlValue.setMonth(normalizedMonthAndYear.month());
      ctrlValue.setFullYear(normalizedMonthAndYear.year());
      control.setValue(ctrlValue);

    // this.seriesDateTo = ctrlValue;
    //  datepicker.close();
  }

  setDatum() {
    //console.log(this.datum.value.format("YYYY-MM-DD"))
    this._letter.date = this.datum.value.format("YYYY-MM-DD");
    this._letter.hiko.date = this.datum.value.format("YYYY-MM-DD");
    // console.log(this._letter.date)
  }

  addAuthor() {
    this._letter.hiko.authors.push({ id: -1, marked: '', name: '', tenant: this.state.user.tenant });
  }

  removeAuthor(idx: number) {
    this._letter.hiko.authors.splice(idx, 1);
  }

  addRecipient() {
    this._letter.hiko.recipients.push({ id: -1, marked: '', name: '', tenant: this.state.user.tenant });
  }

  removeRecipient(idx: number) {
    this._letter.hiko.recipients.splice(idx, 1);
  }

  addCopy() {
    const copyTemplate = this._letter.template.copies[0];
    const copy = new LetterCopy();
    

          copy.preservation = copyTemplate.preservation;
          copy.type = copyTemplate.type;
          copy.copy = copyTemplate.copy;
          copy.manifestation_notes = copyTemplate.manifestation_notes;
          copy.l_number = copyTemplate.l_number;
          copy.repository = copyTemplate.repository;
          copy.archive = copyTemplate.archive;
          copy.collection = copyTemplate.collection;
          copy.ms_manifestation = copyTemplate.ms_manifestation;
          copy.signature = copyTemplate.signature;
          copy.location_note = copyTemplate.location_note;

    this._letter.hiko.copies.push(copy);
  }

  removeCopy(idx: number) {
    this._letter.hiko.copies.splice(idx, 1);
  }

  isDate(date: string) {
    return !isNaN(Date.parse(date));
  }

  checkKeywords(e: any, extended: boolean) {
    const val = e.target ? e.target.value : e;
    this.service.getKeywords(val, this.state.user.tenant, extended).subscribe((resp: any) => {
      this.keywords_db.set(resp.keywords);
    });
  }

  addKeyword(e: any): void {
    if (this.keyword) {
      this.keywords.update(keywords => [...keywords, this.keyword]);
    }

    this.keyword = null;
    
    this._letter.user_keywords = [...this.keywords()]
  }

  removeKeyword(id: string) {
    this.keywords.update(c => {
      const index = c.findIndex(k => k.id === id);
      if (index < 0) {
        return c;
      }

      c.splice(index, 1);
      return [...c];
    });
    this._letter.user_keywords = [...this.keywords()]
  }

  

  checkMentioned(e: any, extended: boolean) {
    const val = e.target ? e.target.value : e;
    this.service.getIdentities(val, this.state.user.tenant, extended).subscribe((resp: any) => {
      this.mentioned_db.set(resp.identities);
    });
  }

  addMentioned(e: any): void {
    if (this.mentioned1) {
      this.mentioned.update(identities => [...identities, this.mentioned1]);
    }

    this.mentioned1 = null;
    
    this._letter.user_mentioned = [...this.mentioned()]
  }

  removeMentioned(id: number) {
    this.mentioned.update(c => {
      const index = c.findIndex(k => k.id === id);
      if (index < 0) {
        return c;
      }

      c.splice(index, 1);
      return [...c];
    });
    this._letter.user_mentioned = [...this.mentioned()]
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
    this._letter.hiko.languages = this.languages().join(';');
  }

  checkLanguages(e: any) {
    const val = e.target ? e.target.value : e;
    const keys = this.config.languages.filter(n => n.toLowerCase().indexOf(val.toLowerCase()) > -1);
    this.languages_db.set(keys);
  }


  addLanguage(e: any): void {
    if (this.language && !this.languages().includes(this.language)) {
      this.languages.update(ls => [...ls, this.language]);
    }

    this.language = null;
    this._letter.hiko.languages = this.languages().join(';');
  }

}
