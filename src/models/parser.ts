import _ from "lodash";
import { Clipping, GroupedClipping } from "../interfaces";
import { writeToFile, readFromFile, formatAuthorName } from "../utils";

export class Parser {
  private fileName = "My Clippings.txt";
  private regex = /(.+) \((.+)\)\r*\n- (?:Your Highlight|La subrayado)(.+)\r*\n\r*\n(.+)|(.+) \((.+)\)\r*\n- Your Note(.+)\r*\n\r*\n(.+)/gm;
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
      console.log(`💯 Notes Count: ${groupedClipping.highlights.length}`)
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
      const title = match[1] || match[6];
      let author = formatAuthorName(match[2] || match[7]);
      const highlight = match[3];
      const note = match[8];
      const location = match[4] || match[9];

      if (highlight) {
        this.clippings.push({ title, author, highlight, location });
      }

      if (note) {
        this.clippings.push({ title, author, note, location });
      }
    }
  };

  /* Method to group clippings (highlights) by the title of the book */
  groupClippings = () => {
    console.log("\n➕ Grouping Clippings");
    this.groupedClippings = _.chain(this.clippings)
      .groupBy("title")
      .map((clippings, title) => ({
        title,
        author: clippings[0].author,
        highlights: clippings.map((clipping) => clipping.highlight),
        notes: clippings.map((clipping) => clipping.note)
      }))
      .value();

    // remove duplicates in the highlights and notes for each book
    this.groupedClippings = this.groupedClippings.map((groupedClipping) => {
      return {
        ...groupedClipping,
        highlights: [...new Set(groupedClipping.highlights)],
        notes: [...new Set(groupedClipping.notes)]
      };
    });
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
