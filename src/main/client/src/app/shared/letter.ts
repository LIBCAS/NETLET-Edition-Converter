import { AltoBlock } from "./alto";
import { FileTemplate } from "./file-config";

export class LetterCopy {
    [key: string]: any;
    ms_manifestation: string;
    type: string;
    preservation: string;
    copy: string;
    manifestation_notes: string;
    l_number: null;
    repository: string;
    archive: string;
    collection: string;
    signature: string;
    location_note: string

    
    // copies_repository: string;
    // copies_archive: string;
    // copies_collection: string;
    // copies_signature: string;
    // copies_type: string;
    // copies_preservation: string;
    // copies_copy: string;
}

export interface RelatedResources {
    title: string,
    link: string
}

export interface AutorMeta {
    id: number,
    marked: string,
    salutation: string
}

export interface AutorDb{ 
    id: string, 
    tenant: string, 
    name: string 
}

export class PlaceMeta {
    id: number;
    type: string;
    marked: string
}

export interface Entity {
    id: string, key_cze: string, key_eng: string, dict: string,
    table: string, table_id: string, type: string, tenant: string,
    selected: boolean
};

export interface NameTag { pos: number[], text: string, type: string, selected: boolean };

export class Letter {
    [key: string]: any;
    id: string;
    startPage: number;
    endPage: number;
    date: string;
    letter_number: string;
    letter_title: string;
    page_number: number;
    end_page_number: number;
    salutation: string;
    signature: string;
    sign_off: string;

    authors_meta: AutorMeta[];
    l_author: number;
    author: string; // Podpis - Jméno použité v dopise
    recipient: string; // Oslovení
    authors_db: AutorDb[] = [];
    recipients_db: AutorDb[] = [];
    author_db: AutorDb;
    recipient_db: AutorDb;


    places_meta: PlaceMeta[];
    origin: string; // Místo odeslání


    full_text: string;
    entities: Entity[];
    nametags: NameTag[];

    created_at: Date;
    updated_at: Date;
    date_year: number;
    date_month: number;
    date_day: number;
    date_marked: string;
    date_uncertain: boolean;
    date_approximate: boolean;
    date_inferred: boolean;
    date_is_range: boolean;
    date_note: string;
    range_year: null;
    range_month: null;
    range_day: null;
    author_inferred: boolean;
    author_uncertain: boolean;
    author_note: string;
    recipient_inferred: boolean;
    recipient_uncertain: boolean;
    recipient_notes: string;
    dest_inferred: boolean;
    dest_uncertain: boolean;
    dest_note: string;
    origin_inferred: boolean;
    origin_uncertain: boolean;
    origin_note: string;
    people_mentioned: number;
    people_mentioned_notes: string;

    copies: LetterCopy[] = [];
    copies_repository: string;
    copies_archive: string;
    copies_collection: string;
    copies_signature: string;
    copies_type: string;
    copies_preservation: string;
    copies_copy: string;

    related_resources: RelatedResources[];
    abstract_en: string;
    abstract_cs: string;
    summary: string;
    explicit: string;
    incipit: string;
    history: string;
    copyright: null;
    languages: string;
    notes_private: string;
    notes_public: string;
    status: string;
    keywords: number[];



    template: FileTemplate;
    analysis: any;
    selection: { page: number, selection?: DOMRect[], blocks?: AltoBlock[], text?: string }[];
}
