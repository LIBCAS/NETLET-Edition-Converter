import { Injectable } from "@angular/core";
import { AltoBlock, AltoLine, AltoString } from "./shared/alto";
import { FileConfig, AltoSelection } from "./shared/file-config";

@Injectable({
  providedIn: 'root'
}) export class AppState {

  alto: any;
  tenants: string[];
  files: {filename: string, file_id: string, config: FileConfig, imgs: number, txt: number, alto: number, letters: number}[] = [];
  selectedFile: {filename: string, file_id: string, config: FileConfig, imgs: number, txt: number, alto: number, letters: number};
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

  getBlockText(): string {
    let ret = '-';
    const half = this.alto.Layout.Page.PrintSpace.WIDTH / this.fileConfig.columns;
    // console.log(half)
    // sort selected blocks
    this.selectedBlocks.sort((a, b) => {
      if (a.HPOS <= half && b.HPOS > half) {
        // console.log(a.ID + ' - ' + b.ID)
        return -1;
      } else if (b.HPOS <= half && a.HPOS > half) {
        return 1;
      } else {
        return a.VPOS - b.VPOS;
      }
    });



    this.selectedBlocks.forEach((s: AltoBlock) => {
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

}