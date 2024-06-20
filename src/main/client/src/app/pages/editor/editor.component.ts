import { Component, ViewChild } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppService } from 'src/app/app.service';
import { AltoBlock, AltoLine, AltoString } from 'src/app/shared/alto';
import { Entity, Letter } from 'src/app/shared/letter';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { ViewerComponent } from '../../components/viewer/viewer.component';
import { NgIf, NgTemplateOutlet, NgFor, DatePipe } from '@angular/common';
import { AngularSplitModule, SplitComponent } from 'angular-split';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { SearchParams } from 'src/app/shared/file-config';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { LetterFieldsComponent } from 'src/app/components/letter-fields/letter-fields.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AppState } from 'src/app/app-state';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { FileSettingsDialogComponent } from 'src/app/components/file-settings-dialog/file-settings-dialog.component';


@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'cs' },
  ],
  imports: [FormsModule, AngularSplitModule, NgIf, ViewerComponent,
    MatToolbarModule, RouterModule, TranslateModule, DatePipe,
    MatTabsModule, MatButtonModule, ReactiveFormsModule, MatFormFieldModule, MatListModule,
    MatInputModule, NgTemplateOutlet, NgFor, MatIconModule, MatDialogModule, LetterFieldsComponent, MatTooltipModule, MatCheckboxModule]
})
export class EditorComponent {

  @ViewChild('splitArea') splitArea: SplitComponent;
  inited = false;

  onlyBox: boolean;
  twoCols: boolean;

  withSelection = false;
  results: any[];
  selectedResult: number = -1;
  currentLetterId: string;
  viewerWidth: number;
  imgW = 100;

  letters: any[] = [];
  letter: Letter;

  letterForm: FormGroup;

  entities: Entity[] = [];
  nametag: string;
  nametags: { pos: number[], text: string, type: string, selected: boolean }[];

  searchParams: SearchParams;
  ignored: { [id: string]: boolean } = {};

  view: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public state: AppState,
    private service: AppService,
    private readonly formBuilder: FormBuilder,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.state.currentPage = 1;
    this.route.paramMap.subscribe((params: any) => {
      if (params.get('letter')) {
        this.currentLetterId = params.get('letter');
      } else {
        this.currentLetterId = null;
      }
      const file = params.get('file');
      if (file === this.state.selectedFile?.filename) {
        if (this.currentLetterId) {
          this.openLetter(this.currentLetterId);
        }
        if (this.letters.length === 0) {
          this.getLetters();
        }
        return;
      }
      this.state.selectedFile = this.state.files.find(f => f.filename === params.get('file'));
      if (params.get('letter')) {
        this.currentLetterId = params.get('letter');
      }
      this.service.getDocument(this.state.selectedFile.filename).subscribe((res: any) => {
        this.state.numPages = res.pages;
      });

      this.service.getConfig(this.state.selectedFile.filename).subscribe((res: any) => {
        this.state.fileConfig = res;
        if (this.state.fileConfig.searchParams) {
          this.searchParams = this.state.fileConfig.searchParams;
          this.twoCols = this.searchParams.twoCols;
          this.onlyBox = this.searchParams.onlyBox;
          this.ignored = this.state.fileConfig.ignored;
          // this.findLetters();
        }
        this.getLetters();

        if (params.get('letter')) {
          this.currentLetterId = params.get('letter');
        } else {
          this.view = 'letters'
        }


      });


    });

  }

  ngAfterViewInit() {
    setTimeout(() => {
      const w = this.splitArea.displayedAreas[0].component.elRef.nativeElement.clientWidth;
      this.viewerWidth = w;
      this.inited = true;
    }, 10)
  }

  newLetter() {
    this.letter = new Letter();
    this.letter.id = this.state.selectedFile.filename.substring(0, 3) + new Date().getTime();
    this.letter.author = this.state.fileConfig.def_author;
    this.letter.recipient = this.state.fileConfig.def_recipient;
    this.letter.full_text = '';
    this.view = 'fields';
  }

  switchAuthors() {

    const a = this.letter.author;
    const r = this.letter.recipient;
    this.letter.author = r;
    this.letter.recipient = a;

  }

  refreshLetters(id: string) {
    if (id) {
      if (this.currentLetterId) {
        this.router.navigate(['../', id], { relativeTo: this.route });
      } else {
        this.router.navigate([id], { relativeTo: this.route });
      }
    } else {
      this.getLetters();
    }

  }

  setField(data: { field: string, textBox: string, append: boolean }) {
    let text = '';
    switch (data.textBox) {
      case 'block':
        text = this.state.getBlockText(this.state.selectedBlocks);
        break;
      case 'line':
        text = this.state.getSelectedLinesText();
        break;
      case 'word':
        text = this.state.getSelectedWordsText();
        break;
    }

    text = this.processReplacements(text);
    if (data.append && this.letter[data.field as keyof Letter]) {
      this.letter[data.field as keyof Letter] += ' ' + text;
    } else {
      this.letter[data.field as keyof Letter] = text;
    }
    // this.letterForm.controls[field].setValue(text);

    setTimeout(() => {

      const el: HTMLInputElement = document.querySelector('input[name="' + data.field + '"]');
      if (el) {
        el.focus();
      }
    }, 100)

  }

  copyToClipBoard(textBox: string) {
    // Get the text field
    const copyText: any = document.getElementById("copyText");

    let text = '';
    switch (textBox) {
      case 'block':
        text = this.state.getBlockText(this.state.selectedBlocks);
        break;
      case 'line':
        text = this.state.getSelectedLinesText();
        break;
      case 'word':
        text = this.state.getSelectedWordsText();
        break;
    }

    copyText.value = text;

    // Select the text field
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices

    // Copy the text inside the text field
    navigator.clipboard.writeText(copyText.value);

    // Alert the copied text
    // alert("Copied the text: " + copyText.value);
  }

  processReplacements(text: string): string {
    if (!this.state.fileConfig.replacements) {
      return text;
    }
    let ret = text;
    this.state.fileConfig.replacements.forEach(r => {
      ret = ret.replaceAll(r.orig, r.dest);
    });

    return ret;
  }

  getPage(keepSelection: boolean = false) {
    if (!keepSelection) {
      this.clearSelection();
    }
    this.service.getAlto(this.state.selectedFile.filename, (this.state.currentPage - 1) + '').subscribe((res: any) => {
      this.state.alto = res.alto;
      this.addIdx();
    });
  }

  addIdx() {
    const tBlocks: AltoBlock[] = this.state.alto.Layout.Page.PrintSpace.TextBlock;
    tBlocks.forEach((tb: any) => {
      const tlines = tb.TextLine;
      if (tlines) {
        tlines.forEach((line: AltoLine, idx: number) => {
          line.idx = idx;
          line.String.forEach((word: AltoString, widx: number) => {
            word.idx = widx;
          });

        });
      }

    });
  }

  addTextBlock(tb: AltoBlock) {
    if (!this.state.selectedBlocks.find((b: AltoBlock) => tb.ID === b.ID)) {
      this.state.selectedBlocks.push(tb);
    }
  }

  setArea(lineIdx: number, wordIdx: number) {
    // console.log(this.state.selectedBlocks[0].TextLine[lineIdx])
    // console.log(this.state.selectedBlocks[0].TextLine[lineIdx].String[wordIdx])
    const b = this.state.selectedBlocks[0];
    this.clearSelection();
    this.state.selectedBlocks = [b];
    this.state.selectedLines = [this.state.selectedBlocks[0].TextLine[lineIdx]];
    this.state.selectedWords = [this.state.selectedBlocks[0].TextLine[lineIdx].String[wordIdx]];
    this.state.selectedAlto = { blocks: this.state.selectedBlocks, lines: this.state.selectedLines, words: this.state.selectedWords };
  }

  setSelectedArea(t: any) {
    this.state.selection = t;
    const tBlocks: AltoBlock[] = this.state.alto.Layout.Page.PrintSpace.TextBlock;

    this.clearSelection();

    this.state.selectedBlocks = tBlocks.filter((tb: AltoBlock) => {
      return this.intersectRect(this.state.selection, DOMRect.fromRect({ x: tb.HPOS, y: tb.VPOS, width: tb.WIDTH, height: tb.HEIGHT }))
    })

    this.state.selectedBlocks.forEach((tb: any) => {
      const tlines = tb.TextLine;
      if (tlines) {
        tlines.forEach((line: AltoLine, idx: number) => {
          //line.idx = idx;
          if (this.intersectRect(this.state.selection, DOMRect.fromRect({ x: line.HPOS, y: line.VPOS, width: line.WIDTH, height: line.HEIGHT }))) {
            //console.log(idx);
            this.state.selectedLines.push(line);
            line.String.forEach((word: AltoString, widx: number) => {
              //word.idx = widx;
              if (this.intersectRect(this.state.selection, DOMRect.fromRect({ x: word.HPOS, y: word.VPOS, width: word.WIDTH, height: word.HEIGHT }))) {
                //console.log(idx);
                this.state.selectedWords.push(word);
              }
            });
          }
        });
      }

    });

    if (this.state.selection.right - this.state.selection.left < 2) {
      // Je to jen click. state.selection ma byt oblast bloku
      let left = this.state.alto.Layout.Page.WIDTH;
      let rigth = 0;
      let top = this.state.alto.Layout.Page.HEIGHT;
      let bottom = 0;
      if (this.state.selectedBlocks.length > 0) {
        this.state.selectedBlocks.forEach((tb: AltoBlock) => {
          left = Math.min(left, tb.HPOS);
          top = Math.min(top, tb.VPOS);
          rigth = Math.max(rigth, tb.HPOS + tb.WIDTH);
          bottom = Math.max(bottom, tb.VPOS + tb.HEIGHT);
        });
        this.state.selection = new DOMRect(left, top, rigth - left, bottom - top);
      } else {
        this.state.selection = new DOMRect(0, 0, left, top);
      }
    }
    this.state.selectedAlto = { blocks: this.state.selectedBlocks, lines: this.state.selectedLines, words: this.state.selectedWords };

  }

  intersectRect(r1: DOMRect, r2: DOMRect) {
    return !(r2.left >= r1.right ||
      r2.right <= r1.left ||
      r2.top >= r1.bottom ||
      r2.bottom <= r1.top);

    // return line.VPOS >= this.state.selection.top && line.HPOS >= this.state.selection.left &&
    //       (line.VPOS + line.HEIGHT) <= this.state.selection.bottom &&
    //       (line.HPOS + line.WIDTH) <= this.state.selection.right
  }

  findSimilar() {
    this.onlyBox = true;
    this.searchParams = { filename: this.state.selectedFile.filename, page: (this.state.currentPage - 1), selection: this.state.selectedAlto, onlyBox: this.onlyBox, twoCols: this.twoCols };
    this.state.fileConfig.searchParams = this.searchParams;
    this.findLetters();
  }

  findLetters() {
    this.service.findSimilar(this.searchParams).subscribe((resp: any) => {
      this.results = resp.response.docs;
      this.selectFirstNotIgnored(0);

    });
  }

  getLetters() {
    this.service.getLetters(this.state.selectedFile.filename).subscribe((resp: any) => {
      this.letters = resp.response.docs;

      this.getPage();
      if (this.currentLetterId) {
        this.openLetter(this.currentLetterId);
      } else {
        this.view = 'letters'
      }

    });
  }

  selectFirstNotIgnored(start: number) {
    for (let i = start; i < this.results.length; i++) {
      const doc = this.results[i];
      if (!this.ignored[doc.id]) {
        this.selectResult(doc, false, i);
        return;
      }
    }
  }

  clearSelection() {
    this.state.selectedBlocks = [];
    this.state.selectedLines = [];
    this.state.selectedWords = [];
    this.state.selectedAlto = { blocks: this.state.selectedBlocks, lines: this.state.selectedLines, words: this.state.selectedWords };
  }

  openLetter(id: string) {
    this.service.getLetter(id).subscribe(res => {
      if (res.response.docs.length > 0) {
        this.letter = res.response.docs[0].data;
        if (!this.letter.startPage) {
          this.letter.startPage = this.state.currentPage;
        } else {
          this.state.currentPage = this.letter.startPage;
        }
        if (!this.letter.id) {
          this.letter.startPage = this.state.currentPage;
        } else {
          this.state.currentPage = this.letter.startPage;
        }
        this.gotoResult(res.response.docs[0], false, 0);

      } else {
        this.newLetter();
        this.letter.id = id;
        this.letter.startPage = this.state.currentPage;
      }
      this.view = 'fields';
    });
  }


  selectResult(doc: any, keepSelection: boolean, idx: number) {
    if (this.ignored[doc.id]) {
      return;
    }
    if (this.currentLetterId) {
      this.router.navigate(['../', doc.id], { relativeTo: this.route });
    } else {
      this.router.navigate([doc.id], { relativeTo: this.route });
    }

    // this.openLetter(doc.id);

  }


  gotoResult(doc: any, keepSelection: boolean, idx: number) {

    this.selectedResult = idx;
    this.withSelection = keepSelection;
    this.state.currentPage = doc.data.startPage;
    this.getPage(keepSelection);


    // this.state.selectedLines = doc.lines;
    this.state.selectedWords = [];
    // this.state.selectedAlto = null;
    this.state.selectedAlto = { blocks: this.state.selectedBlocks, lines: this.state.selectedLines, words: this.state.selectedWords };

  }

  splitChanged(e: any) {
    const w = this.splitArea.displayedAreas[0].component.elRef.nativeElement.clientWidth;
    this.viewerWidth = w;
  }

  openSettings() {
    const dialogRef = this.dialog.open(FileSettingsDialogComponent, {
      data: this.state.fileConfig,
      width: '800px'
    });

    dialogRef.afterClosed().subscribe(result => {

    });
  }

  saveFileSettings() {
    this.service.saveFile(this.state.selectedFile.filename, this.state.fileConfig).subscribe(result => {


    });
  }

  saveLetter() {
    if (!this.letter.startPage) {
      this.letter.startPage = this.state.currentPage;
    }
    if (!this.letter.endPage) {
      this.letter.endPage = this.state.currentPage;
    }
    this.service.saveLetter(this.state.selectedFile.filename, this.letter).subscribe((res: any) => {
      this.refreshLetters('');
    });
  }

  removeLetter() {
    this.service.removeLetter(this.state.selectedFile.filename, this.letter.id).subscribe((res: any) => {
      this.getLetters();
    });

  }

  exportLetter() {
    console.log(this.letter);
  }

  nextLetter() {
    const idx = this.letters.findIndex(l => l.id === this.currentLetterId);
    if (idx > -1 && idx < this.letters.length - 1) {
      this.selectResult(this.letters[idx + 1], false, idx + 1)
    }
  }

  prevLetter() {
    const idx = this.letters.findIndex(l => l.id === this.currentLetterId);
    if (idx > 0) {
      this.selectResult(this.letters[idx - 1], false, idx - 1)
    }
  }

  nextResult() {
    if (this.selectedResult > -1) {
      this.selectFirstNotIgnored(this.selectedResult + 1);
      // this.selectResult(this.results[this.selectedResult+1], true, this.selectedResult+1)
    }
  }

  prevResult() {
    if (this.selectedResult > 0) {
      this.selectResult(this.results[this.selectedResult - 1], true, this.selectedResult - 1)
    }
  }

  toggleIgnore(id: string) {
    if (this.ignored[id]) {
      this.ignored[id] = false;
    } else {
      this.ignored[id] = true;
    }
    this.state.fileConfig.ignored = this.ignored;

  }

  toggleIgnoreAndNext() {

    if (this.selectedResult > -1) {
      this.toggleIgnore(this.results[this.selectedResult].id)
    }
  }

  changeView(view: string) {
    this.view = view;
  }

  regenerateAlto() {
    this.service.regeneratePageAlto(this.state.selectedFile.filename, (this.state.currentPage - 1) + '').subscribe((res: any) => {
      this.service.showSnackBar(res)
    });
  }
}
