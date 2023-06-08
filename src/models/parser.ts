import _ from "lodash";
import { Clipping, GroupedClipping } from "../interfaces";
import { writeToFile, readFromFile, formatAuthorName, getIndexMostRecentlyAddedClippingByAuthorLocationTitle, getQuoteIfItExists, getNoteIfItExists } from "../utils";

export class Parser {
  private fileName = "My Clippings.txt";
  private regex = /(.+) \((.+)\)\r*\n- (?:Your Highlight|La subrayado)(.+)\r*\n\r*\n(.+)|(.+) \((.+)\)\r*\n- Your Note(.+)\r*\n\r*\n(.+)/gm;
  private location_regex = /Location\s+(\d+)(?:-(\d+))?/gm; //gets both numbers 
  private page_regex = /page\s+(\d+)(?:-(\d+))?/gm;
  private splitter = /=+\r*\n/gm;
  private nonUtf8 = /\uFEFF/gmu;
  private clippings: Clipping[] = [];
  private groupedClippings: GroupedClipping[] = [];

  /* Method to print the stats of Clippings read from My Clippings.txt */
  printStats = () => {
    console.log("\n💹 Stats for Clippings");
    for (const groupedClipping of this.groupedClippings) {
      console.log("--------------------------------------");
      console.log(`📝 Title: ${groupedClipping.title}`);
      console.log(`🙋 Author: ${groupedClipping.author}`);
      console.log(`📘 Book Cover Url: ${groupedClipping.bookCoverUrl}`);
      console.log(`💯 Highlights Count: ${groupedClipping.highlights.length}`);
    }
    console.log("--------------------------------------");
  };

  /* Method to export the final grouped clippings to a file */
  exportGroupedClippings = () => {
    writeToFile(this.groupedClippings, "grouped-clippings.json", "data");
  };

  /* Method add the parsed clippings to the clippings array */
  addToClippingsArray = (match: RegExpExecArray | null) => {
    if (!match) return;
  
    const title = match[1] || match[5];
    const author = formatAuthorName(match[2] || match[6]);
    const quote = match[4];
    const note = match[8];
    const info_line = match[3] || match[7];
    const location = this.extractLocation(info_line);
    const i = getIndexMostRecentlyAddedClippingByAuthorLocationTitle(author, location, title, this.clippings);

    if (note) {
      const quote = getQuoteIfItExists(this.clippings, i);
      if (i > -1 && quote !== "") {
        this.clippings[i] = {title, author, quote, note, location}
      } else {
        this.clippings.push({title, author, quote, note, location})
      }
    }

    if (quote) {
      const note = getNoteIfItExists(this.clippings, i);
      if (i > -1 && note !== "") {
        this.clippings[i] = {title, author, quote, note, location}
      } else {
        this.clippings.push({title, author, quote, note, location})
      }
    }

  };
  

  extractLocation = (info_line: string) => {
    // Extracts a single number or a range for the location. 
    const loc_reg = new RegExp(this.location_regex.source);
    const match = loc_reg.exec(info_line);
    if (match) {
      const loc1 = match[1];
      const loc2 = match[2];

      if (loc2) {
        return loc1 + "-" + loc2;
      } 
      else if (loc1) {
        return loc1;
      }
    } 
    // next, try extracting the page number if we couldn't find any location range 
    const page_reg = new RegExp(this.page_regex.source);
    const page_match = page_reg.exec(info_line);

    if (page_match) {
      const loc3 = page_match[1];
      const loc4 = page_match[2];
      
      if (loc4) {
        return loc3 + "-" + loc4;
      } 
      else if (loc3) {
        return loc3;
      }
    }
    return '';
  }

  groupClippings = (): void => {
    console.log("\n➕ Grouping Clippings");
  
    this.groupedClippings = _.chain(this.clippings)
      .groupBy("title")
      .map((clippings, title) => ({
        title,
        author: clippings[0].author,
        highlights: clippings.map((clipping) => ({
          quote: clipping.quote,
          note: clipping.note,
          location: clipping.location,
        })),
      }))
      .value();
  };

  /* Method to parse clippings (highlights) and add them to the clippings array */
  parseClippings = () => {
    console.log("📋 Parsing Clippings");
    const clippingsRaw = readFromFile(this.fileName, "resources");

    // filter clippings to remove the non-UTF8 character
    const clippingsFiltered = clippingsRaw.replace(this.nonUtf8, "");

    // split clippings using splitter regex
    const clippingsSplit = clippingsFiltered.split(this.splitter);

    // parse clippings using regex
    for (let i = 0; i < clippingsSplit.length - 1; i++) {
      const clipping = clippingsSplit[i];
      const regex = new RegExp(this.regex.source);
      const match = regex.exec(clipping);
      this.addToClippingsArray(match);
    }
  };

  /* Wrapper method to process clippings */
  processClippings = (): GroupedClipping[] => {
    this.parseClippings();
    this.groupClippings();
    this.exportGroupedClippings();
    this.printStats();
    return this.groupedClippings;
  };
}
