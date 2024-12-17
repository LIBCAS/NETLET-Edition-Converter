import { AltoBlock, AltoLine, AltoString } from "./alto";
import { AutorDb, Letter, PlaceMeta } from "./letter";

export interface Sort { label: string; field: string; dir: string; entity?: string[] };

export interface AltoSelection { blocks: AltoBlock[], lines: AltoLine[], words: AltoString[] };

export interface SearchParams { filename: string, page: number, selection: AltoSelection, onlyBox: boolean, twoCols: boolean };

export class FileTemplate {
  name: string; 
  // def_author: string; 
  author: string;
  author_db: AutorDb;
  recipient: string; 
  recipient_db: AutorDb;
  place_meta: PlaceMeta;
  copies_repository: string; 
  copies_archive: string; 
  copies_collection: string;

  public static newTemplateFromLetter(letter: Letter): FileTemplate {
    const t: FileTemplate = new FileTemplate();
    t.name = 'Šablona z dopisu ' + (letter.id);
    t.author = letter.author;
    t.author_db = letter.author_db;
    t.recipient = letter.recipient;
    t.recipient_db = letter.recipient_db;
    t.place_meta = letter.places_meta[0];

    t.copies_archive = letter.copies[0].archive;
    t.copies_collection = letter.copies[0].collection;
    t.copies_repository = letter.copies[0].repository;
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
