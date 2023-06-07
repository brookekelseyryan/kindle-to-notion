import path from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { GroupedClipping, Sync, Clipping } from "../interfaces";
import _ from "lodash";

// export const splitLocation = (location: string): string => {

//   const locarr = location.split("-");


// };

// export const locationsMatch = (location1: string, location2: string): boolean => {
//   const loc1 : string[] = location1.split("-");
//   const loc2 : string[] = location2.split("-");
//   const loc1_range : number[] = [];
//   const loc2_range : number[] = [];

//   for (let i = 0; i < loc1.length; i++)  {
//     loc1_range.push(parseInt(loc1[i]));
//   }

//   for (let j = 0; j < loc2.length; j++)  {
//     loc2_range.push(parseInt(loc2[j]));
//   }



//   for (let i = 0; i < loc1.length; i++) {
//     for (let j = 0; j < loc2.length; j++) {
//       if (loc1[i] === loc2[j]) {
//         return true; // If any element in loc1 matches an element in loc2, return true
//       }
//     }
//   }

//   return false; // No matching elements found, return false

// };

/* The Locations property is a range, it may either have 1 or 2 numbers in that range */
export const locationsMatch = (location1: string, location2: string): boolean => {
  const loc1: string[] = location1.split("-");
  const loc2: string[] = location2.split("-");
  const loc1_range: number[] = loc1.map((value) => parseInt(value));
  const loc2_range: number[] = loc2.map((value) => parseInt(value));

  if (loc1_range.length === 1 && loc2_range.length === 1) {
    return loc1_range[0] === loc2_range[0];
  }

  if (loc1_range.length === 2 && loc2_range.length === 1) {
    const [min, max] = loc1_range;
    return loc2_range[0] >= min && loc2_range[0] <= max;
  }

  if (loc1_range.length === 1 && loc2_range.length === 2) {
    const [min, max] = loc2_range;
    return loc1_range[0] >= min && loc1_range[0] <= max;
  }

  if (loc1_range.length === 2 && loc2_range.length === 2) {
    const [min1, max1] = loc1_range;
    const [min2, max2] = loc2_range;
    return (min1 >= min2 && min1 <= max2) || (max1 >= min2 && max1 <= max2);
  }

  return false;
};


export const getIndexMostRecentlyAddedClippingByAuthorLocationTitle = (author: string, location: string, title: string, clippings: Clipping[]): number => {

  for (let i = 0; i < clippings.length; i++) {
    const clipping = clippings[i];
    // console.log("clipping.title:" + clipping.title);
    // console.log("title:" + title);
    // console.log("clipping.author:" + clipping.author);
    // console.log("author:" + author);
    // console.log("clipping.location:" + clipping.location);
    // console.log("location:" + location);
    if (clipping.author === author && clipping.title === title && locationsMatch(clipping.location, location)) {
      return i;
    }
  }

  return -1;
};

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
};

/* Method to return the note associated with a clipping, if it doesn't exist, return a blank string. */
export const getNoteIfItExists = (clippings: Clipping[], index: number): string => {
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
};

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
