import path from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { GroupedClipping, Sync, Clipping } from "../interfaces";
import _ from "lodash";

/* Method to print the stats of Clippings read from My Clippings.txt */
export const printStats = (groupedClippings: GroupedClipping[]) => {
  console.log("\n💹 Stats for Clippings");
  for (const groupedClipping of groupedClippings) {
      console.log("--------------------------------------");
      console.log(`📝 Title: ${groupedClipping.title}`);
      console.log(`🙋 Author: ${groupedClipping.author}`);
      console.log(`📘 Book Cover Url: ${groupedClipping.bookCoverUrl}`);
      console.log(`💯 Highlights Count: ${groupedClipping.highlights.length}`);
  }
  console.log("--------------------------------------");
};

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

export const readClippingsFromFile = (fileName: string, dirName: string): GroupedClipping[] => {
  try {
    const data = readFileSync(path.join(path.dirname(__dirname), `../${dirName}/${fileName}`), 'utf8');
    const jsonData = JSON.parse(data);
    
    if (Array.isArray(jsonData)) {
      // Map the JSON data to the GroupedClipping array structure
      const clippings: GroupedClipping[] = jsonData.map((item: any) => ({
        title: item.title,
        author: item.author,
        highlights: item.highlights,
        bookCoverUrl: item.bookCoverUrl
      }));

      return clippings;
    } else {
      console.log('Invalid JSON data. Expected an array.');
    }
  } catch (error) {
    console.error('Error reading JSON file:', error);
  }

  return [];
}

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
