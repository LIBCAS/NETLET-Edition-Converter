import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { AltoBlock, AltoLine, AltoString } from 'src/app/shared/alto';
import { CdkMenuModule } from '@angular/cdk/menu';
import { TranslateModule } from '@ngx-translate/core';
import { NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { AppState } from 'src/app/app-state';
import { AppService } from 'src/app/app.service';
import { AppConfiguration } from 'src/app/app-configuration';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss'],
  standalone: true,
  imports: [NgFor, TranslateModule, CdkMenuModule, MatIconModule, FormsModule, MatTooltipModule, MatButtonModule]
})
export class ViewerComponent {
  @Output() onSetField = new EventEmitter<{ field: string, textBox: string, append: boolean }>();
  @Output() onCopyToClipboard = new EventEmitter<string>();
  @Input() file: string = '';

  

  public _imgW = 100;
  // @Input() set imgW(value: number){
  //   this._imgW = value;
  //   if (this.canvasInited) {
  //     setTimeout(() => {
  //       this.getInfo();
  //     }, 1)
  //   }
  // }


  @Input() set width(value: number) {
    if (this.canvasInited) {
      this.getInfo();
    }
  }


  @Input() set selectedAlto(value: { blocks: AltoBlock[], lines: AltoLine[], words: AltoString[] }) {
    if (this.canvasInited) {
      this._alto = value;
      this.drawSelectedAlto(value);
    }
  }

  private _alto: { blocks: AltoBlock[], lines: AltoLine[], words: AltoString[] };

  @Output() selectionEvent = new EventEmitter<any>();

  @ViewChild('scroller') scroller: ElementRef;
  @ViewChild('image') image: ElementRef;
  @ViewChild('selCanvas') selCanvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('autoCanvas') autoCanvas: ElementRef<HTMLCanvasElement>;

  openSettings() {
    // temp
  }

  saveFileSettings() {
    // temp
  }
  // -- pedro


  ctx: CanvasRenderingContext2D;
  ctxAuto: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  imageBounds: DOMRect;
  scale: number;

  canvasOffset = 0;
  offsetX = 0;
  offsetY = 0;
  scrollX = 0;
  scrollY = 0;

  isDown = false;

  // these vars will hold the starting mouse position
  startX = 0;
  startY = 0;

  prevStartX = 0;
  prevStartY = 0;

  prevWidth = 0;
  prevHeight = 0;

  canvasInited = false;

  colorBlock: string;
  colorLine: string;
  colorWord: string;

  constructor(
    public config: AppConfiguration,
    public state: AppState,
    private service: AppService
  ) { }

  ngOnInit() {
    this.colorBlock = getComputedStyle(document.documentElement).getPropertyValue('--app-color-block');
    this.colorLine = getComputedStyle(document.documentElement).getPropertyValue('--app-color-line');
    let c = this.hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--app-color-word'));
    this.colorWord = 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', 0.3)';
  }



  prevPage() {
    if (this.state.currentPage > 0) {
      const el = this.scroller.nativeElement;
      (el as HTMLDivElement).scrollLeft = 0;
      (el as HTMLDivElement).scrollTop = 0;

      this.state.currentPage--;
      this.getPage();
    }
  }

  nextPage() {
    if (this.state.currentPage < (this.state.numPages - 1)) {
      const el = this.scroller.nativeElement;
      (el as HTMLDivElement).scrollLeft = 0;
      (el as HTMLDivElement).scrollTop = 0;
      this.state.currentPage++;
      this.getPage();
    }
  }

  getPage(keepSelection: boolean = false) {
    if (!keepSelection) {
      this.clearSelection();
    }
    this.service.getAlto(this.state.selectedFile.dir, (this.state.currentPage - 1) + '').subscribe((res: any) => {
      this.state.alto = res.alto;
      this.addIdx();
    });
  }

  addIdx() {
    const tBlocks: AltoBlock[] = this.state.alto.Layout.Page.PrintSpace.TextBlock;
    if (!tBlocks) {
      return;
    }
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

  clearSelection() {
    this.state.selectedBlocks = [];
    this.state.selectedLines = [];
    this.state.selectedWords = [];
    this.state.selectedAlto = { blocks: this.state.selectedBlocks, lines: this.state.selectedLines, words: this.state.selectedWords };
  }


  getInfo() {
    const img = this.image.nativeElement as HTMLImageElement;

    this.scale = img.width / img.naturalWidth;
    this.imageBounds = img.getBoundingClientRect();
    this.initCanvas(img, !this.canvasInited);
    this.drawSelectedAlto(this._alto);
  }

  initCanvas(img: HTMLImageElement, withEvents: boolean) {

    const bounds = img.getBoundingClientRect();
    const el = this.selCanvas.nativeElement;
    el.width = bounds.width;
    el.height = bounds.height;
    el.setAttribute('style', 'position: absolute; z-index:20;' +
      'left:0; top:0;' +
      'width:' + bounds.width + 'px; height:' + bounds.height + 'px;');

    this.canvasWidth = bounds.width;
    this.canvasHeight = bounds.height;

    // this.ctx = <CanvasRenderingContext2D>(el as HTMLCanvasElement).getContext('2d');
    // this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    // this.ctxAuto = <CanvasRenderingContext2D>(this.autoCanvas.nativeElement as HTMLCanvasElement).getContext('2d');
    // this.ctxAuto.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    if (withEvents) {

      el.addEventListener("mousedown", (e) => {
        this.handleMouseDown(e);
      });
      el.addEventListener("mousemove", (e) => {
        this.handleMouseMove(e);
      });
      el.addEventListener("mouseup", (e) => {
        this.handleMouseUp(e);
      });
      el.addEventListener("mouseout", (e) => {
        this.handleMouseOut(e);
      });
    } else {
    }

    const a = this.autoCanvas.nativeElement;
    a.width = bounds.width;
    a.height = bounds.height;
    a.setAttribute('style', 'position: absolute; z-index:20;' +
      'left:0; top:0;' +
      'width:' + bounds.width + 'px; height:' + bounds.height + 'px;');

    this.canvasInited = true;

    //return el;
  }



  handleMouseDown(e: MouseEvent) {

    if(e.button === 2) {
      return;
    }
    const img = this.image.nativeElement as HTMLImageElement;
    this.imageBounds = img.getBoundingClientRect();
    const el = this.selCanvas.nativeElement;
    this.ctx = <CanvasRenderingContext2D>(el as HTMLCanvasElement).getContext('2d');
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.offsetX = this.imageBounds.x;
    this.offsetY = this.imageBounds.y;
    this.scrollX = (el as HTMLCanvasElement).scrollLeft;
    this.scrollY = (el as HTMLCanvasElement).scrollTop;


    e.preventDefault();
    e.stopPropagation();

    // save the starting x/y of the rectangle
    this.startX = e.clientX - this.offsetX;
    this.startY = e.clientY - this.offsetY;
    this.prevWidth = 0;
    this.prevHeight = 0;

    // set a flag indicating the drag has begun
    this.isDown = true;
  }

  handleMouseUp(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.prevStartX = this.startX;
    this.prevStartY = this.startY;

    // the drag is over, clear the dragging flag
    this.isDown = false;
    //this.ctxo.strokeRect(this.prevStartX, this.prevStartY, this.prevWidth, this.prevHeight);
    const left = Math.min(this.prevStartX, this.prevStartX + this.prevWidth) / this.scale;
    const right = Math.max(this.prevStartX, this.prevStartX + this.prevWidth) / this.scale;
    const top = Math.min(this.prevStartY, this.prevStartY + this.prevHeight) / this.scale;
    const bottom = Math.max(this.prevStartY, this.prevStartY + this.prevHeight) / this.scale;
    this.selectionEvent.emit({ left, top, right, bottom, scale: this.scale });

  }

  handleMouseOut(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // the drag is over, clear the dragging flag
    this.isDown = false;
  }

  handleMouseMove(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // if we're not dragging, just return
    if (!this.isDown) {
      return;
    }

    // get the current mouse position
    let mouseX = e.clientX - this.offsetX;
    let mouseY = e.clientY - this.offsetY;

    // calculate the rectangle width/height based
    // on starting vs current mouse position
    var width = mouseX - this.startX;
    var height = mouseY - this.startY;

    // clear the canvas
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // draw a new rect from the start position 
    // to the current mouse position
    this.ctx.strokeRect(this.startX, this.startY, width, height);

    this.prevStartX = this.startX;
    this.prevStartY = this.startY;

    this.prevWidth = width;
    this.prevHeight = height;
  }

  hexToRgb(hex: string) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }


  drawSelectedAlto(value: { blocks: AltoBlock[], lines: AltoLine[], words: AltoString[] }) {
    if (!value) {
      return;
    }
    this.ctxAuto = <CanvasRenderingContext2D>(this.autoCanvas.nativeElement as HTMLCanvasElement).getContext('2d');
    this.ctxAuto.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    if (value.blocks) {
      this.drawSelectedBlocks(value.blocks);
    }
    if (value.lines) {
      this.drawSelectedLines(value.lines);
    }
    if (value.words) {
      this.drawSelectedWords(value.words);
    }
  }

  drawSelectedBlocks(blocks: AltoBlock[]) {
    this.ctxAuto.strokeStyle = this.colorBlock;
    blocks.forEach(b => {
      this.ctxAuto.strokeRect(b.HPOS * this.scale, b.VPOS * this.scale, b.WIDTH * this.scale, b.HEIGHT * this.scale);
    });

  }

  drawSelectedLines(lines: AltoLine[]) {
    this.ctxAuto.strokeStyle = this.colorLine;
    lines.forEach(b => {
      this.ctxAuto.strokeRect(b.HPOS * this.scale, b.VPOS * this.scale, b.WIDTH * this.scale, b.HEIGHT * this.scale);
    });

  }

  drawSelectedWords(words: AltoString[]) {

    this.ctxAuto.fillStyle = this.colorWord;
    words.forEach(b => {
      this.ctxAuto.fillRect(b.HPOS * this.scale, b.VPOS * this.scale, b.WIDTH * this.scale, b.HEIGHT * this.scale);
    });

  }

  setField(field: string, textBox: string, e: MouseEvent) {
    const append: boolean = e.ctrlKey;
    this.onSetField.emit({ field, textBox, append });
  }

  copyToClipboard(textBox: string) {
    this.onCopyToClipboard.emit(textBox);
  }


  zoomImg(scale: number) {
    this._imgW = this._imgW * scale;
    setTimeout(() => {
      this.getInfo();
    }, 1)
  }

  zoomImgReset() {
    this._imgW = 100;
    setTimeout(() => {
      this.getInfo();
    }, 1)
  }

  
}

