import { DatePipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
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
import { Entity, Letter } from 'src/app/shared/letter';
import { AppConfiguration } from 'src/app/app-configuration';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InfoUsageDialogComponent } from '../info-usage-dialog/info-usage-dialog.component';

@Component({
  selector: 'app-analyze-dialog',
  templateUrl: './analyze-dialog.component.html',
  styleUrls: ['./analyze-dialog.component.scss'],
  providers: [ 
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } } 
 ],
  standalone: true,
  imports: [FormsModule, TranslateModule, NgIf, NgFor, 
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
    this.service.findTags(this._letter.full_text, this.state.fileConfig.tenant).subscribe((resp: any) => {
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

    this.service.translate(this._letter.full_text).subscribe((resp: any) => {
      this.translation = resp;
      // this.loading = false;
    });
  }

  translateAbstract() {
    this.loading = true;

    this.service.translateToEn(this._letter.abstract_cs).subscribe((resp: any) => {
      this._letterAnalyzed.abstract_en = resp.text;
      this._letter.abstract_en = resp.text;
      this.loading = false;
    });
  }

  detectLang() {
    this.service.detectLang(this._letter.full_text).subscribe((resp: any) => {
      // alert(resp.languages)
      this._letterAnalyzed.languages = resp.languages;
      this._letter.languages = this._letterAnalyzed.languages;
    });
  }

  isDate(date: string) {
    return !isNaN(Date.parse(date));
  }

  setAnalysis(analysis: any) {
    this._letterAnalyzed.analysis = analysis;
    this._letterAnalyzed.letter_number = analysis.letter_number;
    this._letterAnalyzed.letter_title = analysis.letter_title;
    this._letterAnalyzed.page_number = analysis.page_number;
    this._letterAnalyzed.end_page_number = analysis.end_page_number;
    this._letterAnalyzed.author = analysis.sender;
    this._letterAnalyzed.recipient = analysis.recipient;
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
    if (!this._letterAnalyzed.recipient || this._letterAnalyzed.recipient === 'neuvedeno') {
      if (this._letterAnalyzed.author.toLowerCase() === this.data.letter.recipient.toLowerCase()) {
        this._letterAnalyzed.recipient = this.data.letter.author;
      } else if (this._letterAnalyzed.author.toLowerCase() === this.data.letter.author.toLowerCase()) {
        this._letterAnalyzed.recipient = this.data.letter.recipient;
      } else {
        this._letterAnalyzed.recipient = this.data.letter.recipient;
      }
    }

    this._letterAnalyzed.salutation = analysis.salutation;
    this._letterAnalyzed.sign_off = analysis.sign_off;
    this._letterAnalyzed.signature = analysis.signature;

    this._letterAnalyzed.abstract_cs = analysis.abstract_cs;
    this._letterAnalyzed.abstract_en = analysis.abstract_en;
    this._letterAnalyzed.summary = analysis.summary;

    this._letterAnalyzed.origin = analysis.location || analysis.place;
    this._letterAnalyzed.date_marked = analysis.date_as_show_in_text;
    this._letterAnalyzed.date = analysis.date;
    if (this.isDate(this._letterAnalyzed.date)) {
      this.datum = new Date(analysis.date);
    }

    this._letterAnalyzed.incipit = analysis.incipit;
    this._letterAnalyzed.explicit = analysis.explicit;
    // this._letterAnalyzed.full_text = this.data.letter.full_text;

    this.setCurrentLetter();
  }

  setCurrentLetterInit() {
    const keys = Object.keys(this.data.letter);
    keys.forEach(k => {
        this._letter[k] = this.data.letter[k];
    });
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
    const orig = this._letterAnalyzed.abstract_cs;
    // this._letter.abstract_cs = 'processing...';
    this.service.annotate({text: this._letter.full_text, prompt: this.data.prompt, gptModel: this.data.gptModel}).subscribe((resp: any) => {
      this.loading = false;
      if (resp.error) {
        console.log(resp);
        this.service.showSnackBarError(resp.error, 'action.close');
        // this.letter.abstract_cs = orig;
      } else {
        this.setAnalysis(JSON.parse(resp.choices[0].message.content));
        this.usage = resp.usage;
        this.checkAuthors();
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
        this.checkAuthors();
      }
    });
  }

  checkAuthors() {
    this.service.checkAuthors(this._letterAnalyzed.author, this._letterAnalyzed.recipient, this.state.fileConfig.tenant).subscribe((resp: any) => {
      this._letterAnalyzed.authors_db = resp.author;
      this._letterAnalyzed.recipients_db = resp.recipient;
      if (this._letterAnalyzed.authors_db.length > 0) {
        this._letterAnalyzed.author_db = this._letterAnalyzed.authors_db[0];
      }
      if (this._letterAnalyzed.recipients_db.length > 0) {
        this._letterAnalyzed.recipient_db = this._letterAnalyzed.recipients_db[0];
      }
    });
  }

  save() {
    const keys = Object.keys(this._letterAnalyzed);
    keys.forEach(k => {
      if (!this.keepFields[k]) {
        this.data.letter[k] = this._letterAnalyzed[k];
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

  saveAll() {
    if (!this.data.letter.startPage) {
      this.data.letter.startPage = this.state.currentPage;
    }
    if (!this.data.letter.endPage) {
      this.data.letter.endPage = this.state.currentPage;
    }

    this.data.letter.languages = this._letterAnalyzed.languages;

    this.data.letter.letter_number = this._letterAnalyzed.letter_number;
    this.data.letter.letter_title = this._letterAnalyzed.letter_title;
    this.data.letter.page_number = this._letterAnalyzed.page_number;
    this.data.letter.end_page_number = this._letterAnalyzed.end_page_number;
    this.data.letter.salutation = this._letterAnalyzed.salutation;
    this.data.letter.sign_off = this._letterAnalyzed.sign_off;
    this.data.letter.signature = this._letterAnalyzed.signature;


    this.data.letter.author = this._letterAnalyzed.author;
    this.data.letter.recipient = this._letterAnalyzed.recipient;
    this.data.letter.abstract_cs = this._letterAnalyzed.abstract_cs;
    this.data.letter.summary = this._letterAnalyzed.summary;
    this.data.letter.origin = this._letterAnalyzed.origin;

    if (this.datum) {
      console.log(this.datum)
    }
    this.data.letter.date = this._letterAnalyzed.date;
    this.data.letter.date_marked = this._letterAnalyzed.date_marked;

    this.data.letter.incipit = this._letterAnalyzed.incipit;
    this.data.letter.explicit = this._letterAnalyzed.explicit;
    this.data.letter.full_text = this._letterAnalyzed.full_text;

    this.data.letter.entities = this.entities;
    this.data.letter.nametags = this.nametags;
    // this.data.letter.usage = this.usage;

    this.data.letter.authors_db = this._letterAnalyzed.authors_db;
    this.data.letter.author_db = this._letterAnalyzed.author_db;
    this.data.letter.recipients_db = this._letterAnalyzed.recipients_db;
    this.data.letter.recipient_db = this._letterAnalyzed.recipient_db;

    this.data.letter.analysis = this._letterAnalyzed.analysis;

    this.service.saveLetter(this.state.selectedFile.filename, this.data.letter).subscribe((res: any) => {
      if (res.error) {
        this.service.showSnackBarError(res.error);
      } else {
        this.service.showSnackBar(res.msg);
        // this.dialogRef.close({
        //   datum: this.datum
        // })
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
