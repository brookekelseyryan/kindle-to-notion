import path from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { GroupedClipping, Sync, Clipping } from "../interfaces";
import _ from "lodash";



export const getIndexMostRecentlyAddedClippingByAuthorLocationTitle = (author: string, location: string, title: string, clippings: Clipping[]): number => {
  let mostRecentIndex: number = -1;
  let mostRecentDate: Date | undefined = undefined;

  for (let i = 0; i < clippings.length; i++) {
    const clipping = clippings[i];
    if (clipping.author === author && clipping.location === location && clipping.title === title) {
      return i;
    }
  }

  return mostRecentIndex;
}

/* Method to return the quote associated with a clipping, if it doesn't exist, return a blank string. */
export const getQuoteIfItExists = (clippings: Clipping[], index: number): string => {
  if (index === -1) {
    return '';
  }
  const clipping = clippings[index];
  const q = clipping.quote;
  if (q === undefined || q.trim() === '') {
    return '';
  }
  else {
    return q;
  }
}

/* Method to return the note associated with a clipping, if it doesn't exist, return a blank string. */
export const getNoteIfItExists = (clippings: Clipping[], index: string): string => {
  if (index === -1) {
    return '';
  }
  const clipping = clippings[index];
  const n = clipping.note;
  if (n === undefined || n.trim() === '') {
    return '';
  }
  else {
    return n;
  }
}

// export const getMostRecentlyAddedClippingByTitleAuthorLocation = (title: string, author: string, location: string, clippings: Clipping[]): Clipping | undefined => {
//   if (clippings.length === 0) {
//     return undefined; // Return undefined if the array is empty
//   }
  
//   let mostRecentClipping: Clipping | undefined = undefined;
//   let mostRecentDate: Date | undefined = undefined;

//   for (const clipping of clippings) {
//     if (clipping.author === author && clipping.location === location && clipping.title === title) {
//       const addedDate = new Date(clipping.addedDate);
//       if (!mostRecentDate || addedDate > mostRecentDate) {
//         mostRecentDate = addedDate;
//         mostRecentClipping = clipping;
//       }
//     }
//   }

//   return mostRecentClipping;
// }

/* Function to write to a file given the file, fileName and optionally the dirName */
export const writeToFile = (
  file: any,
  fileName: string,
  dirName: string
): void => {
  writeFileSync(
    path.join(path.dirname(__dirname), `../${dirName}/${fileName}`),
    JSON.stringify(file)
  );
};

/* Function to read a file given the fileName and optionally the dirName */
export const readFromFile = (fileName: string, dirName: string): string => {
  return readFileSync(
    path.join(path.dirname(__dirname), `../${dirName}/${fileName}`),
    "utf-8"
  );
};

/* Function to update the sync cache after every book is successfully synced */
export const updateSync = (book: GroupedClipping) => {
  const oldSync: Sync[] = JSON.parse(readFromFile("sync.json", "resources"));
  const bookSync = _.find(oldSync, { title: book.title });
  let newSync: Sync[] = [];
  if (bookSync) {
    _.remove(oldSync, { title: book.title });
    newSync = [
      ...oldSync,
      {
        title: book.title,
        author: book.author,
        highlightCount: bookSync.highlightCount + book.highlights.length,
      },
    ];
  } else {
    newSync = [
      ...oldSync,
      {
        title: book.title,
        author: book.author,
        highlightCount: book.highlights.length,
      },
    ];
  }
  writeToFile(newSync, "sync.json", "resources");
};

/* Function to get unsynced highlights for each book */
export const getUnsyncedHighlights = (books: GroupedClipping[]) => {
  // read the sync metadata (cache)

  // create an empty cache if it doesn't already exists
  const cacheFile = path.join(
    path.dirname(__dirname),
    `../resources/sync.json`
  );

  if (!existsSync(cacheFile)) {
    writeFileSync(cacheFile, "[]");
  }

  const sync: Sync[] = JSON.parse(readFromFile("sync.json", "resources"));
  const unsyncedHighlights: GroupedClipping[] = [];
  // if some books were synced earlier
  if (sync.length > 0) {
    console.log("\n🟢 Books already synced:\n");
    for (const book of books) {
      // find the sync metadata for the book
      const bookSync = _.find(sync, { title: book.title });
      // if the book was synced earlier
      if (bookSync) {
        // if new highlights have been added to the book
        if (book.highlights.length > bookSync.highlightCount) {
          // only new highlights should be synced
          unsyncedHighlights.push({
            ...book,
            highlights: book.highlights.slice(bookSync.highlightCount),
          });
        } else {
          console.log(`📖 ${book.title}`);
        }
      } else {
        // if the book wasn't synced earlier, every highlight should be synced
        unsyncedHighlights.push(book);
      }
    }
    console.log("--------------------------------------");
    return unsyncedHighlights;
  } else {
    // if no books were synced earlier, every book should be synced
    return books;
  }
};

export const formatAuthorName = (author: string) => {
  if (author.includes(",")) {
    const names = author
      .split(",")
      .map((name) => name.replace(/^\s*|\s*$/g, ""));
    author = `${names[1]} ${names[0]}`;
  }
  return author;
};
