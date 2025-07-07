import { AltoBlock, AltoLine, AltoString } from "./alto";
import { AutorDb, Letter, PlaceMeta } from "./letter";

export interface Sort { label: string; field: string; dir: string; entity?: string[] };

export interface AltoSelection { blocks: AltoBlock[], lines: AltoLine[], words: AltoString[] };

export interface SearchParams { filename: string, page: number, selection: AltoSelection, onlyBox: boolean, twoCols: boolean };

export class FileTemplate {
  name: string; 
  // def_author: string; 
  author: string;
  author_db: { id: number; marked: string };
  recipient: string; 
  recipient_db: { id: number; marked: string };
  copies_repository: string; 
  copies_archive: string; 
  copies_collection: string;
  notes_private: string;

  public static newTemplateFromLetter(letter: Letter): FileTemplate {
    const t: FileTemplate = new FileTemplate();
    t.name = 'Šablona z dopisu ' + (letter.hiko.id);
    t.notes_private = letter.hiko.notes_private;
    t.author = letter.hiko.authors[0].marked;
    t.author_db = letter.hiko.authors[0];
    t.recipient = letter.hiko.recipients[0].marked;
    t.recipient_db = letter.hiko.recipients[0];

    t.copies_archive = letter.hiko.copies[0].archive;
    t.copies_collection = letter.hiko.copies[0].collection;
    t.copies_repository = letter.hiko.copies[0].repository;
    return t;
  }
};

export class FileConfig {
  name: string;
  columns: number;
  replacements: { orig: string, dest: string }[];
  searchParams: SearchParams;
  ignored: { [id: string]: boolean };
  tenant: string;
  prompt: string;
  gptModel: string;
  templates: FileTemplate[];
}
