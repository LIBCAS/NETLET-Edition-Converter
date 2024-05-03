import { NgIf, NgTemplateOutlet, NgFor, DatePipe } from '@angular/common';
import { Component, EventEmitter, Inject, Input, Output, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
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
import { DateAdapter, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-letter-fields',
  templateUrl: './letter-fields.component.html',
  styleUrls: ['./letter-fields.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'cs' },
  ],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgIf, RouterModule, TranslateModule, DatePipe,
    MatDatepickerModule, MatNativeDateModule,
    MatTabsModule, MatButtonModule, MatFormFieldModule, MatListModule, MatTooltipModule,
    MatInputModule, NgTemplateOutlet, NgFor, MatIconModule, MatDialogModule, MatCheckboxModule]
})
export class LetterFieldsComponent {

  _letter: Letter;
  @Input() set letter(value: Letter) {
    if (!value) {
      return;
    }
    this._letter = value;
    if (!isNaN(Date.parse(this._letter.date))) {
      this.datum.setValue(this._letter.date);
    } else {
      this.datum.setValue(null);
    }

  }
  @Output() onSetField = new EventEmitter<{ field: string, textBox: string, append: boolean }>();
  @Output() onShouldRefresh = new EventEmitter<boolean>();

  @ViewChild('abstract') abstract: any;

  entities: Entity[] = [];
  nametag: string;
  nametags: NameTag[];

  datum = new FormControl();

  constructor(
    private _adapter: DateAdapter<any>,
    @Inject(MAT_DATE_LOCALE) private _locale: string,
    private route: ActivatedRoute,
    private service: AppService,
    public state: AppState,
    public dialog: MatDialog) { }

  ngOnInit() {
    this._locale = 'cs';
    this._adapter.setLocale(this._locale);
  }

  findTags() {
    this.service.findTags(this._letter.full_text).subscribe((resp: any) => {
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


    // this.service.translate(this._letter.full_text).subscribe((resp: any) => {
    //   const dialogRef = this.dialog.open(TranslationDialogComponent, {
    //     data: resp,
    //   });
    // });
  }

  annotate() {
    this.abstract.nativeElement.focus();
    const orig = this._letter.abstract_cs;
    this._letter.abstract_cs = 'processing...';
    this.service.annotate(this._letter.full_text).subscribe((resp: any) => {
      console.log(resp);
      if (resp.error) {
        this._letter.abstract_cs = orig;
      } else {
        this._letter.abstract_cs = resp.response?.choices[0].message.content;
      }

    });
  }

  analyze() {
    if (!this._letter.full_text) {
      if (this.state.selectedBlocks.length === 0) {
        const tBlocks: AltoBlock[] = this.state.alto.Layout.Page.PrintSpace.TextBlock;
        this.state.selectedBlocks = tBlocks.filter((tb: AltoBlock) => {
          return true;
        });
        this._letter.full_text = this.state.getBlockText();
      }
    }
    // console.log(this._letter.full_text);
    const dialogRef = this.dialog.open(AnalyzeDialogComponent, {
      width: '1200px',
      // height: '600px',
      disableClose: true,
      panelClass: 'my-custom-panel',
      data: { letter: this._letter, text: this._letter.full_text, prompt: this.state.fileConfig.prompt }
    });

    dialogRef.afterClosed().subscribe(result => {
      // console.log(result);
      if (result) {
        if (!isNaN(Date.parse(result.date))) {
          this.datum.setValue(this._letter.date);
        } else {
          this.datum.setValue(null);
        }
      }
      this.onShouldRefresh.emit(true);
    })
  }

  saveLetter() {
    if (!this._letter.startPage) {
      this._letter.startPage = this.state.currentPage;
    }
    
    if (!this._letter.endPage) {
      this._letter.endPage = this.state.currentPage;
    }
    this.service.saveLetter(this.state.selectedFile, this._letter).subscribe((res: any) => {
      this.onShouldRefresh.emit(true);
    });
  }

  setField(field: string, textBox: string, e: MouseEvent) {
    const append: boolean = e.ctrlKey;
    if (field === 'full_text' && textBox === 'block') {

      if (this.state.selectedBlocks.length === 0) {
        const tBlocks: AltoBlock[] = this.state.alto.Layout.Page.PrintSpace.TextBlock;
        console.log(tBlocks)
        this.state.selectedBlocks = tBlocks.filter((tb: AltoBlock) => {
          return true;
        });

      }

      if (append) {
        this._letter.full_text += '\n\n' + this.state.getBlockText();
      } else {
        this._letter.full_text = this.state.getBlockText();
      }

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


}
