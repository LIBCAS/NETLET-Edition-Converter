import { Component, signal, ViewChild } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppService } from 'src/app/app.service';
import { AltoBlock, AltoLine, AltoString } from 'src/app/shared/alto';
import { CopyHIKO, Entity, Letter, LetterCopy, LetterHIKO, PlaceMeta } from 'src/app/shared/letter';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { ViewerComponent } from '../../components/viewer/viewer.component';
import { NgIf, NgTemplateOutlet, NgFor, DatePipe, CommonModule } from '@angular/common';
import { AngularSplitModule, SplitComponent } from 'angular-split';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FileTemplate, SearchParams } from 'src/app/shared/file-config';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { LetterFieldsComponent } from 'src/app/components/letter-fields/letter-fields.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AppState } from 'src/app/app-state';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { FileSettingsDialogComponent } from 'src/app/components/file-settings-dialog/file-settings-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { TemplateDialogComponent } from 'src/app/components/template-dialog/template-dialog.component';
import { AppConfiguration } from 'src/app/app-configuration';
import { UIService } from 'src/app/ui.service';
import { HikoImportDialogComponent } from 'src/app/components/hiko-import-dialog/hiko-import-dialog.component';
import { MatSelectModule } from '@angular/material/select';


@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'cs' },
  ],
  imports: [CommonModule, FormsModule, AngularSplitModule, NgIf, ViewerComponent,
    MatToolbarModule, RouterModule, TranslateModule, DatePipe, MatMenuModule, MatSelectModule,
    MatTabsModule, MatButtonModule, ReactiveFormsModule, MatFormFieldModule, MatListModule,
    MatInputModule, MatIconModule, MatDialogModule, LetterFieldsComponent, MatTooltipModule, MatCheckboxModule]
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

  sorts = signal<string[]>(['date asc', 'date desc', 'hiko_created_at asc', 'hiko_created_at desc', 'startPage asc', 'startPage desc']);
  sortField: string = 'startPage asc';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private translateService: TranslateService,
    public state: AppState,
    public config: AppConfiguration,
    private service: AppService,
    private ui: UIService,
    private readonly formBuilder: FormBuilder,
    public dialog: MatDialog) { }

  ngOnInit() {
    if (this.state.files?.length === 0) {
      this.getDocuments();
    } else {
      this.initData();
    }
  }

  initData() {
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
        if (!this.state.fileConfig.templates) {
          const t: FileTemplate = new FileTemplate();
          t.name = 'template_0';
          this.state.fileConfig.templates = [t];
        }
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
    this.setAreas();
  }

  getDocuments() {
    this.service.getDocuments().subscribe((res: any) => {
      this.state.tenants = Object.keys(res.tenants);
      this.state.files = res.dirs;
      this.state.files.sort((f1, f2) => f1.config.name.localeCompare(f2.config.name, 'cs-CZ'));
      this.state.files.forEach(f => {
        f.letters = res.totals[f.filename] ? res.totals[f.filename] : 0;
      });
      this.initData();
    });
  }

  setAreas() {
    setTimeout(() => {
      const w = this.splitArea.displayedAreas[0].component.elRef.nativeElement.clientWidth;
      this.viewerWidth = w;
      this.inited = true;
    }, 10)
  }

  newLetter(t: FileTemplate) {
    this.letter = new Letter();
    this.letter.template = t;
    if (!this.letter.template) {
      const t: FileTemplate = new FileTemplate();
      t.name = 'Šablona ' + (this.state.fileConfig.templates.length + 1);
      if (!this.state.fileConfig.templates) {
        this.state.fileConfig.templates = [];
      }
      this.state.fileConfig.templates.push(t);
      this.letter.template = t;
    }
    this.letter.id = this.state.selectedFile.filename.substring(0, 3) + new Date().getTime();

    this.letter.hiko.authors.push({ name: t.author_db?.name, marked: t.author_db?.marked, id: t.author_db?.id });

    this.letter.author = t.author_marked;

    this.letter.hiko.recipients.push({ name: t.recipient_db?.name, marked: t.recipient_db?.marked, id: t.recipient_db?.id, salutation: t.salutation });
    this.letter.recipient = t.recipient_marked;

    this.letter.origins.push({ name: t.origin_db?.name, marked: t.origin_db?.marked, id: t.origin_db?.id });
    this.letter.origin = t.origin_marked;

    this.letter.destinations.push({ name: t.destination_db?.name, marked: t.destination_db?.marked, id: t.destination_db?.id });
    this.letter.destination = t.destination_marked;

    t.keywords.forEach(k => {
      this.letter.hiko.global_keywords.push(k.id + '');
    });

    if (t.mentioned) {
      t.mentioned.forEach(m => {
        this.letter.hiko.mentioned.push(m.id + '');
      });
    }

    this.letter.hiko.people_mentioned_note = t.people_mentioned_note;
    this.letter.hiko.copyright = t.copyright;

    if (t.languages) {
      this.letter.hiko.languages = t.languages.join(';');
    }


    const copy = new LetterCopy();

    copy.preservation = t.preservation;
    copy.type = t.type;
    copy.copy = t.copy;
    copy.manifestation_notes = t.manifestation_notes;
    copy.l_number = t.l_number;
    copy.repository = t.repository;
    copy.archive = t.archive;
    copy.collection = t.collection;
    copy.ms_manifestation = t.ms_manifestation;
    copy.signature = t.signature;
    copy.location_note = t.location_note;

    this.letter.hiko.copies.push(copy);
    this.letter.hiko.content = '';
    this.view = 'fields';
  }

  switchAuthors() {

    const a = this.letter.hiko.authors;
    const r = this.letter.hiko.recipients;
    this.letter.hiko.authors = r;
    this.letter.hiko.recipients = a;

  }

  refreshLetters(id: string) {
    if (id) {
      if (this.currentLetterId === id) {
        this.openLetter(id);
      } else if (this.currentLetterId) {
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
    if (data.field.startsWith('copies_')) {
      // field format is copies_repository_0
      const parts = data.field.split('_');
      let idx: number = parseInt(parts[2]);
      // if (!idx) {
      //   if (this.letter.copies.length === 1) {
      //     idx = 0
      //   } else {
      //     let p = prompt('Copy number?', '1');
      //     idx = parseInt(p);
      //     if (!idx ) {
      //       return;
      //     } else {
      //       idx = idx - 1;
      //     }
      //   }
      //     data.field = data.field +'_' + idx;

      // }
      // console.log(idx, this.letter.copies)
      this.letter.hiko.copies[idx][parts[1] as keyof CopyHIKO] = text;
    } else if (data.append && this.letter[data.field as keyof Letter]) {
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
      this.state.clearSelection();
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
    this.state.clearSelection();
    this.state.selectedBlocks = [b];
    this.state.selectedLines = [this.state.selectedBlocks[0].TextLine[lineIdx]];
    this.state.selectedWords = [this.state.selectedBlocks[0].TextLine[lineIdx].String[wordIdx]];
    this.state.selectedAlto = { blocks: this.state.selectedBlocks, lines: this.state.selectedLines, words: this.state.selectedWords };
  }

  setSelectedArea(t: any) {
    this.state.selection = t;
    const tBlocks: AltoBlock[] = this.state.alto.Layout.Page.PrintSpace.TextBlock;

    this.state.clearSelection();

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

  sortBy() {
    this.getLetters();
  }

  getLetters() {
    this.service.getLetters(this.state.selectedFile.filename, this.sortField).subscribe((resp: any) => {
      this.letters = resp.response.docs;

      if (this.currentLetterId) {
        this.openLetter(this.currentLetterId);
      } else {
        this.getPage();
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

  openLetter(id: string) {
    this.service.getLetter(id).subscribe(res => {
      if (res.response.docs.length > 0) {
        this.letter = res.response.docs[0];
        if (!this.letter.startPage) {
          this.letter.startPage = this.state.currentPage;
        } else {
          this.state.currentPage = this.letter.startPage;
        }

        const idx = this.letters.findIndex(l => l.id === id);

        if (!this.letter.template) {
          this.letter.template = this.state.fileConfig.templates[0];
        }

        if (!this.letter.hiko) {
          this.letter.hiko = new LetterHIKO();
        }

        if (!this.letter.hiko.authors) {
          this.letter.hiko.authors = [];
        }

        if (!this.letter.hiko.recipients) {
          this.letter.hiko.recipients = [];
        }

        if (!this.letter.hiko.copies) {
          this.letter.hiko.copies = [];
          const copy = new LetterCopy();
          copy.repository = this.letter['copies_repository'];
          copy.archive = this.letter['copies_archive'];
          copy.collection = this.letter['copies_collection'];
          if (this.letter.letter_number) {
            copy.l_number = this.letter.letter_number;
          }
          this.letter.hiko.copies.push(copy);
        }

        this.gotoResult(res.response.docs[0], false, idx);

      } else {
        this.newLetter(this.state.fileConfig.templates[0]);
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
    this.selectedResult = idx;
    if (this.currentLetterId) {
      this.router.navigate(['../', doc.id], { relativeTo: this.route });
    } else {
      this.router.navigate([doc.id], { relativeTo: this.route });
    }

    // this.openLetter(doc.id);

  }


  gotoResult(doc: Letter, keepSelection: boolean, idx: number) {

    this.selectedResult = idx;
    this.withSelection = keepSelection;
    this.state.currentPage = doc.startPage;
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

  templateFromLetter() {
    const t: FileTemplate = FileTemplate.newTemplateFromLetter(this.letter);
    if (!this.state.fileConfig.templates) {
      this.state.fileConfig.templates = [];
    }
    this.state.fileConfig.templates.push(t);
    const dialogRef = this.dialog.open(TemplateDialogComponent, {
      data: { template: t },
      width: '800px'
    });

    dialogRef.afterClosed().subscribe(result => {

    });
  }

  saveFileSettings() {
    this.service.saveFile(this.state.selectedFile.filename, this.state.fileConfig).subscribe(result => {


    });
  }

  viewLetterInHIKO() {
    const tenant = this.config.isTest ? this.config.test_mappings[this.state.user.tenant] : this.state.user.tenant;
    window.open(this.config.hikoUrl.replace('{tenant}', tenant).replace('{id}', this.letter.hiko_id + ''), 'hiko');
  }

  log() {
    console.log(this.letter)
  }


  saveLetter() {
    if (!this.letter.startPage) {
      this.letter.startPage = this.state.currentPage;
    }
    if (!this.letter.endPage) {
      this.letter.endPage = this.state.currentPage;
    }

    this.service.saveLetter(this.state.selectedFile.filename, this.letter).subscribe((res: any) => {
      this.ui.showInfoSnackBar('Letter saved successfully');
      this.refreshLetters('');
    });
  }

  removeLetter() {
    const c = window.confirm(this.translateService.instant('action.remove_alert'));
    if (c) {
      this.service.removeLetter(this.state.selectedFile.filename, this.letter.id).subscribe((res: any) => {
        this.getLetters();
      });
    }

  }

  importFromHIKO() {

    const dialogRef = this.dialog.open(HikoImportDialogComponent, {
      width: '800px'
    });

    dialogRef.afterClosed().subscribe((result: { new_letter: boolean, overwrite: boolean, id: string }) => {
      if (result) {
        this.doImportFromHIKO(result.new_letter, result.overwrite, result.id)
      }
    });

  }

  mergeHIKOField(res: any, letter: Letter, overwrite: boolean, field: string, sfield?: string) {
    const source = sfield ? sfield : field;
    if (overwrite || !letter[field]) {
      letter.hiko[field] = res[source];
    }
  }

  mergeFromHIKO(res: any, letter: Letter, overwrite: boolean) {

    letter.hiko_id = res.id;

    if (overwrite || !letter.date) {
      letter.date = res.date_computed;
    }


    const authors = res.identities.filter((i: any) => i.pivot.role === "author").map((ident: any) => { return { id: ident.id, name: ident.name, marked: ident.pivot.marked } });
    if (authors.length > 0) {
      letter.author = authors[0].marked;
    }

    const recipients = res.identities.filter((i: any) => i.pivot.role === "recipient").map((ident: any) => { return { id: ident.id, name: ident.name, salutation: ident.pivot.salutation, marked: ident.pivot.marked } });
    if (recipients.length > 0) {
      letter.recipient = recipients[0].marked;
      letter.salutation = recipients[0].salutation;
    }

    const mentioned = res.identities.filter((i: any) => i.pivot.role === "mentioned").map((ident: any) => { return { id: ident.id, name: ident.name, marked: ident.pivot.marked } });

    const origins = res.places.filter((i: any) => i.pivot.role === "origin").map((place: any) => { return { id: place.id, name: place.name, marked: place.pivot.marked, tenant: this.state.user.tenant } });
    if (origins.length > 0) {
      letter.origin = origins[0].marked;
    }
    const global_origins = res.global_places.filter((i: any) => i.pivot.role === "origin").map((place: any) => { return { id: place.id, name: place.name, marked: place.pivot.marked, tenant: 'global' } });
    if (global_origins.length > 0) {
      letter.origin = global_origins[0].marked;
    }

    const destinations = res.places.filter((i: any) => i.pivot.role === "destination").map((place: any) => { return { id: place.id, name: place.name, marked: place.pivot.marked, tenant: this.state.user.tenant } });
    if (destinations.length > 0) {
      letter.destination = destinations[0].marked;
    }
    const global_destinations = res.global_places.filter((i: any) => i.pivot.role === "destination").map((place: any) => { return { id: place.id, name: place.name, marked: place.pivot.marked, tenant: 'global' } });
    if (global_destinations.length > 0) {
      letter.destination = global_destinations[0].marked;
    }

    const fields = ['id',
      'uuid',
      'created_at',
      'updated_at',
      'date_computed', 'date_year', 'date_month', 'date_day', 'date_is_range', 'date_marked', 'range_day', 'range_month',
      'range_year', 'date_inferred', 'date_uncertain', 'date_note', 'date_approximate',
      'author_uncertain', 'author_inferred', 'author_note', 'recipient_uncertain', 'recipient_inferred', 'recipient_note', 'people_mentioned_note',

      'origin_inferred', 'origin_uncertain', 'origin_note',
      'destination_inferred', 'destination_uncertain', 'destination_note',

      'languages', 'local_keywords', 'global_keywords', 'keywords',

      'incipit', 'explicit', 'notes_private', 'notes_public', 'related_resources', 'copies',
      'copyright', 'status', 'approval', 'action', 'abstract', 'content', 'content_stripped'];

    fields.forEach(f => {
      this.mergeHIKOField(res, letter, overwrite, f);
    });

    this.mergeHIKOField(res, letter, overwrite, 'date', 'date_computed');

    letter.hiko.authors = authors;
    letter.hiko.recipients = recipients;
    letter.hiko.mentioned = mentioned;
    letter.origins = [...origins, ...global_origins];
    letter.destinations = [...destinations, ...global_destinations];

    // letter.hiko = {
    //   id: res.id,
    //   uuid: res.uuid,
    //   created_at: res.created_at,
    //   updated_at: res.updated_at,


    //   date: res.date_computed,
    //   date_computed: res.date_computed,
    //   date_year: res.date_year,
    //   date_month: res.date_month,
    //   date_day: res.date_day,
    //   date_is_range: res.date_is_range,
    //   date_marked: res.date_marked,
    //   range_day: res.range_day,
    //   range_month: res.range_month,
    //   range_year: res.range_year,
    //   date_inferred: res.date_inferred,
    //   date_uncertain: res.date_uncertain,
    //   date_note: res.date_note,
    //   date_approximate: res.date_approximate,
    //   authors: authors,
    //   author_uncertain: res.author_uncertain,
    //   author_inferred: res.author_inferred,
    //   author_note: res.author_note,

    //   recipients: recipients,
    //   recipient_uncertain: res.recipient_uncertain,
    //   recipient_inferred: res.recipient_inferred,
    //   recipient_note: res.recipient_note,

    //   mentioned: mentioned,
    //   people_mentioned_note: res.people_mentioned_note,

    //   origins: origins,
    //   origin_inferred: res.origin_inferred,
    //   origin_uncertain: res.origin_uncertain,
    //   origin_note: res.origin_note,

    //   destinations: destinations,
    //   destination_inferred: res.destination_inferred,
    //   destination_uncertain: res.destination_uncertain,
    //   destination_note: res.destination_note,

    //   languages: res.languages,

    //   local_keywords: res.local_keywords,
    //   global_keywords: res.global_keywords,
    //   keywords: res.keywords,

    //   incipit: res.incipit,
    //   explicit: res.explicit,
    //   notes_private: res.notes_private,
    //   notes_public: res.notes_public,
    //   related_resources: res.related_resources,
    //   copies: res.copies,
    //   copyright: res.copyright,


    //   status: res.status,
    //   approval: res.approval,
    //   action: res.action,

    //   abstract: res.abstract,

    //   content: res.content_stripped,
    //   content_stripped: res.content_stripped
    // };
  }

  doImportFromHIKO(new_letter: boolean, overwrite: boolean, id: string) {
    // const id = window.prompt('Id to import. Tenant: ' + this.state.user.tenant);
    if (id) {
      this.service.importFromHiko(id, this.state.user.tenant).subscribe((res: any) => {
        //console.log(res)
        if (res.error) {
          this.service.showSnackBarError(this.translateService.instant(res.error));
          return;
        }

        if (new_letter) {

          const letter = new Letter();
          this.mergeFromHIKO(res, letter, true);

          letter.id = this.state.selectedFile.filename.substring(0, 3) + new Date().getTime();
          letter.tenant = this.state.user.tenant;
          letter.ai = [];
          letter.selection = [];
          letter.template = this.state.fileConfig.templates[0];

          this.letter = letter;
          this.letters.push(letter);
        } else {
          this.mergeFromHIKO(res, this.letter, overwrite);
        }
        this.view = 'fields';
      });
    }
    console.log(this.letter.hiko)
  }

  exportToHIKO() {

    if (this.letter.date) {
      const d: Date = new Date(this.letter.date);
      this.letter.hiko.date_computed = this.letter.date;
      this.letter.hiko.date_year = d.getFullYear();
      this.letter.hiko.date_month = d.getMonth() + 1;
      this.letter.hiko.date_day = d.getUTCDate();
    }

    this.letter.hiko.content_stripped = this.letter.hiko.content;

    if (this.letter.hiko.authors.length > 0 && this.letter.hiko.authors[0].id > -1) {
      this.letter.hiko.authors[0].marked = this.letter.author;
    } else {
      this.letter.hiko.authors = [];
    }

    if (this.letter.hiko.recipients.length > 0 && this.letter.hiko.recipients[0].id > -1) {
      this.letter.hiko.recipients[0].marked = this.letter.recipient;
      this.letter.hiko.recipients[0].salutation = this.letter.salutation;
    } else {
      this.letter.hiko.recipients = [];
    }



    if (this.letter.origins.length > 0 && this.letter.origins[0].id > -1) {
      this.letter.origins[0].marked = this.letter.origin;
      this.letter.hiko.local_origins = this.letter.origins.filter(o => o.tenant !== 'global').map(o => { return { id: o.id, marked: o.marked } });
      this.letter.hiko.global_origins = this.letter.origins.filter(o => o.tenant === 'global').map(o => { return { id: o.id, marked: o.marked } });

    } else {
      this.letter.hiko.local_origins = [];
      this.letter.hiko.global_origins = [];
    }

    if (this.letter.destinations.length > 0 && this.letter.destinations[0].id > -1) {
      this.letter.destinations[0].marked = this.letter.destination;
      this.letter.hiko.local_destinations = this.letter.destinations.filter(o => o.tenant !== 'global').map(o => { return { id: o.id, marked: o.marked } });
      this.letter.hiko.global_destinations = this.letter.destinations.filter(o => o.tenant === 'global').map(o => { return { id: o.id, marked: o.marked } });

    } else {
      this.letter.hiko.local_destinations = [];
      this.letter.hiko.global_destinations = [];
    }

    if (this.letter.letter_number) {
      this.letter.hiko.copies[0].l_number = this.letter.letter_number;
    }


      this.letter.hiko.local_keywords = this.letter.entities.filter(o => o.tenant !== 'global' && o.selected).map(o => { return o.table_id });
      this.letter.hiko.global_keywords = this.letter.entities.filter(o => o.tenant === 'global' && o.selected).map(o => { return o.table_id  });

    // console.log(this.letter.hiko);
    // return;
    this.service.exportToHiko(this.letter.hiko, this.state.user.tenant).subscribe((res: any) => {
      if (res.errors) {
        // this.service.showSnackBar(res.message, '', true);
        this.ui.showErrorDialogFromString(res.message);
      } else if (res.id) {
        this.letter.hiko_id = res.id;
        this.letter.exported_to_hiko = true;
        this.ui.showInfoSnackBar('Letter exported successfully');
        this.saveLetter();
      }
    });
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
