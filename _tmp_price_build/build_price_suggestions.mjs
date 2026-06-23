import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/UserK/Downloads/NICE_6월19일_신상품_경쟁사정보_검수표.xlsx";
const outputDir = path.resolve("../outputs/price_suggestion_20260623");
await fs.mkdir(outputDir, { recursive: true });

function asNum(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value).replace(/[,원\s]/g, "");
  const n = Number(text);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function uniq(values) {
  return [...new Set(values.filter(v => v !== null && v !== undefined && v !== ""))];
}

function extractPurchasePrices(text) {
  const raw = String(text || "");
  const tokens = [];
  const usedSpans = [];
  for (const m of raw.matchAll(/\b(\d{4,6})\b/g)) {
    const n = Number(m[1]);
    if (n >= 10000 && n <= 300000) {
      tokens.push(n);
      usedSpans.push([m.index, m.index + m[0].length]);
    }
  }
  for (const m of raw.matchAll(/(?:국내제작|수입|제작)\s*(\d{2,3})(?!\d)/g)) {
    const n = Number(m[1]);
    if (n >= 20 && n <= 300) {
      const start = m.index + m[0].lastIndexOf(m[1]);
      const end = start + m[1].length;
      const already = usedSpans.some(([a, b]) => start >= a && end <= b);
      if (!already) tokens.push(n * 1000);
    }
  }
  return uniq(tokens);
}

function cleanSupplierText(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map(line => line
      .replace(/(?:국내제작|수입|제작)\s*\d{2,6}/g, "")
      .replace(/\b\d{4,6}\b/g, "")
      .replace(/\s+/g, " ")
      .trim())
    .filter(Boolean)
    .join(" / ");
}

function purchaseForPricing(category, prices) {
  if (!prices.length) return null;
  const sorted = [...prices].sort((a, b) => b - a);
  if (/TWO PIECE/i.test(String(category || ""))) {
    if (prices.length === 1) return prices[0];
    return prices.slice(0, 2).reduce((a, b) => a + b, 0);
  }
  return sorted[0];
}

function marginFloor(purchase) {
  if (!purchase) return null;
  let mult = 1.55;
  let minMargin = 30000;
  if (purchase <= 35000) {
    mult = 1.8;
    minMargin = 22000;
  } else if (purchase <= 65000) {
    mult = 1.65;
    minMargin = 28000;
  } else if (purchase <= 90000) {
    mult = 1.55;
    minMargin = 32000;
  } else {
    mult = 1.45;
    minMargin = 38000;
  }
  return Math.max(purchase * mult, purchase + minMargin);
}

function ceilToThousand(n) {
  return n ? Math.ceil(n / 1000) * 1000 : null;
}

function suggestedPrice({ purchase, competitor }) {
  const floor = marginFloor(purchase);
  if (competitor && !floor) return competitor;
  if (!competitor && floor) return ceilToThousand(floor);
  if (!competitor && !floor) return null;
  if (floor <= competitor * 1.12) return competitor;
  return ceilToThousand(floor);
}

function statusFor(row) {
  if (!row.suggested) return "보류";
  if (!row.purchase) return "가격만 확인";
  if (row.purchaseCount > 2) return "확인필요";
  if (row.competitor && row.suggested > row.competitor * 1.2) return "확인필요";
  return "검토가능";
}

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const originalPreview = await workbook.render({
  sheetName: "신제품 검수표",
  range: "A1:U14",
  scale: 1,
  format: "png",
});
await fs.writeFile(path.join(outputDir, "original_preview.png"), new Uint8Array(await originalPreview.arrayBuffer()));

const sheet = workbook.worksheets.getItem("신제품 검수표");
const values = sheet.getRange("A1:U92").values;
const headers = values[0].map(v => String(v || ""));
const rows = values.slice(1);

const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
const newHeaders = [
  "거래처상품명 정리",
  "매입가 후보",
  "산정 매입가",
  "매입 메모",
  "경쟁사 기준가",
  "추천 판매가",
  "예상 마진",
  "마진율",
  "산정 방식",
  "쇼룸 반영상태",
  "반영 검토 메모",
];

const outRows = [];
const summary = { total: rows.length, suggested: 0, directCompetitor: 0, needsReview: 0, noSuggestion: 0 };

for (const row of rows) {
  const category = row[idx["카테고리"]];
  const purchaseText = row[idx["매입가격 거래처상품명 사이즈"]];
  const purchasePrices = extractPurchasePrices(purchaseText);
  const purchase = purchaseForPricing(category, purchasePrices);
  const competitorPrices = uniq([
    asNum(row[idx["쥬디샵 가격"]]),
    asNum(row[idx["비비공주 가격"]]),
  ]);
  const competitor = competitorPrices.length ? Math.min(...competitorPrices) : null;
  const suggested = suggestedPrice({ purchase, competitor });
  const margin = suggested && purchase ? suggested - purchase : null;
  const marginRate = suggested && purchase ? margin / suggested : null;
  const notes = [];
  if (!purchaseText) notes.push("매입정보 없음");
  if (!purchasePrices.length) notes.push("매입가 추출불가");
  if (purchasePrices.length > 2) notes.push(`매입가 후보 ${purchasePrices.length}개: 구성 확인`);
  if (!competitor) notes.push("경쟁사 직접가격 없음");
  if (competitor && suggested && suggested > competitor * 1.2) notes.push("매입가 기준 판매가가 경쟁사보다 높음");
  const method = competitor
    ? (purchase && suggested > competitor ? "경쟁사+마진하한" : "경쟁사가격 기준")
    : (purchase ? "매입가 마진 기준" : "보류");
  const record = {
    suggested,
    purchase,
    competitor,
    purchaseCount: purchasePrices.length,
  };
  const status = statusFor(record);
  if (suggested) summary.suggested += 1;
  else summary.noSuggestion += 1;
  if (competitor) summary.directCompetitor += 1;
  if (status === "확인필요" || status === "보류") summary.needsReview += 1;
  outRows.push([
    cleanSupplierText(purchaseText),
    purchasePrices.join(", "),
    purchase,
    notes.filter(n => n.includes("매입") || n.includes("구성")).join(" / "),
    competitor,
    suggested,
    margin,
    marginRate,
    method,
    status,
    notes.join(" / "),
  ]);
}

const startCol = 21; // V
sheet.getRangeByIndexes(0, startCol, 1, newHeaders.length).values = [newHeaders];
sheet.getRangeByIndexes(1, startCol, outRows.length, newHeaders.length).values = outRows;

const headerRange = sheet.getRangeByIndexes(0, startCol, 1, newHeaders.length);
headerRange.format = {
  fill: "#1f4e46",
  font: { bold: true, color: "#FFFFFF" },
  wrapText: true,
};
sheet.getRangeByIndexes(1, startCol, outRows.length, newHeaders.length).format = {
  wrapText: true,
  borders: { preset: "inside", style: "thin", color: "#e3d7ca" },
};
sheet.getRangeByIndexes(1, 22, outRows.length, 1).format.numberFormat = "#,##0";
sheet.getRangeByIndexes(1, 23, outRows.length, 1).format.numberFormat = "#,##0";
sheet.getRangeByIndexes(1, 25, outRows.length, 3).format.numberFormat = "#,##0";
sheet.getRangeByIndexes(1, 28, outRows.length, 1).format.numberFormat = "0.0%";
sheet.getRange("V:V").format.columnWidth = 34;
sheet.getRange("W:W").format.columnWidth = 16;
sheet.getRange("X:X").format.columnWidth = 13;
sheet.getRange("Y:Y").format.columnWidth = 24;
sheet.getRange("Z:AB").format.columnWidth = 13;
sheet.getRange("AC:AC").format.columnWidth = 10;
sheet.getRange("AD:AF").format.columnWidth = 18;

let summarySheet;
try {
  summarySheet = workbook.worksheets.getItem("판매가 제안 요약");
  summarySheet.getUsedRange()?.clear({ applyTo: "all" });
} catch {
  summarySheet = workbook.worksheets.add("판매가 제안 요약");
}
summarySheet.showGridLines = false;
summarySheet.getRange("A1:H1").merge();
summarySheet.getRange("A1").values = [["6월 19일 신상품 판매가 제안 요약"]];
summarySheet.getRange("A1").format = { fill: "#17110f", font: { bold: true, color: "#FFFFFF", size: 16 } };
summarySheet.getRange("A3:B9").values = [
  ["총 상품 수", summary.total],
  ["판매가 제안 완료", summary.suggested],
  ["경쟁사 가격 참고 가능", summary.directCompetitor],
  ["확인필요/보류", summary.needsReview],
  ["제안 불가", summary.noSuggestion],
  ["가격 기준", "경쟁사 가격 우선, 매입가 기준 최소 마진 보정"],
  ["주의", "매입가 후보가 여러 개인 상품은 구성 확인 후 반영 권장"],
];
summarySheet.getRange("A3:A9").format = { fill: "#efe6dc", font: { bold: true } };
summarySheet.getRange("A3:B9").format.borders = { preset: "all", style: "thin", color: "#d8c8b9" };
summarySheet.getRange("B3:B7").format.numberFormat = "#,##0";
summarySheet.getRange("A11:A15").values = [
  ["산정 방식"],
  ["1. 쥬디샵/비비공주 직접 가격이 있으면 경쟁사 기준가로 우선 제안했습니다."],
  ["2. 매입가 대비 마진이 너무 낮으면 최소 마진 판매가로 보정했습니다."],
  ["3. 경쟁사 가격이 없으면 매입가에 상품 가격대별 배율을 적용했습니다."],
  ["4. 투피스는 매입가 후보가 2개면 합산, 3개 이상이면 확인필요로 표시했습니다."],
];
for (let r = 11; r <= 15; r++) summarySheet.getRange(`A${r}:H${r}`).merge();
summarySheet.getRange("A11").format = { fill: "#f7f2ec", font: { bold: true } };
summarySheet.getRange("A12:A15").format = { wrapText: true };
summarySheet.getRange("A:A").format.columnWidth = 24;
summarySheet.getRange("B:B").format.columnWidth = 36;

const inspect = await workbook.inspect({
  kind: "region",
  sheetId: "신제품 검수표",
  range: "V1:AF12",
  maxChars: 7000,
  tableMaxRows: 12,
  tableMaxCols: 11,
});
console.log(inspect.ndjson);
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: "신제품 검수표",
  range: "V1:AF18",
  scale: 1,
  format: "png",
});
await fs.writeFile(path.join(outputDir, "price_suggestion_preview.png"), new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
const outPath = path.join(outputDir, "NICE_6월19일_신상품_판매가제안_검수표.xlsx");
await output.save(outPath);
console.log(outPath);
