import { DatePipe } from '@angular/common';
import { Component, Inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { AppState } from 'src/app/app-state';
import { AppService } from 'src/app/app.service';
import { Entity, Letter, LetterHIKO } from 'src/app/shared/letter';
import { AppConfiguration } from 'src/app/app-configuration';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InfoUsageDialogComponent } from '../info-usage-dialog/info-usage-dialog.component';
import { now } from 'moment';

@Component({
  selector: 'app-analyze-dialog',
  templateUrl: './analyze-dialog.component.html',
  styleUrls: ['./analyze-dialog.component.scss'],
  providers: [ 
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } } 
 ],
  standalone: true,
  imports: [FormsModule, TranslateModule, 
    MatFormFieldModule, MatInputModule, MatTabsModule,
    MatCheckboxModule, DatePipe, MatListModule, CdkDrag, CdkDragHandle, MatSelectModule, MatTooltipModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule, MatProgressBarModule]
})
export class AnalyzeDialogComponent {

  @ViewChild('preklad') preklad: any;

  translation: { text: string, lang: string };
  loading = false;
  showImages = false;

  letter: {oldV: Letter, newV: Letter};
  keepFields: {[field: string]: boolean} = {};
  _letterAnalyzed: Letter;
  _letter: Letter;
  datum: Date;

  usage: any;

  entities: Entity[] = [];
  nametag: string;
  nametags: { pos: number[], text: string, type: string, selected: boolean }[];

  authors_db: { id: number, marked?: string, name?: string }[] = [];
  author_db: { id: number, marked?: string, name?: string } = {marked:'', id:-1};
  noauthor = {marked:'', id:-1};
  recipients_db: { id: number, marked?: string, name?: string }[] = [];
  recipient_db: { id: number, marked?: string, name?: string } = {marked:'', id:-1};
  norecipient = {marked:'', id:-1};
  
    
  
    origins_db: { id: number, marked?: string, name?: string }[] = [];
    origin_db: { id: number, marked?: string, name?: string } = {marked:'', id:-1};
    noorigin = {marked:'', id:-1, name: ''};
    destinations_db: { id: number, marked?: string, name?: string }[] = [];
    destination_db: { id: number, marked?: string, name?: string } = {marked:'', id:-1};
    nodestination = {marked:'', id:-1, name: ''};

  constructor(
    private dialogRef: MatDialogRef<AnalyzeDialogComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { letter: Letter, prompt: string, gptModel: string },
    public config: AppConfiguration,
    public state: AppState,
    private service: AppService
  ) { }

  ngOnInit() {
    // this.analyze();
    this._letterAnalyzed = new Letter();
    this._letterAnalyzed.hiko = new LetterHIKO();

    this._letter = new Letter();
    this.setCurrentLetterInit();
    // if (this.data.letter.analysis) {
    //   this.setAnalysis(this.data.letter.analysis);
    // }
  }

  analyze() {
    this.loading = true;
    this.findTags();
    // this.translate();
    this.annotate();
    this.detectLang();
  }


  findTags() {
    this.service.findTags(this._letter.hiko.content, this.state.user.tenant).subscribe((resp: any) => {
      this.entities = resp.response.docs;
      this.nametag = resp.nametag.result;
      this.nametags = resp.nametag.tags;
      //console.log(this.nametags)
    });
  }

  translate() {
    // this.loading = true;
    this.translation = { lang: 'processing...', text: 'processing...' };
    setTimeout(() => {
      this.preklad.nativeElement.focus();
    }, 10);

    this.service.translate(this._letter.hiko.content).subscribe((resp: any) => {
      this.translation = resp;
      // this.loading = false;
    });
  }

  translateAbstract() {
    this.loading = true;

    this.service.translateToEn(this._letter.hiko.abstract.cs).subscribe((resp: any) => {
      this._letterAnalyzed.hiko.abstract.en = resp.text;
      this._letter.hiko.abstract.en = resp.text;
      this.loading = false;
    });
  }

  detectLang() {
    this.service.detectLang(this._letter.hiko.content).subscribe((resp: any) => {
      // alert(resp.languages)
      this._letterAnalyzed.hiko.languages = resp.languages;
      this._letter.hiko.languages = this._letterAnalyzed.hiko.languages;
    });
  }

  isDate(date: string) {
    return !isNaN(Date.parse(date));
  }

  setAnalysis(analysis: any) {
    if (!this._letterAnalyzed.ai) {
      this._letterAnalyzed.ai = [];
    }
    this._letterAnalyzed.ai.unshift({analysis: analysis, date: new Date()});
    // this._letterAnalyzed.ai.summary = analysis.summary;
    // this._letterAnalyzed.ai.analysis = analysis;

    this._letterAnalyzed.letter_number = analysis.letter_number;
    this._letterAnalyzed.letter_title = analysis.letter_title;
    this._letterAnalyzed.page_number = analysis.page_number;
    this._letterAnalyzed.end_page_number = analysis.end_page_number;
    this._letterAnalyzed.author = analysis.sender;
    if (!this._letterAnalyzed.author || this._letterAnalyzed.author === 'neuvedeno') {
      if (this._letterAnalyzed.recipient) {
        if (this._letterAnalyzed.recipient.toLowerCase() === this.data.letter.author.toLowerCase()) {
          this._letterAnalyzed.author = this.data.letter.recipient;
        } else if (this._letterAnalyzed.recipient.toLowerCase() === this.data.letter.recipient.toLowerCase()) {
          this._letterAnalyzed.author = this.data.letter.author;
        }
      } else {
        this._letterAnalyzed.author = this.data.letter.author;
      }
    }

    this._letterAnalyzed.recipient = analysis.recipient;
    if (!this._letterAnalyzed.recipient || this._letterAnalyzed.recipient === 'neuvedeno') {
      if (this._letterAnalyzed.author.toLowerCase() === this.data.letter.recipient.toLowerCase()) {
        this._letterAnalyzed.recipient = this.data.letter.author;
      } else if (this._letterAnalyzed.author.toLowerCase() === this.data.letter.author.toLowerCase()) {
        this._letterAnalyzed.recipient = this.data.letter.recipient;
      } else {
        this._letterAnalyzed.recipient = this.data.letter.recipient;
      }
    }

    this._letterAnalyzed.origin = analysis.location || analysis.place;
    this._letterAnalyzed.destination = analysis.destination;



    this._letterAnalyzed.salutation = analysis.salutation;
    this._letterAnalyzed.sign_off = analysis.sign_off;
    this._letterAnalyzed.signature = analysis.signature;

    this._letterAnalyzed.hiko.abstract.cs = analysis.abstract_cs;
    this._letterAnalyzed.hiko.abstract.en = analysis.abstract_en;
    this._letterAnalyzed.hiko.date_marked = analysis.date_as_show_in_text;
    this._letterAnalyzed.date = analysis.date;
    if (this.isDate(this._letterAnalyzed.date)) {
      this.datum = new Date(analysis.date);
    }

    this._letterAnalyzed.hiko.incipit = analysis.incipit;
    this._letterAnalyzed.hiko.explicit = analysis.explicit;
    // this._letterAnalyzed.full_text = this.data.letter.full_text;

    this.setCurrentLetter();
  }

  setCurrentLetterInit() {
    const keys = Object.keys(this.data.letter);
    keys.forEach(k => {
        this._letter[k] = this.data.letter[k];
    });
    if (this.data.letter.hiko.authors) {
      this.authors_db = this.data.letter.hiko.authors;
      this.author_db = this.data.letter.hiko.authors[0];
    }
    if (this.data.letter.hiko.recipients) {
      this.recipients_db = this.data.letter.hiko.recipients;
      this.recipient_db = this.data.letter.hiko.recipients[0];
    }
    
    if (this._letter.origins) {
      this.origins_db = this._letter.origins;
      this.origin_db = this._letter.origins[0];
    }
    if (this._letter.destinations) {
      this.destinations_db = this._letter.destinations;
      this.destination_db = this._letter.destinations[0];
    }
  }

  setCurrentLetter() {
    const keys = Object.keys(this._letterAnalyzed);
    keys.forEach(k => {
      if (this.keepFields[k]) {
        this._letter[k] = this.data.letter[k];
      } else {
        this._letter[k] = this._letterAnalyzed[k];
      }
    });
  }

  annotate() {
    // this._letter.abstract_cs = 'processing...';
    this.service.annotate({text: this._letter.hiko.content, prompt: this.data.prompt, gptModel: this.data.gptModel}).subscribe((resp: any) => {
      this.loading = false;
      if (resp.error) {
        console.log(resp);
        this.service.showSnackBarError(resp.error, 'action.close');
        // this.letter.abstract_cs = orig;
      } else {
        this.setAnalysis(JSON.parse(resp.choices[0].message.content));
        this.usage = resp.usage;

        
        this.checkAuthors(this._letter.author, false, this.authors_db);
        this.checkAuthors(this._letter.recipient, false, this.recipients_db);


        this.checkPlaces(false);
      }
    });
  }

  analyzeImages() {
    // const pages = this.data.letter.selection.map(s => s.page+'');
    const d = {
      filename: this.state.selectedFile.filename,
      // selection: this.data.letter.selection,
      prompt: this.data.prompt,
      gptModel: this.data.gptModel,
      selection: this.data.letter.selection
    };

    this.loading = true;
    this.service.analyzeImages(d).subscribe((resp: any) => {
      this.loading = false;
      if (resp.error) {
        console.log(resp);
        this.service.showSnackBarError(resp.error, 'action.close');
        // this.letter.abstract_cs = orig;
      } else {
        this.setAnalysis(JSON.parse(resp.choices[0].message.content));
        this.usage = resp.usage;
        // this.checkAuthors(false);
        
        this.checkAuthors(this._letter.author, false, this.authors_db);
        this.checkAuthors(this._letter.recipient, false, this.recipients_db);
      }
    });
  }

  createIndentity(marked: string) {

  }

  checkAuthors(e:any, extended: boolean, list: { id: number, marked?: string, name?: string }[]) {
    const val = e.target ? e.target.value : e;
    this.service.checkAuthors(val, this.state.user.tenant, extended).subscribe((resp: any) => {
      list = resp.authorv;
    });
  }

  // checkAuthors(extended: boolean) {

  //   this.service.checkAuthors(this._letter.author, this._letter.recipient, this.state.user.tenant, extended).subscribe((resp: any) => {
  //     this.authors_db = resp.author;
  //     this.recipients_db = resp.recipient;
  //     if (this.authors_db.length > 0) {
  //       this.author_db = this.authors_db[0];
  //     }
  //     if (this.recipients_db.length > 0) {
  //       this.recipient_db = this.recipients_db[0];
  //     }
  //   });
  // }

  

  checkPlaces(extended: boolean) {
    // this.service.checkPlaces(this._letter.origin, this._letter.destination, this.state.user.tenant, extended).subscribe((resp: any) => {
    //   this.origins_db = resp.origin;
    //   this.destinations_db = resp.destination;
    // });
  }

  isValid() {
    return this.author_db.id !== -1 && this.recipient_db.id !== -1;
  }

  save() {
    const keys = Object.keys(this._letterAnalyzed);
    keys.forEach(k => {
      if (!this.keepFields[k]) {
        this.data.letter[k] = this._letterAnalyzed[k];
        this.data.letter.hiko.authors = [{id: this.author_db.id, marked: this._letter.author, name: this.author_db.name}];
        this.data.letter.hiko.recipients = [{id: this.recipient_db.id, marked: this._letter.recipient, name: this.recipient_db.name}];
        this.data.letter.origins = [{id: this.origin_db.id, marked: this._letter.origin, name: this.origin_db.name}];
        this.data.letter.destinations = [{id: this.destination_db.id, marked: this._letter.destination, name: this.destination_db.name}];
      }
    });

    this.service.saveLetter(this.state.selectedFile.filename, this.data.letter).subscribe((res: any) => {
      if (res.error) {
        this.service.showSnackBarError(res.error);
      } else {
        this.service.showSnackBar(res.msg);
      }
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

  toggleKeep(field: string) {
    this.keepFields[field] = !this.keepFields[field];
    if (this.keepFields[field]) {
      this._letter[field] = this.data.letter[field];
    } else {
      this._letter[field] = this._letterAnalyzed[field];
    }
  }

  showInfo() {
    const data = {
      usage: this.usage,
      model :  "gpt-3.5-turbo-0125"
    }
    const dialogRef = this.dialog.open(InfoUsageDialogComponent, {
      width: '800px',
      data
    });

    dialogRef.afterClosed().subscribe(result => {

    });
  }

}
