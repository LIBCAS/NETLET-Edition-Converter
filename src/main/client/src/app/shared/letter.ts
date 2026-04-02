import { AltoBlock } from './alto';
import { FileTemplate } from './file-config';


export interface LetterSelection{ page: number; selection?: DOMRect[]; blocks?: AltoBlock[]; text?: string }


export interface NameTag { pos: number[]; text: string; type: string; selected: boolean };

export interface PlaceHIKO {
  id: number;
  scope: string; 
  reference?: string; 
  name: string;

  marked?: string;
  salutation?: string;

  country?: string;
  division?: string;
  note?: string;
  latitude?: number;
  longitude?: number;
  geoname_id?: number;
  alternative_names?: string[];
}

export interface Place extends PlaceHIKO {
  tenant?: string
}

export interface IdentityHIKO {
  id: number;
  scope: string; 
  reference?: string; 
  marked?: string;
  name?: string;
  salutation?: string
};

export interface Identity extends IdentityHIKO {
  table_id?: string;
  name_en?: string;
  tenant?: string;
  nationality?: string;
  gender?: string;
  birth_year?: string;
  death_year?: string;
  selected?: boolean
};

export interface KeywordHIKO {
  id: string;
  scope: string; 
  reference: string; 
  marked: string;
  name_cs: string;
  name_en: string;
  type: string;
};

export interface Keyword extends KeywordHIKO {
  table_id: string;
  tenant: string;
  name?: string;
  selected?: boolean
};

export class CopyHIKO {
    id: number;
    repository: {
      id: number;
      scope: string;
      reference: string;
      value: string;
      label: string;
    }
    archive: {
      id: number;
      scope: string;
      reference: string;
      value: string;
      label: string;
    }
    collection: {
      id: number;
      scope: string;
      reference: string;
      value: string;
      label: string;
    }
    copy: string;
    l_number: string;
    location_note: string;
    manifestation_notes: string;
    ms_manifestation: string;
    preservation: string;
    signature: string;
    type: string;
  };

export class LetterHIKO {

    [key: string]: any;
  dates: {
    date: string; // "?",
    date_range: string; // "",
    date_marked: string; // "0",
    date_uncertain: number; // 1,
    date_approximate: number; // 0,
    date_inferred: number; // 0,
    date_note: string;
  };

  date_year: number;
  date_month: number;
  date_day: number;
  date_marked: string;
  date_uncertain: boolean;
  date_approximate: boolean;
  date_inferred: boolean;
  date_is_range: boolean;
  range_year: number;
  range_month: number;
  range_day: number;
  date_note: string;
  author_uncertain: boolean;
  author_inferred: boolean;
  author_note: string;
  recipient_uncertain: boolean;
  recipient_inferred: boolean;
  recipient_note: string;
  destination_uncertain: boolean;
  destination_inferred: boolean;
  destination_note: string;
  origin_uncertain: boolean;
  origin_inferred: boolean;
  origin_note: string;
  people_mentioned_note: string;
  authors: IdentityHIKO[];
  recipients: IdentityHIKO[];
  mentioned: IdentityHIKO[];
  origins: PlaceHIKO[];
  destinations: PlaceHIKO[];
  keywords: KeywordHIKO[];
  abstract: {
    cs: string;
    en: string
  };
  languages: string;
  incipit: string;
  explicit: string;
  notes_private: string;
  notes_public: string;
  copyright: string;
  content: string;
  status: string;
  approval: number;
  related_resources: {
    title: string;
    link: string
  }[];
  copies: CopyHIKO[]
}

export class Letter {

  [key: string]: any;
  id: string;
  file_id: string;
  filename: string;
  tenant: string;

  // hiko fields
  hiko_id: number;
  exported_to_hiko: boolean;
  hiko: LetterHIKO;

  startPage: number;
  endPage: number;
  letter_number: string;
  letter_title: string;
  page_number: number;
  end_page_number: number;


  // As detected by AI
  date: string;
  origin: string;
  origins: Place[] = [];

  destination: string;
  destinations: Place[] = [];
  salutation: string;
  signature: string;
  sign_off: string;

  detected_keywords: Keyword[] = [];
  user_keywords: Keyword[] = [];
  nametags: NameTag[];


  detected_mentioned: Identity[] = [];
  user_mentioned: Identity[] = [];

  ai: {
    date: Date;
    analysis: any;
  }[];

  selection: LetterSelection[];

  template: FileTemplate;
}