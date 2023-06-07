import _ from "lodash";
import { Highlight, Clipping, GroupedClipping } from "../interfaces";
import { writeToFile, readFromFile, formatAuthorName, getIndexMostRecentlyAddedClippingByAuthorLocationTitle, getQuoteIfItExists, getNoteIfItExists } from "../utils";

export class Parser {
  private fileName = "My Clippings.txt";
  private regex = /(.+) \((.+)\)\r*\n- (?:Your Highlight|La subrayado)(.+)\r*\n\r*\n(.+)|(.+) \((.+)\)\r*\n- Your Note(.+)\r*\n\r*\n(.+)/gm;
  private location_regex = /Location\s+(\d+)(?:-(\d+))?/gm;
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
    if (match) {
      const title = match[1] || match[5];
      let author = formatAuthorName(match[2] || match[6]);
      const quote = match[3];
      const note = match[7];
      const info_line = match[1] || match[2];
      const location = this.extractLocation(info_line);

      if (note) {
        const i = getIndexMostRecentlyAddedClippingByAuthorLocationTitle(title, author, location, this.clippings);
        const quote = getQuoteIfItExists(this.clippings, i);
        if (i > -1) {
          let clipping = this.clippings[i];
          this.clippings[i] = {title, author, quote, note, location}
        } else {
          this.clippings.push({title, author, quote, note, location})
        }
      }

      if (quote) {
        const i = getIndexMostRecentlyAddedClippingByAuthorLocationTitle(title, author, location, this.clippings);
        const note = getNoteIfItExists(this.clippings, i);
        if (i > -1) {
          let clipping = this.clippings[i];
          this.clippings[i] = {title, author, quote, note, location}
        } else {
          this.clippings.push({title, author, quote, note, location})
        }
      }
    }
  };

  extractLocation = (info_line) => {
    // Extracts the last location number from the info line in the clipping
    const loc_reg = new RegExp(this.location_regex.source);
    const match = loc_reg.exec(info_line);
    const loc = match[1] || match[2];
    if (loc) {
      return loc;
    } else {
      return '';
    } 
  }

  /* Method to group clippings (highlights) by the title of the book */
  // groupClippings = () => {
  //   console.log("\n➕ Grouping Clippings");
  //   this.groupedClippings = _.chain(this.clippings)
  //     .groupBy("title")
  //     .map((clippings, title) => ({
  //       title,
  //       author: clippings[0].author,
  //       highlights: clippings.map((clipping) => clipping.highlight)
  //     }))
  //     .value();

  //   // remove duplicates in the highlights and notes for each book
  //   this.groupedClippings = this.groupedClippings.map((groupedClipping) => {
  //     return {
  //       ...groupedClipping,
  //       highlights: [...new Set(groupedClipping.highlights)]
  //     };
  //   });
  // };

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

      console.log("Grouped Clippings:");
      console.log(this.groupedClippings);
  
    // Remove duplicates in the highlights and notes for each book
    // this.groupedClippings = this.groupedClippings.map((groupedClipping) => ({
    //   ...groupedClipping,
    //   clippings: groupedClipping.clippings.filter((clipping, index, self) => {
    //     const firstIndex = self.findIndex((c) => c.highlight === clipping.highlight && c.note === clipping.note);
    //     return index === firstIndex;
    //   }),
    // }));
  };



  // /* Method to find the clipping with the highest index that matches these criteria. Used for adding corresponding highlight */
  // getClippingByAuthorLocationTitle(author: string, location: string, title: string, clippings): Clipping | undefined {
  //   let matchingClipping: Clipping | undefined = undefined;
  //   for (let i = this.clippings.length - 1; i >= 0; i--) {
  //     const clipping = this.clippings[i];
  //     if (clipping.author === author && clipping.location === location && clipping.title === title) {
  //       matchingClipping = clipping;
  //       break;
  //     }
  //   }
  //   return matchingClipping;
  //   // return clippings.find(clipping => clipping.author === author && clipping.location === location && clipping.title === title);
  // }

  // updateClipping(title, author, quote, note, location, clippings): void {
  //   const index = clippings.findIndex(clipping => clipping.author === author && clipping.location === location && clipping.title === title && clipping.quote === quote);
  //   if (index !== -1) {
  //     this.clippings[index] = {title, author, quote, note, location};
  //   }
  // }

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
