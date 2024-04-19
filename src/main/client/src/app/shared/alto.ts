export interface AltoSP {
  HPOS: number,
  VPOS: number,
  WIDTH: number
}

export interface AltoString {
  HPOS: number,
  VPOS: number,
  WIDTH: number,
  HEIGHT: number,
  WC: number,
  CONTENT: string,
  idx: number
}

export interface AltoLine {
  HPOS: number,
  VPOS: number,
  WIDTH: number,
  HEIGHT: number,
  BASELINE: number,
  SP: AltoSP[],
  String: AltoString[],
  idx: number
}


export interface AltoBlock {
  HPOS: number,
  VPOS: number,
  WIDTH: number,
  HEIGHT: number,
  ID: string,
  TextLine: AltoLine[]
}

