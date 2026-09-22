import * as XLSX from "xlsx";
import { formatPhoneForWhatsApp } from "./phone";

export interface ParsedLead {
  name: string;
  phone: string;
  status: string;
  rawPhone?: string;
}

export interface ParseExcelResult {
  leads: ParsedLead[];
  totalRows: number;
  validLeads: number;
  skippedRows: number;
  headersFound: string[];
}

/**
 * Clean and format phone numbers:
 * Strips whitespace, dashes, brackets, and prepares proper Egyptian / international format.
 */
export function sanitizePhoneNumber(raw: any): string {
  if (raw === undefined || raw === null) return "";
  let str = String(raw).trim();

  // Convert exponential format e.g. 2.01012E+11 to integer string if needed
  if (str.includes("e") || str.includes("E")) {
    const num = Number(str);
    if (!isNaN(num)) {
      str = num.toLocaleString("fullwide", { useGrouping: false });
    }
  }

  // Remove all non-digit and non-+ characters
  str = str.replace(/[^\d+]/g, "");

  // If starts with 00, replace with +
  if (str.startsWith("00")) {
    str = "+" + str.substring(2);
  }

  // If Egyptian local number starting with 01 (e.g. 01012345678), format as +201012345678
  if (/^01[0125]\d{8}$/.test(str)) {
    str = "+2" + str;
  } else if (/^1[0125]\d{8}$/.test(str)) {
    str = "+20" + str;
  } else if (/^201[0125]\d{8}$/.test(str)) {
    str = "+" + str;
  } else if (/^\d{8,15}$/.test(str) && !str.startsWith("+")) {
    // If digits only without +, assume + prefix
    str = "+" + str;
  }

  return str;
}

/**
 * Parses any Excel file (.xlsx, .xls) or CSV buffer/text into clean leads.
 */
export async function parseExcelOrCSV(file: File): Promise<ParseExcelResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to 2D array of strings
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

  if (!rows || rows.length === 0) {
    return { leads: [], totalRows: 0, validLeads: 0, skippedRows: 0, headersFound: [] };
  }

  // Find header row or column indices
  let headerRowIndex = 0;
  let headers: string[] = [];
  let phoneColIndex = -1;
  let nameColIndex = -1;
  let statusColIndex = -1;

  // Search first 5 rows to identify column headers
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const currentRow = rows[r].map((cell: any) => String(cell).trim().toLowerCase());
    
    const pIdx = currentRow.findIndex(
      (h: string) =>
        h.includes("phone") ||
        h.includes("mobile") ||
        h.includes("tel") ||
        h.includes("هاتف") ||
        h.includes("موبايل") ||
        h.includes("تليفون") ||
        h.includes("واتساب") ||
        h.includes("whatsapp") ||
        h.includes("رقم")
    );

    const nIdx = currentRow.findIndex(
      (h: string) =>
        h.includes("name") ||
        h.includes("اسم") ||
        h.includes("الاسم") ||
        h.includes("عميل") ||
        h.includes("client") ||
        h.includes("lead")
    );

    if (pIdx !== -1) {
      headerRowIndex = r;
      headers = rows[r].map((c: any) => String(c).trim());
      phoneColIndex = pIdx;
      nameColIndex = nIdx;
      break;
    }
  }

  // If no explicit phone header was found by name, scan cells for numeric patterns (e.g. 010...)
  if (phoneColIndex === -1) {
    for (let c = 0; c < (rows[0]?.length || 0); c++) {
      let numericCount = 0;
      for (let r = 0; r < Math.min(rows.length, 10); r++) {
        const val = String(rows[r][c] || "").replace(/[^\d]/g, "");
        if (val.length >= 9 && val.length <= 15) {
          numericCount++;
        }
      }
      if (numericCount >= 2) {
        phoneColIndex = c;
        // If there's another column, assume it might be name
        nameColIndex = c === 0 && rows[0].length > 1 ? 1 : 0 === c ? -1 : 0;
        break;
      }
    }
  }

  const leads: ParsedLead[] = [];
  let skippedRows = 0;
  const startRow = headers.length > 0 ? headerRowIndex + 1 : 0;

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawPhone = phoneColIndex !== -1 ? row[phoneColIndex] : row[0];
    const rawName = nameColIndex !== -1 ? row[nameColIndex] : "";

    const cleanPhone = sanitizePhoneNumber(rawPhone);

    if (!cleanPhone || cleanPhone.replace(/[^\d]/g, "").length < 7) {
      skippedRows++;
      continue;
    }

    let finalName = String(rawName || "").trim();

    // If name is empty (sheet has numbers only), generate a clean descriptive name
    if (!finalName) {
      const displayPhone = cleanPhone.startsWith("+20")
        ? cleanPhone.replace("+20", "0")
        : cleanPhone;
      finalName = `Lead (${displayPhone})`;
    }

    leads.push({
      name: finalName,
      phone: cleanPhone,
      status: "following",
      rawPhone: String(rawPhone),
    });
  }

  return {
    leads,
    totalRows: rows.length - (headers.length > 0 ? 1 : 0),
    validLeads: leads.length,
    skippedRows,
    headersFound: headers,
  };
}
