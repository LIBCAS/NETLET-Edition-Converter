export interface LetterCopy {
    ms_manifestation: string,
    type: string,
    preservation: string,
    copy: string,
    manifestation_notes: string,
    l_number: null,
    repository: string,
    archive: string,
    collection: string,
    signature: string,
    location_note: null
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

export interface PlaceMeta {
    id: number,
    type: string,
    marked: string
}

export interface Entity { 
    id: string, key_cze: string, key_eng: string, dict: string, 
    table: string, table_id: string, type: string, tenant: string,
    selected: boolean };

    export interface NameTag { pos: number[], text: string, type: string, selected: boolean };

export class Letter {
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

    l_author: number;
    author: string;
    recipient: string;
    authors_db: {id: string, tenant: string, name: string}[] = [];
    recipients_db: {id: string, tenant: string, name: string}[] = [];
    author_db: {id: string, tenant: string, name: string};
    recipient_db: {id: string, tenant: string, name: string};
    origin: string;
    full_text: string;
    entities: Entity[];
    nametags: NameTag[];

    [key: string]: any;
    created_at: Date;
    updated_at: Date;
    date_year: number;
    date_month: number;
    date_day: number;
    date_marked: boolean;
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
    copies: LetterCopy[];
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


    authors_meta: AutorMeta[];
    places_meta: PlaceMeta[];
    usage: any;
    analysis: any;
}