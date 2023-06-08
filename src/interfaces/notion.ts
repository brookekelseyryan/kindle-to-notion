export interface Paragraph {
  rich_text: RichText[];
}

export interface RichText {
  type: string;
  text: TextContent;
  annotations?: Partial<Annotations>;
  plain_text?: string;
  href?: null | string;
}

interface Annotations {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
}

export interface TextContent {
  content: string;
  link: string | null;
}

export interface Block {
  object: "block";
  type: BlockType;
  paragraph?: Paragraph;
}

export enum BlockType {
  quote = "quote",
  heading_1 = "heading_1",
  heading_2 = "heading_2",
  heading_3 = "heading_3",
  paragraph = "paragraph",
}

export enum Emoji {
  "📖" = "📖",
  "📚" = "📚",
  "🔖" = "🔖",
  "📘" = "📘"
}

export interface CreatePageProperties {
  title: string;
  author: string;
  bookName: string;
  highlights?: number;
}

export interface CreatePageParams {
  parentDatabaseId: string;
  properties: CreatePageProperties;
  children: Block[];
  icon?: Emoji;
  cover?: string;
}
