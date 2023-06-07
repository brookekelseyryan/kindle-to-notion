export interface Highlight {
  quote: string;
  note: string;
  location: string;
}

export interface Clipping {
  title: string;
  author: string;
  quote: string;
  note: string;
  location: string;
}

export interface GroupedClipping {
  title: string;
  author: string;
  highlights: Highlights[];
}

export interface Sync {
  title: string;
  author: string;
  highlightCount: number;
}
