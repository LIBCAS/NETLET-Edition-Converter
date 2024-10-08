import { AltoBlock, AltoLine, AltoString } from "./alto";

export interface Sort { label: string; field: string; dir: string; entity?: string[]};

export interface AltoSelection { blocks: AltoBlock[], lines: AltoLine[], words: AltoString[] };

export interface SearchParams { filename: string, page: number, selection: AltoSelection, onlyBox: boolean, twoCols: boolean };

export class FileTemplate { name: string; def_author: string; def_recipient: string; copies_repository: string; copies_archive: string; copies_collection: string};

export class FileConfig {
  name: string;
  columns: number;
  def_author: string;
  def_recipient: string;
  replacements: {orig: string, dest: string}[];
  searchParams: SearchParams;
  ignored: { [id: string]: boolean };
  tenant: string;
  prompt: string;
  gptModel: string;
  templates: FileTemplate[];
}
