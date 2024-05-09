import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, Inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import {CdkDrag, CdkDragHandle} from '@angular/cdk/drag-drop';
import { AppState } from 'src/app/app-state';
import { AppService } from 'src/app/app.service';
import { Entity, Letter } from 'src/app/shared/letter';

@Component({
  selector: 'app-analyze-dialog',
  templateUrl: './analyze-dialog.component.html',
  styleUrls: ['./analyze-dialog.component.scss'],
  standalone: true,
  imports: [FormsModule, TranslateModule, NgIf, NgFor, MatFormFieldModule, MatInputModule, MatTabsModule,
    MatCheckboxModule, DatePipe, MatListModule, CdkDrag, CdkDragHandle, MatSelectModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule, MatProgressBarModule]
})
export class AnalyzeDialogComponent {

  @ViewChild('preklad') preklad: any;

  translation: { text: string, lang: string };
  loading = false;

  _letter: Letter;
  datum: Date;

  usage: any;

  entities: Entity[] = [];
  nametag: string;
  nametags: { pos: number[], text: string, type: string, selected: boolean }[];

  constructor(
    private dialogRef: MatDialogRef<AnalyzeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { letter: Letter, text: string, prompt: string },
    public state: AppState,
    private service: AppService
  ) { }

  ngOnInit() {
    // this.analyze();
    this._letter = new Letter();
    if (this.data.letter.analysis) {
      this.setAnalysis(this.data.letter.analysis);
    }
  }

  analyze() {
    this.loading = true;
    this.findTags();
    // this.translate();
    this.annotate();
  }


  findTags() {
    this.service.findTags(this.data.text).subscribe((resp: any) => {
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

    this.service.translate(this.data.text).subscribe((resp: any) => {
      this.translation = resp;
      // this.loading = false;
    });
  }
  
  detectLang() {
    this.service.detectLang(this.data.text).subscribe((resp: any) => {
      alert(resp.languages)
    });
  }

  isDate(date: string) {
    return !isNaN(Date.parse(date));
  }

  setAnalysis(analysis: any) {
    this._letter.analysis = analysis;
    this._letter.letter_number = this._letter.analysis.letter_number;
    this._letter.letter_title = this._letter.analysis.letter_title;
    this._letter.page_number = this._letter.analysis.page_number;
    this._letter.end_page_number = this._letter.analysis.end_page_number;
    this._letter.author = this._letter.analysis.sender;
    this._letter.recipient = this._letter.analysis.recipient;
    if (!this._letter.author || this._letter.author === 'neuvedeno') {
      if (this._letter.recipient) {
        if (this._letter.recipient.toLowerCase() === this.state.fileConfig.def_author.toLowerCase()) {
          this._letter.author = this.state.fileConfig.def_recipient;
        } else if (this._letter.recipient.toLowerCase() === this.state.fileConfig.def_recipient.toLowerCase()) {
          this._letter.author = this.state.fileConfig.def_author;
        }
      } else {
        this._letter.author = this.state.fileConfig.def_author;
      }

    }
    if (!this._letter.recipient || this._letter.recipient === 'neuvedeno') {
      if (this._letter.author.toLowerCase() === this.state.fileConfig.def_recipient.toLowerCase()) {
        this._letter.recipient = this.state.fileConfig.def_author;
      } else if (this._letter.author.toLowerCase() === this.state.fileConfig.def_author.toLowerCase()) {
        this._letter.recipient = this.state.fileConfig.def_recipient;
      } else {
        this._letter.recipient = this.state.fileConfig.def_recipient;
      }
    }
    
    this._letter.salutation = this._letter.analysis.salutation;
    this._letter.signature = this._letter.analysis.signature;

    this._letter.abstract_cs = this._letter.analysis.abstract;
    this._letter.origin = this._letter.analysis.location || this._letter.analysis.place;
    this._letter.date = this._letter.analysis.date;
    if (this.isDate(this._letter.date)) {
      this.datum = new Date(this._letter.analysis.date);
    }

    this._letter.incipit = this._letter.analysis.incipit;
    this._letter.explicit = this._letter.analysis.explicit;
  }

  annotate() {
    const orig = this._letter.abstract_cs;
    this._letter.abstract_cs = 'processing...';
    this.service.annotate(this.data).subscribe((resp: any) => {
      if (resp.error) {
        console.log(resp);
        // this.letter.abstract_cs = orig;
      } else {
        this.setAnalysis(JSON.parse(resp.response?.choices[0].message.content));
        this.usage = resp.response?.usage;
        this.checkAuthors();
        this.loading = false;
      }

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

  save() {
    if (!this.data.letter.startPage) {
      this.data.letter.startPage = this.state.currentPage;
    }
    if (!this.data.letter.endPage) {
      this.data.letter.endPage = this.state.currentPage;
    }

    
    this.data.letter.letter_number = this._letter.letter_number;
    this.data.letter.letter_title = this._letter.letter_title;
    this.data.letter.page_number = this._letter.page_number;
    this.data.letter.end_page_number = this._letter.end_page_number;
    this.data.letter.salutation = this._letter.salutation;
    this.data.letter.signature = this._letter.signature;


    this.data.letter.author = this._letter.author;
    this.data.letter.recipient = this._letter.recipient;
    this.data.letter.abstract_cs = this._letter.abstract_cs;
    this.data.letter.origin = this._letter.origin;

    this.data.letter.date = this._letter.date;
    this.data.letter.incipit = this._letter.incipit;
    this.data.letter.explicit = this._letter.explicit;
    this.data.letter.full_text = this.data.text;

    this.data.letter.entities = this.entities;
    this.data.letter.nametags = this.nametags;
    this.data.letter.usage = this.usage;

    this.data.letter.authors_db = this._letter.authors_db;
    this.data.letter.author_db = this._letter.author_db;
    this.data.letter.recipients_db = this._letter.recipients_db;
    this.data.letter.recipient_db = this._letter.recipient_db;
    
    this.data.letter.analysis = this._letter.analysis;

    this.service.saveLetter(this.state.selectedFile.dir, this.data.letter).subscribe((res: any) => {
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

}
