import { AltoBlock, AltoLine, AltoString } from "./alto";
import { Letter } from "./letter";

export interface Sort { label: string; field: string; dir: string; entity?: string[] };

export interface AltoSelection { blocks: AltoBlock[], lines: AltoLine[], words: AltoString[] };

export interface SearchParams { filename: string, page: number, selection: AltoSelection, onlyBox: boolean, twoCols: boolean };

export class FileTemplate {
  name: string; def_author: string; def_recipient: string; copies_repository: string; copies_archive: string; copies_collection: string;
  public static newTemplateFromLetter(letter: Letter): FileTemplate {
    const t: FileTemplate = new FileTemplate();
    t.name = 'Šablona z dopisu ' + (letter.id);
    t.def_author = letter.author_db?.name;
    t.def_recipient = letter.recipient_db?.name;
    t.copies_archive = letter.copies[0].archive;
    t.copies_collection = letter.copies[0].collection;
    t.copies_repository = letter.copies[0].repository;
    return t;
  }
};

export class FileConfig {
  name: string;
  columns: number;
  def_author: string;
  def_recipient: string;
  replacements: { orig: string, dest: string }[];
  searchParams: SearchParams;
  ignored: { [id: string]: boolean };
  tenant: string;
  prompt: string;
  gptModel: string;
  templates: FileTemplate[];
}
