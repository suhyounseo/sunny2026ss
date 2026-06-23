import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = path.resolve("..");
const data = JSON.parse(await fs.readFile(path.join(root, "_tmp_review_data.json"), "utf8"));
const outputDir = path.join(root, "outputs", "showroom_review_20260621");
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const summary = workbook.worksheets.add("요약");
const review = workbook.worksheets.add("신제품 검수표");
const candidates = workbook.worksheets.add("경쟁사 후보목록");

function money(v) {
  return v === "" || v === null || v === undefined ? "" : Number(v);
}

summary.showGridLines = false;
summary.getRange("A1:H1").merge();
summary.getRange("A1").values = [["6월 19일 추가 신상품 경쟁사 정보 수집 요약"]];
summary.getRange("A1").format = {
  fill: "#17110f",
  font: { bold: true, color: "#FFFFFF", size: 16 },
};
summary.getRange("A3:B8").values = [
  ["총 신상품 수", data.summary.totalNewProducts],
  ["쥬디샵 직접 코드 매칭", data.summary.judyDirectMatches],
  ["비비공주 직접 코드 매칭", data.summary.bbDirectMatches],
  ["쥬디샵 가격 수집", data.summary.judyPriceCaptured],
  ["수동 검색 필요", data.summary.needsManualSearch],
  ["작성 기준", "쥬디샵/비비공주 상품명 내 S코드 직접 매칭 우선"],
];
summary.getRange("A3:A8").format = { fill: "#efe6dc", font: { bold: true } };
summary.getRange("A3:B8").format.borders = { preset: "all", style: "thin", color: "#d8c8b9" };
summary.getRange("B3:B7").format.numberFormat = "#,##0";
summary.getRange("A10:A13").values = [
  ["검수 메모"],
  ["1. 가격/사이즈는 텍스트로 수집 가능한 항목만 넣었습니다."],
  ["2. 소재/안감/신축성/비침/두께가 상세 이미지 안에만 있는 경우 '상세이미지 확인필요'로 표시했습니다."],
  ["3. '구성 확인 필요'는 우리 상품명과 경쟁사 상품명이 단품/세트 기준으로 달라 보이는 경우입니다."],
];
summary.getRange("A10:H10").merge();
summary.getRange("A11:H11").merge();
summary.getRange("A12:H12").merge();
summary.getRange("A13:H13").merge();
summary.getRange("A10").format = { fill: "#f7f2ec", font: { bold: true } };
summary.getRange("A11:A13").format = { wrapText: true };
summary.getRange("A:A").format.columnWidth = 24;
summary.getRange("B:B").format.columnWidth = 24;

const headers = [
  "상품코드", "NICE 상품명", "컬러", "카테고리", "폴더/거래처", "현재 쇼룸가격", "현재 사이즈",
  "쥬디샵 매칭", "쥬디샵 상품명", "쥬디샵 가격", "쥬디샵 사이즈옵션", "쥬디샵 소재", "쥬디샵 착용정보", "쥬디샵 URL",
  "비비공주 매칭", "비비공주 상품명", "비비공주 가격", "비비공주 URL", "추천 작업", "검수 메모"
];
const rows = data.reviewRows.map(r => [
  r.code, r.niceName, r.color, r.category, r.folder, money(r.nicePrice), r.niceSize,
  r.judyStatus, r.judyName, money(r.judyPrice), r.judySize, r.judyFabric, r.judyWear, r.judyUrl,
  r.bbStatus, r.bbName, money(r.bbPrice), r.bbUrl, r.reviewAction, r.memo
]);
review.getRangeByIndexes(0, 0, 1, headers.length).values = [headers];
review.getRangeByIndexes(1, 0, rows.length, headers.length).values = rows;
const reviewRange = review.getRangeByIndexes(0, 0, rows.length + 1, headers.length);
review.tables.add(reviewRange.address, true, "NewProductReview");
review.getRangeByIndexes(0, 0, 1, headers.length).format = {
  fill: "#2b211d",
  font: { bold: true, color: "#FFFFFF" },
  wrapText: true,
};
review.freezePanes.freezeRows(1);
review.freezePanes.freezeColumns(1);
review.getRange("J:J").format.numberFormat = "#,##0";
review.getRange("Q:Q").format.numberFormat = "#,##0";
review.getRange("A:A").format.columnWidth = 10;
review.getRange("B:B").format.columnWidth = 24;
review.getRange("E:E").format.columnWidth = 34;
review.getRange("I:I").format.columnWidth = 28;
review.getRange("K:M").format.columnWidth = 26;
review.getRange("N:N").format.columnWidth = 42;
review.getRange("P:P").format.columnWidth = 28;
review.getRange("R:R").format.columnWidth = 42;
review.getRange("T:T").format.columnWidth = 44;
review.getRangeByIndexes(1, 0, rows.length, headers.length).format.wrapText = true;
review.getRangeByIndexes(0, 0, rows.length + 1, headers.length).format.borders = {
  preset: "inside",
  style: "thin",
  color: "#e5d8cb",
};

const candHeaders = ["사이트", "상품명 내 코드", "상품명", "가격", "URL", "수집 페이지"];
const candRows = data.candidateRows.map(r => [r.site, r.codeInName, r.name, money(r.price), r.url, r.sourcePage]);
candidates.getRangeByIndexes(0, 0, 1, candHeaders.length).values = [candHeaders];
candidates.getRangeByIndexes(1, 0, candRows.length, candHeaders.length).values = candRows;
candidates.tables.add(candidates.getRangeByIndexes(0, 0, candRows.length + 1, candHeaders.length).address, true, "CompetitorCandidates");
candidates.getRangeByIndexes(0, 0, 1, candHeaders.length).format = {
  fill: "#4b3a30",
  font: { bold: true, color: "#FFFFFF" },
};
candidates.freezePanes.freezeRows(1);
candidates.getRange("D:D").format.numberFormat = "#,##0";
candidates.getRange("A:A").format.columnWidth = 14;
candidates.getRange("C:C").format.columnWidth = 34;
candidates.getRange("E:F").format.columnWidth = 52;
candidates.getRangeByIndexes(1, 0, candRows.length, candHeaders.length).format.wrapText = true;

const inspect = await workbook.inspect({
  kind: "table",
  range: "신제품 검수표!A1:T8",
  include: "values",
  tableMaxRows: 8,
  tableMaxCols: 20,
  maxChars: 4000,
});
console.log(inspect.ndjson);
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({ sheetName: "신제품 검수표", range: "A1:T12", scale: 1, format: "png" });
await fs.writeFile(path.join(outputDir, "preview_review.png"), new Uint8Array(await preview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
const outPath = path.join(outputDir, "NICE_6월19일_신상품_경쟁사정보_검수표.xlsx");
await xlsx.save(outPath);
console.log(outPath);
