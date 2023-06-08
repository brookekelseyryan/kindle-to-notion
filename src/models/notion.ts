require("dotenv").config();
import { NotionAdapter } from "../adapters";
import { CreatePageParams, Emoji, BlockType, Highlight, GroupedClipping } from "../interfaces";
import {
  makeHighlightsBlocks,
  updateSync,
  getUnsyncedHighlights,
  makeBlocks
} from "../utils";

 
/* Creates the page parameters */ 
async function createNewbookHighlights(title: string, author: string, bookUrl: string | undefined, highlights: Highlight[],  totalHighlights : number , notionInstance: NotionAdapter) {
    if (bookUrl && bookUrl !== "") {
        const createPageParams: CreatePageParams = {
            // parentDatabaseId: process.env.BOOK_DB_ID as string,
            parentDatabaseId: "fb0edc221b2c40bf9cf634bffaec168c",
            properties: {
                title: title,
                author: author,
                bookName: title,
                highlights: totalHighlights
            },
            children: makeHighlightsBlocks(highlights, BlockType.paragraph, title),
            cover: bookUrl.replace("http://", "https://")
        }
        await notionInstance.createPage(createPageParams);
    } else {
        const createPageParams: CreatePageParams = {
            //parentDatabaseId: process.env.BOOK_DB_ID as string,
            parentDatabaseId: "fb0edc221b2c40bf9cf634bffaec168c",
            properties: {
                title: title,
                author: author,
                bookName: title,
                highlights: totalHighlights
            },
            children: makeHighlightsBlocks(highlights, BlockType.paragraph, title),
            icon: Emoji["📘"],
        }
        await notionInstance.createPage(createPageParams);
    }
}

export class Notion {
  private notion;

  constructor() {
    this.notion = new NotionAdapter();
  }

  /* Method to get Notion block id of the Notion page given the book name */
  getIdFromBookName = async (bookName: string) => {
    const response = await this.notion.queryDatabase({
      //database_id: process.env.BOOK_DB_ID as string,
      database_id: "fb0edc221b2c40bf9cf634bffaec168c",
      filter: {
        or: [
          {
            property: "Book Name",
            rich_text: {
              contains: bookName,
            },
          },
        ],
      },
    });
    const [book] = response.results;
    if (book) {
      return book.id;
    } else {
      return null;
    }
  };

  countQuotesAndNotes(groupedClipping: GroupedClipping): number {
    let quoteCount = 0;
    let noteCount = 0;
  
    for (const highlight of groupedClipping.highlights) {
      if (highlight.quote) {
        quoteCount++;
      }
      if (highlight.note) {
        noteCount++;
      }
    }
    return quoteCount*2 + noteCount ;
  }

  /* Method to sync highlights to notion */
  syncHighlights = async (books: GroupedClipping[]) => {

    try {
      // get unsynced highlights from each book
      const unsyncedBooks = getUnsyncedHighlights(books);
      // if unsynced books are present
      if (unsyncedBooks.length > 0) {
        console.log("\n🚀 Syncing highlights to Notion");
        for (const book of unsyncedBooks) {
          console.log(`\n🔁 Syncing book: ${book.title}`);
          const bookId = await this.getIdFromBookName(book.title);
          // if the book is already present in Notion
          if (bookId) {
            console.log(`📚 Book already present, appending highlights`);

            // append unsynced highlights at the end of the page
            const block_length = this.countQuotesAndNotes(book);
            console.log(`📄 Page will have ${block_length} blocks`);

            if(block_length <= 100) {
              await this.notion.appendBlockChildren(
                bookId,
                makeBlocks(book.highlights, BlockType.paragraph)
              );
            } else {
              // handle pagination if there are more than 100 blocks
              let highlightsTracker = 0;
              while(highlightsTracker < block_length) {
                await this.notion.appendBlockChildren(
                  bookId,
                  makeBlocks(book.highlights.slice(highlightsTracker, highlightsTracker+30), BlockType.paragraph)
                );
                highlightsTracker+=30;
              }
            }
            
          } else {
            console.log(`📚 Book not present, creating notion page`);
    
            const block_length = this.countQuotesAndNotes(book);
            console.log(`📄 Page will have ${block_length} blocks`);

            if(block_length <= 100) {
              await createNewbookHighlights(book.title, book.author, book.bookCoverUrl, book.highlights, book.highlights.length, this.notion);
            } else {
              // handle pagination if there are more than 100 blocks
              console.log(`😱 Pagination due to ${block_length} blocks being added`);
              let highlightsTracker = 0;

              while(highlightsTracker < block_length) {
                if(highlightsTracker == 0) {
                  // create a new page for the first 100 blocks
                  await createNewbookHighlights(book.title, book.author, book.bookCoverUrl, book.highlights.slice(highlightsTracker, highlightsTracker+30), book.highlights.length, this.notion);
                  highlightsTracker += 30;
                } else {
                  // insert the remaining highlights by paginations
                  let newBookId = await this.getIdFromBookName(book.title);
                  if(newBookId) {
                    await this.notion.appendBlockChildren(
                      newBookId, 
                      makeBlocks(book.highlights.slice(highlightsTracker, highlightsTracker+30), BlockType.paragraph)
                    );
                    highlightsTracker += 30;
                  }
                }
              }
            }
          }
            
          // after each book is successfully synced, update the sync metadata (cache)
          updateSync(book);
        }
        console.log("\n✅ Successfully synced highlights to Notion");
      } else {
        console.log("🟢 Every book is already synced!");
      }
    } catch (error: unknown) {
      console.error("❌ Failed to sync highlights", error);
      throw error;
    } finally {
      console.log("--------------------------------------");
    }
  };
}
