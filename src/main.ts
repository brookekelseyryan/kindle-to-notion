import { Parser, Notion } from "./models";
// import {printStats} from "./utils"

const parser = new Parser();
// const googleBooks = new GoogleBooks();
const notion = new Notion();

(async () => {
  // parse clippings
  let clippings = parser.processClippings();

  // clippings = await googleBooks.processCovers(clippings);

  // sync highlights (clippings) to notion
  await notion.syncHighlights(clippings);
})();
