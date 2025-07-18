import { Injectable } from "@angular/core";
import { AltoBlock, AltoLine, AltoString } from "./shared/alto";
import { FileConfig, AltoSelection } from "./shared/file-config";
import { User } from "./shared/user";

@Injectable({
  providedIn: 'root'
}) export class AppState {

    public user: User;
  alto: any;
  tenants: string[] = [];
  files: { filename: string, file_id: string, config: FileConfig, imgs: number, txt: number, alto: number, letters: number }[] = [];
  selectedFile: { filename: string, file_id: string, config: FileConfig, imgs: number, txt: number, alto: number, letters: number };
  fileConfig: FileConfig;
  gptModels: string[];
  currentPage: number = 100;
  numPages: number;
  selection: DOMRect;
  selectedText: string;
  selectedBlocks: AltoBlock[] = [];
  selectedLines: AltoLine[] = [];
  selectedWords: AltoString[] = [];
  selectedAlto: AltoSelection;

  fields: string[] = ['author', 'recipient', 'date_year', 'origin', 'incipit', 'explicit', 'full_text'];
  copyFields: string[] = ['copies_repository', 'copies_archive', 'copies_collection', 'copies_signature'];

  clearSelection() {
    this.selectedBlocks = [];
    this.selectedLines = [];
    this.selectedWords = [];
    this.selectedAlto = { blocks: [], lines: [], words: [] };
  }

  addIdx() {
    const tBlocks: AltoBlock[] = this.alto.Layout.Page.PrintSpace.TextBlock;
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

  getSelectedWordsText(): string {
    let ret = '';
    this.selectedWords.forEach((s: AltoString) => {
      ret += s.CONTENT + ' ';
    });
    return ret.trim();
  }

  getSelectedLinesText(): string {
    let ret = '';
    this.selectedLines.forEach((s: AltoLine) => {
      ret += this.getLineText(s) + '\n';
    });
    return ret.trim();
  }

  getLineText(line: AltoLine): string {
    let ret = '';
    line.String.forEach((s: AltoString) => {
      ret += s.CONTENT + ' ';
    });
    return ret.trim();
  }

  getBlockText(selectedBlocks: AltoBlock[]): string {
    let ret = '-';
    const half = this.alto.Layout.Page.PrintSpace.WIDTH / this.fileConfig.columns;
    // console.log(half)
    // sort selected blocks
    selectedBlocks.sort((a, b) => {
      if (a.HPOS <= half && b.HPOS > half) {
        // console.log(a.ID + ' - ' + b.ID)
        return -1;
      } else if (b.HPOS <= half && a.HPOS > half) {
        return 1;
      } else {
        return a.VPOS - b.VPOS;
      }
    });



    selectedBlocks.forEach((s: AltoBlock) => {
      if (s.TextLine) {
        s.TextLine.forEach((s: AltoLine) => {
          // join lines on '-' splitter        
          if (ret.endsWith('-')) {
            ret = ret.slice(0, -1);
            ret += this.getLineText(s);
          } else {
            ret += '\n' + this.getLineText(s);
          }

        });
        ret += '\n';
      }
    });
    return ret;
  }

  getBlocksFromSelection(t: DOMRect): AltoBlock[] {
    const tBlocks: AltoBlock[] = this.alto.Layout.Page.PrintSpace.TextBlock;
    const selectedBlocks = tBlocks.filter((tb: AltoBlock) => {
      return this.intersectRect(t, DOMRect.fromRect({ x: tb.HPOS, y: tb.VPOS, width: tb.WIDTH, height: tb.HEIGHT }))
    });
    return selectedBlocks;
  }

  intersectRect(r1: DOMRect, r2: DOMRect) {
    return !(r2.left >= r1.right ||
      r2.right <= r1.left ||
      r2.top >= r1.bottom ||
      r2.bottom <= r1.top);
  }

}