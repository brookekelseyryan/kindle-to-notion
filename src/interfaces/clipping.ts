export interface Clipping {
  title: string;
  author: string;
  highlight: string;
  note: string;
}

export interface GroupedClipping {
  title: string;
  author: string;
  highlights: string[];
  notes: string[];
}

export interface Sync {
  title: string;
  author: string;
  highlightCount: number;
}
