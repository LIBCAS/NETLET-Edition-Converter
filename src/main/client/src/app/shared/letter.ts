import { AltoBlock } from "./alto";
import { FileTemplate } from "./file-config";

export class LetterCopy {
    [key: string]: any;
    ms_manifestation: string;
    type: string;
    preservation: string;
    copy: string;
    manifestation_notes: string;
    l_number: string;
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

export interface AutorDb {
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

export class LetterOld {
    [key: string]: any;
    id: string;

    // hiko fields
    hiko_id: number;
    tenant: string;

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


export class KeywordHIKO {
    keyword_category_id: number;
    updated_at: Date;
    name: {
        cs: string;
        en: string;
    };
    created_at: Date;
    pivot: {
        keyword_id: number;
        letter_id: number
    };
    id: number
}

export class CopyHIKO {
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
}

export class UserHIKO {
    role: string;
    updated_at: Date;
    deactivated_at: Date;
    name: string;
    created_at: Date;
    email_verified_at: Date;
    id: number;
    email: string;
}


export class MediaHIKO {
    id: number;
    model_type: string;
    model_id: number;
    collection_name: string;
    name: string;
    file_name: string;
    mime_type: string;
    disk: string;
    size: number;
    manipulations: string;
    custom_properties: string;
    generated_conversions: string;
    responsive_images: string;
    order_column: number;
    created_at: Date;
    updated_at: Date;
}

export class LetterHIKO {
    id: number;
    uuid: string;
    created_at: Date;
    updated_at: Date;

    date: string;
    date_computed: string;
    date_year: number;
    date_month: number;
    date_day: number;
    date_is_range: boolean;
    date_marked: string;
    range_day: number;
    range_month: number;
    range_year: number;
    date_inferred: boolean;
    date_uncertain: boolean;
    date_note: string;
    date_approximate: boolean;

    authors: { id: number; marked?: string; name?: string }[] = [];
    author_uncertain: boolean;
    author_inferred: boolean;
    author_note: string;

    recipients: { id: number; marked?: string; salutation?: string; name?: string }[] = [];
    recipient_uncertain: boolean;
    recipient_inferred: boolean;
    recipient_note: string;

    mentioned: string[];
    people_mentioned_note: string;

    origins: { id: number; marked?: string; name?: string }[] = [];
    origin_inferred: boolean;
    origin_uncertain: boolean;
    origin_note: string;

    destinations: { id: number; marked?: string; name?: string }[] = [];
    destination_inferred: boolean;
    destination_uncertain: boolean;
    destination_note: string;

    languages: string[];

    // Jen string? Nesparovat s keywords v db?
    local_keywords: string[];
    global_keywords: string[];
    keywords: KeywordHIKO[];

    incipit: string;
    explicit: string;
    notes_private: string;
    notes_public: string;
    related_resources: { title: string; link: string }[];
    copies: CopyHIKO[] = [];
    copyright: string;


    status: string; // mui byt draft?
    approval: string;
    action: string; // musi byt edit? ne create?

    // Jak spravn
    abstract: {
        cs: string;
        en: string;
    } = {cs: '', en: ''}

    // Pridat ??
    content: string;
    content_stripped: string;

}

export class Letter  {

    [key: string]: any;
    id: string;
    file_id: string;
    filename: string;
    tenant: string;

    // hiko fields
    hiko_id: number;

    startPage: number;
    endPage: number;
    letter_number: string;
    letter_title: string;
    page_number: number;
    end_page_number: number;

    // As detected by AI
    date: string;
    author: string;
    recipient: string;
    origin: string;
    destination: string;
    salutation: string;
    signature: string;
    sign_off: string;

    entities: Entity[];
    nametags: NameTag[];

    ai: {
        date: Date;
        analysis: any;
    }[]

    selection: { page: number, selection?: DOMRect[], blocks?: AltoBlock[], text?: string }[];
    hiko: LetterHIKO = new LetterHIKO();
    template: FileTemplate;
}