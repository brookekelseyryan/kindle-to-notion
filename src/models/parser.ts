import _ from "lodash";
import { Clipping, GroupedClipping } from "../interfaces";
import { writeToFile, readFromFile, formatAuthorName, getIndexMostRecentlyAddedClippingByAuthorLocationTitle, getQuoteIfItExists, getNoteIfItExists } from "../utils";

export class Parser {
  private fileName = "My Clippings.txt";
  private regex = /(.+) \((.+)\)\r*\n- (?:Your Highlight|La subrayado)(.+)\r*\n\r*\n(.+)|(.+) \((.+)\)\r*\n- Your Note(.+)\r*\n\r*\n(.+)/gm;
  // private location_regex = /Location\s+(\d+)(?:-(\d+))?/gm; // gets the single or last number if range
  private location_regex = /Location\s+(\d+)(?:-(\d+))?/gm; //gets both numbers 
  private page_regex = /page\s+(\d+)(?:-(\d+))?/gm;
  // private location_regex = /Location\s+(\d+)(?:-(\d+))?|page\s+(\d+)(?:-(\d+))?/gm; //gets both numbers in location or page 
  private splitter = /=+\r*\n/gm;
  private nonUtf8 = /\uFEFF/gmu;
  private clippings: Clipping[] = [];
  private groupedClippings: GroupedClipping[] = [];

  /* Method to print the stats of Clippings read from My Clippings.txt */
  // printStats = () => {
  //   console.log("\n💹 Stats for Clippings");
  //   for (const groupedClipping of this.groupedClippings) {
  //     console.log("--------------------------------------");
  //     console.log(`📝 Title: ${groupedClipping.title}`);
  //     console.log(`🙋 Author: ${groupedClipping.author}`);
  //     console.log(`💯 Highlights Count: ${groupedClipping.highlights.length}`);
  //     console.log(groupedClipping.highlights);
  //   }
  //   console.log("--------------------------------------");
  // };
  printStats = () => {
    console.log("\n💹 Stats for Clippings");
    for (const groupedClipping of this.groupedClippings) {
      console.log("--------------------------------------");
      console.log(`📝 Title: ${groupedClipping.title}`);
      console.log(`🙋 Author: ${groupedClipping.author}`);
      console.log(`💯 Highlights Count: ${groupedClipping.highlights.length}`);
      console.log("🔖 Highlights with Notes:");
      for (const highlight of groupedClipping.highlights) {
        if (highlight.note !== "") {
          console.log(`  Quote: ${highlight.quote}`);
          console.log(`  Note: ${highlight.note}`);
          console.log(`  Location: ${highlight.location}`);
          console.log("--------------------------------------");
        }
      }
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
      const quote = match[4];
      const note = match[8];
      const info_line = match[3] || match[7];
      const location = this.extractLocation(info_line);
      // console.log("----------------");
      // console.log();
      // console.log("title:" + title);
      // console.log("author:" + author);
      // console.log("info_line:" + info_line);
      // console.log("location:" + location);

      if (note) {
        // console.log("note:" + note);
        const i = getIndexMostRecentlyAddedClippingByAuthorLocationTitle(author, location, title, this.clippings);
        // console.log("i:" + i);
        const quote = getQuoteIfItExists(this.clippings, i);
        // console.log("quote:" + quote);
        if (i > -1 && quote !== "") {
          // let clipping = this.clippings[i];
          this.clippings[i] = {title, author, quote, note, location}
        } else {
          this.clippings.push({title, author, quote, note, location})
        }
      }

      if (quote) {
        // console.log("quote:" + quote);
        const i = getIndexMostRecentlyAddedClippingByAuthorLocationTitle(author, location, title, this.clippings);
        const note = getNoteIfItExists(this.clippings, i);
        // console.log("note:" + note);
        if (i > -1 && note !== "") {
          // let clipping = this.clippings[i];
          this.clippings[i] = {title, author, quote, note, location}
        } else {
          this.clippings.push({title, author, quote, note, location})
        }
      }
    }
    // console.log("----------------");
    // console.log();
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
