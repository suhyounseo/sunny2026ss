import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const outputPath = "../outputs/price_suggestion_20260623/NICE_6월19일_신상품_판매가제안_검수표.xlsx";
const input = await FileBlob.load(outputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
console.log((await workbook.inspect({
  kind: "region",
  sheetId: "신제품 검수표",
  range: "V1:AF8",
  maxChars: 3000,
  tableMaxRows: 8,
  tableMaxCols: 11,
})).ndjson);
console.log((await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
})).ndjson);
