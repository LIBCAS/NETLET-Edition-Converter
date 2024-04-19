import { NgIf, NgTemplateOutlet, NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-letter-fields',
  templateUrl: './letter-fields.component.html',
  styleUrls: ['./letter-fields.component.scss'],
  standalone: true,
  imports: [FormsModule, NgIf, RouterModule, TranslateModule,
    MatTabsModule, MatButtonModule, MatFormFieldModule, MatListModule, MatTooltipModule,
    MatInputModule, NgTemplateOutlet, NgFor, MatIconModule, MatDialogModule, MatCheckboxModule]
})
export class LetterFieldsComponent {

  @Input() letter: Letter;
  @Output() onSetField = new EventEmitter<{ field: string, textBox: string, append: boolean }>();

  @ViewChild('abstract') abstract: any;

  entities: Entity[] = [];
  nametag: string;
  nametags: NameTag[];

  constructor(
    private route: ActivatedRoute,
    private service: AppService,
    public state: AppState,
    public dialog: MatDialog) { }

  findTags() {
    this.service.findTags(this.letter.full_text).subscribe((resp: any) => {
      this.entities = resp.response.docs;
      this.nametag = resp.nametag.result;
      this.nametags = resp.nametag.tags;
      // console.log(this.nametags)
      this.letter.entities = this.entities;
      this.letter.nametags = this.nametags;
    });
  }

  detectLang() {
    this.service.detectLang(this.letter.full_text).subscribe((resp: any) => {
      alert(resp.lang)
    });
  }

  translate() {

    const dialogRef = this.dialog.open(TranslationDialogComponent, {
      width: '800px',
      data: this.letter.full_text,
    });


    // this.service.translate(this.letter.full_text).subscribe((resp: any) => {
    //   const dialogRef = this.dialog.open(TranslationDialogComponent, {
    //     data: resp,
    //   });
    // });
  }

  annotate() {
    this.abstract.nativeElement.focus();
    const orig = this.letter.abstract_cs;
    this.letter.abstract_cs = 'processing...';
    this.service.annotate(this.letter.full_text).subscribe((resp: any) => {
      console.log(resp);
      if (resp.error) {
        this.letter.abstract_cs = orig;
      } else {
        this.letter.abstract_cs = resp.response?.choices[0].message.content;
      }

    });
  }

  analyze() {
    if (!this.letter.full_text) {
      if (this.state.selectedBlocks.length === 0) {
        const tBlocks: AltoBlock[] = this.state.alto.Layout.Page.PrintSpace.TextBlock;
        this.state.selectedBlocks = tBlocks.filter((tb: AltoBlock) => {
          return true;
        });
        this.letter.full_text = this.state.getBlockText();
      }
    }
    // console.log(this.letter.full_text);
    const dialogRef = this.dialog.open(AnalyzeDialogComponent, {
      width: '1200px',
      data: { text: this.letter.full_text, prompt: this.state.fileConfig.prompt }
    });

    dialogRef.afterClosed().subscribe(result => {
      // console.log(result);
      if (result) {
        const id = this.letter.id;
        const sp = this.letter.startPage;
        const ep = this.letter.endPage;
        this.letter = result;
        this.letter.id = id;
        this.letter.startPage = sp;
        this.letter.endPage = ep;
        if (result.datum) {
          this.letter.date_year = result.datum.getFullYear();
        }

        this.saveLetter();
      }
    })
  }

  saveLetter() {
    if (!this.letter.startPage) {
      this.letter.startPage = this.state.currentPage;
    } else {
      this.letter.endPage = this.state.currentPage;
    }
    this.service.saveLetter(this.state.selectedFile, this.letter).subscribe((res: any) => {

    });
  }

  setField(field: string, textBox: string, e: MouseEvent) {
    const append: boolean = e.ctrlKey;
    if (field === 'full_text' && textBox === 'block') {

      if (this.state.selectedBlocks.length === 0) {
        const tBlocks: AltoBlock[] = this.state.alto.Layout.Page.PrintSpace.TextBlock;
        this.state.selectedBlocks = tBlocks.filter((tb: AltoBlock) => {
          return true;
        });

      }

      console.log(this.state.selectedBlocks)
      if (append) {
        this.letter.full_text += '\n' + this.state.getBlockText();
      } else {
        this.letter.full_text = this.state.getBlockText();
      }

    } else {
      this.onSetField.emit({ field, textBox, append });
    }

  }

  switchAuthors() {

    const a = this.letter.author;
    const r = this.letter.recipient;
    this.letter.author = r;
    this.letter.recipient = a;

  }

}
