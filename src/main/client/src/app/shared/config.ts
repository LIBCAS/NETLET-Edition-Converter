
export interface Sort { label: string; field: string; dir: string; entity?: string[]};

export class Configuration {
  context: string;
  defaultLang: string;
  hikoUrl: string;
  isTest: boolean;
  test_mappings: {[tenant: string]: string};
}
