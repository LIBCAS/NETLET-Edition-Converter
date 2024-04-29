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
    MatCheckboxModule, DatePipe, MatListModule, CdkDrag, CdkDragHandle,
    MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule, MatProgressBarModule]
})
export class AnalyzeDialogComponent {

  @ViewChild('preklad') preklad: any;

  translation: { text: string, lang: string };
  loading = false;

  abstract_cs: string;
  author: string;
  recipient: string;
  origin: string;
  datum: Date;
  date: string;
  incipit: string;
  explicit: string;


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

  isDate(date: string) {
    return !isNaN(Date.parse(date));
  }

  annotate() {
    const orig = this.abstract_cs;
    this.abstract_cs = 'processing...';
    this.service.annotate(this.data).subscribe((resp: any) => {
      if (resp.error) {
        console.log(resp);
        // this.letter.abstract_cs = orig;
      } else {
        const content = JSON.parse(resp.response?.choices[0].message.content);
        console.log(content)
        // this.abstract_cs = content.shrnuti;
        // this.misto = content.misto_a_datum.misto;
        // this.datum = content.misto_a_datum.datum;
        this.author = content.sender;
        this.recipient = content.recipient;
        if (!this.author || this.author === 'neuvedeno') {
          if (this.recipient) {
            if (this.recipient.toLowerCase() === this.state.fileConfig.def_author.toLowerCase()) {
              this.author = this.state.fileConfig.def_recipient;
            } else if (this.recipient.toLowerCase() === this.state.fileConfig.def_recipient.toLowerCase()) {
              this.author = this.state.fileConfig.def_author;
            }
          } else {
            this.author = this.state.fileConfig.def_author;
          }

        }
        if (!this.recipient || this.recipient === 'neuvedeno') {
          if (this.author.toLowerCase() === this.state.fileConfig.def_recipient.toLowerCase()) {
            this.recipient = this.state.fileConfig.def_author;
          } else if (this.author.toLowerCase() === this.state.fileConfig.def_author.toLowerCase()) {
            this.recipient = this.state.fileConfig.def_recipient;
          } else {
            this.recipient = this.state.fileConfig.def_recipient;
          }
        }
        this.abstract_cs = content.summary;
        this.origin = content.location || content.place;
        this.date = content.date;
        if (this.isDate(this.date)) {
          this.datum = new Date(content.date);
        }

        this.incipit = content.incipit;
        this.explicit = content.explicit;
        this.loading = false;
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

    this.data.letter.author = this.author;
    this.data.letter.recipient = this.recipient;
    this.data.letter.abstract_cs = this.abstract_cs;
    this.data.letter.origin = this.origin;

    this.data.letter.date = this.date;
    this.data.letter.incipit = this.incipit;
    this.data.letter.explicit = this.explicit;
    this.data.letter.full_text = this.data.text;

    this.data.letter.entities = this.entities;
    this.data.letter.nametags = this.nametags;

    // if (!isNaN(Date.parse(this.data.letter.date))) {
    //   this.datum.setValue(this.data.letter.date);
    // } else {
    //   this.datum.setValue(null);
    // }

    if (this.datum) {
      this.data.letter.date_year = this.datum.getFullYear();
    }

    this.service.saveLetter(this.state.selectedFile, this.data.letter).subscribe((res: any) => {
      if (res.error) {
        this.service.showSnackBarError(res.error);
      } else {
        this.service.showSnackBar(res.msg);
        // this.dialogRef.close({
        //   datum: this.datum
        // })
      }
    });

    // this.dialogRef.close({
    //   author: this.author,
    //   recipient: this.recipient,
    //   abstract_cs: this.abstract_cs,
    //   origin: this.origin,
    //   datum: this.datum,
    //   date: this.date,
    //   incipit: this.incipit,
    //   explicit: this.explicit,
    //   full_text: this.data.text,

    //   entities: this.entities,
    //   nametags: this.nametags

    // })
  }

}
