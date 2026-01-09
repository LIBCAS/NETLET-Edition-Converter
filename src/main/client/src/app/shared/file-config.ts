import { AltoBlock, AltoLine, AltoString } from "./alto";
import { AutorDb, CopyHIKO, Letter, PlaceMeta } from "./letter";

export interface Sort { label: string; field: string; dir: string; entity?: string[] };

export interface AltoSelection { blocks: AltoBlock[], lines: AltoLine[], words: AltoString[] };

export interface SearchParams { filename: string, page: number, selection: AltoSelection, onlyBox: boolean, twoCols: boolean };

export class FileTemplate {
  name: string;
  // def_author: string; 

  authors: { id: number; marked?: string; name?: string }[] = [];
  recipients: { id: number; marked?: string; salutation?: string; name?: string }[] = [];

  // author_marked: string;
  // author_db: { id: number; marked?: string, name?: string } = {id: -1, marked: null, name: null};
  // recipient_marked: string;
  // recipient_db: { id: number; marked?: string, name?: string, salutation?: string } ={id: -1, marked: null, name: null, salutation: null};


  origin_marked: string;
  origin_db: { id: number; marked?: string; name?: string } = {id: -1, name: null};

  destination_marked: string;
  destination_db: { id: number; marked?: string; name?: string } = {id: -1, name: null};

  keywords: { id: number; name: string }[] = [];
  mentioned: { id: number; name: string }[] = [];
  people_mentioned_note: string;

  languages: string[] = [];

  copies: CopyHIKO[] = [];
  
    // preservation: string;
    // type: string;
    // copy: string;
    // manifestation_notes: string;
    // l_number: string;
    // repository: string;
    // archive: string;
    // collection: string;
    // ms_manifestation: string;
    // signature: string;
    // location_note: string;


  notes_private: string;
  salutation: string;

  copyright: string;

  related_resources: { title: string; link: string }[] = [];

  public static newTemplateFromLetter(letter: Letter): FileTemplate {
    const t: FileTemplate = new FileTemplate();
    t.name = 'Šablona z dopisu ' + (letter.id);
    t.notes_private = letter.hiko.notes_private;
    if (letter.hiko.authors) {
      t.authors = [...letter.hiko.authors];
    }
    if (letter.hiko.recipients) {
      t.recipients = [...letter.hiko.recipients];
    }

    if (letter.origins) {
      t.origin_marked = letter.origins[0].marked;
      t.origin_db = letter.origins[0];
    }

    if (letter.hiko.copies) {
        t.copies =  [...letter.hiko.copies];
    }

    if (letter.hiko.related_resources) {
        t.related_resources =  [...letter.hiko.related_resources];
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
