import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/UserK/Downloads/NICE_6월19일_신상품_경쟁사정보_검수표.xlsx";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

console.log((await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 6000,
  tableMaxRows: 5,
  tableMaxCols: 10,
})).ndjson);

for (const sheetName of ["요약", "신제품 검수표", "경쟁사 후보목록"]) {
  try {
    console.log("SHEET", sheetName);
    console.log((await workbook.inspect({
      kind: "region",
      sheetId: sheetName,
      range: "A1:AD12",
      maxChars: 8000,
      tableMaxRows: 12,
      tableMaxCols: 30,
    })).ndjson);
  } catch (err) {
    console.log("ERR", sheetName, err.message);
  }
}
