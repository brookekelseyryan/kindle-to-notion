import { Block, BlockType, CreatePageProperties, Highlight } from "../interfaces";

/* Truncate the highlight to a maximum length of 2000 character due to Notion API limitation */
function truncateQuoteIfNeeded(quote: string, location: string): string {
  const highlightContent = `${quote} (Location ${location})`;

  if (highlightContent.length > 2000) {
    const maxLength = 2000 - `(Location ${location})`.length;
    const truncatedQuote = quote.substring(0, maxLength-1).trim();
    return `${truncatedQuote} (Location ${location})`;
  }

  return highlightContent;
};

/* Returns a formatted note block. */
export const formatNoteBlock = (note: string, type: BlockType): any => {
  const block: Block = {
    object: "block",
    type: type,
    paragraph: {
      rich_text: [
        {
          type: "text",
          text: {
            content: "Note: ",
            link: null,
          },
          annotations: {
            bold: true
          }
        },
        {
          type: "text",
          text: {
            content: note,
            link: null,
          },
        },
      ],
    }
  };
  return block;
}

/* Returns a formatted highlight block, with the quote and location. */ 
export const formatHighlightBlock = (quote: string, location: string, type: BlockType): any => {
  const highlight_content = truncateQuoteIfNeeded(quote, location);
  const block: Block = {
    object: "block",
    type: type,
    paragraph: {
      rich_text: [
        {
          type: "text",
          text: {
            content: highlight_content,
            link: null,
          },
        },
      ],
    }
  };
  return block;
};

/* Function to make an array of Notion blocks given the array of highlights and the block type
   Used when appending highlights to an existing Notion page for the book */
export const makeBlocks = (highlights: Highlight[], type: BlockType): Block[] => {
  const blocks: Block[] = [];
  for (const highlight of highlights) {
    const { quote , note, location } = highlight;
    
    // add the first block 
    const block1 = formatHighlightBlock(quote, location, type);
    blocks.push(block1);

    // add the second block if note exists
    if (note) {
      const block2 = formatNoteBlock(note, type);
      blocks.push(block2);
    }

    // adds a blank block 
    const block: Block = {
      object: "block",
      type: type,
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: {
              content: "",
              link: null,
            },
          },
        ],
      }
    };
    blocks.push(block);
  }
  return blocks;
};

/* Function to make an array of Notion blocks with a title: "Highlights". 
   Used when creating a new Notion page for the book*/
export const makeHighlightsBlocks = (
  highlights: Highlight[],
  type: BlockType,
  title: string
): Block[] => {
  console.log(`📝 Adding highlights to ${title}...`);
  const blocks : Block[] = [
    ...makeBlocks(highlights, type),
  ];
  return blocks
};

/* Function to generate the configuration required to create a new Notion page */
export const makePageProperties = (
  pageProperties: CreatePageProperties
): Record<string, unknown> => {
  const properties = {
    Title: {
      title: [
        {
          text: {
            content: pageProperties.title,
          },
        },
      ],
    },
    Author: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: {
            content: pageProperties.author,
          },
        },
      ],
    },
    "Book Name": {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: {
            content: pageProperties.bookName,
          },
        },
      ],
    },
    "Highlights" : {
      type: "number",
      number: pageProperties.highlights
    }
  };
  return properties;
};
