import { Parser, Notion } from "./models";
import {readClippingsFromFile} from "./utils"

const parser = new Parser();
// const googleBooks = new GoogleBooks();
const notion = new Notion();

(async () => {
  // parse clippings
  let clippings = parser.processClippings();

  // clippings = await googleBooks.processCovers(clippings);
  clippings = readClippingsFromFile("grouped-clippings-covers.json", "data")


  // sync highlights (clippings) to notion
  await notion.syncHighlights(clippings);
})();
