import { AltoBlock, AltoLine, AltoString } from "./alto";
import { AutorDb, Letter, PlaceMeta } from "./letter";

export interface Sort { label: string; field: string; dir: string; entity?: string[] };

export interface AltoSelection { blocks: AltoBlock[], lines: AltoLine[], words: AltoString[] };

export interface SearchParams { filename: string, page: number, selection: AltoSelection, onlyBox: boolean, twoCols: boolean };

export class FileTemplate {
  name: string;
  // def_author: string; 
  author: string;
  author_db: { id: number; marked: string } = {id: -1, marked: null};
  recipient: string;
  recipient_db: { id: number; marked: string, salutation?: string } ={id: -1, marked: null, salutation: null};


  origin: string;
  origin_db: { id: number; marked: string } = {id: -1, marked: null};

  destination: string;
  destination_db: { id: number; marked: string } = {id: -1, marked: null};

  languages: string;
  
  
  // copies_repository: string;
  // copies_archive: string;
  // copies_collection: string;

  
    preservation: string;
    type: string;
    copy: string;
    manifestation_notes: string;
    l_number: string;
    repository: string;
    archive: string;
    collection: string;
    ms_manifestation: string;
    signature: string;
    location_note: string;


  notes_private: string;
  salutation: string;

  public static newTemplateFromLetter(letter: Letter): FileTemplate {
    const t: FileTemplate = new FileTemplate();
    t.name = 'Šablona z dopisu ' + (letter.id);
    t.notes_private = letter.hiko.notes_private;
    if (letter.hiko.authors) {
      t.author = letter.hiko.authors[0].marked;
      t.author_db = letter.hiko.authors[0];
    }
    if (letter.hiko.recipients) {
      t.recipient = letter.hiko.recipients[0].marked;
      t.recipient_db = letter.hiko.recipients[0];
    }

    if (letter.hiko.origins) {
      t.origin = letter.hiko.origins[0].marked;
      t.origin_db = letter.hiko.origins[0];
    }

    if (letter.hiko.copies) {


          t.preservation = letter.hiko.copies[0].preservation;
          t.type = letter.hiko.copies[0].type;
          t.copy = letter.hiko.copies[0].copy;
          t.manifestation_notes = letter.hiko.copies[0].manifestation_notes;
          t.l_number = letter.hiko.copies[0].l_number;
          t.repository = letter.hiko.copies[0].repository;
          t.archive = letter.hiko.copies[0].archive;
          t.collection = letter.hiko.copies[0].collection;
          t.ms_manifestation = letter.hiko.copies[0].ms_manifestation;
          t.signature = letter.hiko.copies[0].signature;
          t.location_note = letter.hiko.copies[0].location_note;


    }
    return t;
  }
};

export class FileConfig {
  name: string;
  columns: number;
  replacements: { orig: string, dest: string }[];
  searchParams: SearchParams;
  ignored: { [id: string]: boolean };
  // tenant: string;
  prompt: string;
  gptModel: string;
  templates: FileTemplate[];
}
