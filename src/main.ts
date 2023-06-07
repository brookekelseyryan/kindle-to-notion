import { Parser } from "./models";

const parser = new Parser();
// const notion = new Notion();

(async () => {
  // parse clippings
  parser.processClippings();

  // sync highlights (clippings) to notion
  // await notion.syncHighlights(clippings);
})();
