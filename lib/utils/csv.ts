export function exportLeadsToCSV(leads: Array<{ name?: string; phone?: string; status?: string; createdAt?: any; [key: string]: any }>) {
  if (!leads || leads.length === 0) return;

  const headers = ["Name", "Phone", "Status", "Created At"];
  const rows = leads.map((lead) => [
    `"${(lead.name || "").replace(/"/g, '""')}"`,
    `"${(lead.phone || "").replace(/"/g, '""')}"`,
    `"${(lead.status || "").replace(/"/g, '""')}"`,
    `"${lead.createdAt ? (lead.createdAt.seconds ? new Date(lead.createdAt.seconds * 1000).toISOString() : new Date(lead.createdAt).toISOString()) : ""}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `leads_export_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseLeadsCSV(csvText: string): Array<{ name: string; phone: string; status?: string }> {
  const lines = csvText.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const nameIdx = headers.findIndex((h) => h.includes("name") || h.includes("اسم"));
  const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("هاتف") || h.includes("موبايل") || h.includes("mobile"));
  const statusIdx = headers.findIndex((h) => h.includes("status") || h.includes("حالة"));

  const parsed: Array<{ name: string; phone: string; status?: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = rawLine.split(",").map((col) => col.trim().replace(/^"(.*)"$/, "$1"));
    const name = nameIdx !== -1 ? cols[nameIdx] || "" : cols[0] || "";
    const phone = phoneIdx !== -1 ? cols[phoneIdx] || "" : cols[1] || "";
    const status = statusIdx !== -1 ? cols[statusIdx] : undefined;

    if (name.trim() || phone.trim()) {
      parsed.push({
        name: name.trim() || "Imported Lead",
        phone: phone.trim(),
        status: status?.trim() || "following",
      });
    }
  }

  return parsed;
}
