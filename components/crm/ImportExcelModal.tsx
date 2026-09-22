"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { createLead, LEAD_STATUSES, STATUS_LABELS, type LeadStatus } from "@/services/firebase/leads";
import { parseExcelOrCSV, type ParsedLead } from "@/lib/utils/excel";
import {
  HiOutlineXMark,
  HiOutlineArrowUpTray,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { FaFileExcel } from "react-icons/fa";

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ImportExcelModal({ isOpen, onClose, onSuccess }: ImportExcelModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [defaultStatus, setDefaultStatus] = useState<LeadStatus>("following");

  if (!isOpen) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    processFile(droppedFile);
  }

  async function processFile(selectedFile: File) {
    const isExcelOrCsv =
      selectedFile.name.endsWith(".xlsx") ||
      selectedFile.name.endsWith(".xls") ||
      selectedFile.name.endsWith(".csv");

    if (!isExcelOrCsv) {
      showToast("Please upload an Excel (.xlsx, .xls) or CSV (.csv) file", "error");
      return;
    }

    setFile(selectedFile);
    setParsing(true);

    try {
      const result = await parseExcelOrCSV(selectedFile);
      if (result.validLeads === 0) {
        showToast("No valid phone numbers found in this sheet", "error");
        setParsedLeads([]);
      } else {
        setParsedLeads(result.leads);
        showToast(`Found ${result.validLeads} valid leads!`, "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to parse sheet. Please ensure file is valid.", "error");
      setParsedLeads([]);
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (!user || parsedLeads.length === 0) return;

    setImporting(true);
    setProgress(0);
    let successCount = 0;

    const total = parsedLeads.length;

    for (let i = 0; i < total; i++) {
      const item = parsedLeads[i];
      try {
        await createLead(user.uid, {
          name: item.name,
          phone: item.phone,
          status: defaultStatus,
        });
        successCount++;
      } catch (err) {
        console.error("Failed to insert lead:", item, err);
      }
      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setImporting(false);
    showToast(`Successfully imported ${successCount} leads!`, "success");
    onSuccess?.();
    handleClose();
  }

  function handleClose() {
    setFile(null);
    setParsedLeads([]);
    setProgress(0);
    setImporting(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FaFileExcel size={20} color="#16a34a" />
            <h3>Import Excel / CSV Sheet</h3>
          </div>
          <button className="btn-ghost btn-icon" onClick={handleClose}>
            <HiOutlineXMark size={20} />
          </button>
        </div>

        <div className="modal-body">
          {!file && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--border-strong)",
                borderRadius: "var(--radius-lg)",
                padding: "36px 20px",
                textAlign: "center",
                backgroundColor: "#f8fafc",
                cursor: "pointer",
                transition: "var(--ease-smooth)",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  color: "#475569",
                }}
              >
                <HiOutlineArrowUpTray size={22} />
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Click to upload or drag & drop Excel sheet
              </h4>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Supports .xlsx, .xls, and .csv files
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 10,
                  fontSize: 11,
                  color: "#0f172a",
                  background: "#ffffff",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <HiOutlineSparkles size={13} color="#f59e0b" />
                <span>Works even if sheet contains phone numbers only without names</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          )}

          {parsing && (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "3px solid #e2e8f0",
                  borderTopColor: "var(--primary)",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 12px",
                }}
              />
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Analyzing & extracting contacts...</p>
            </div>
          )}

          {file && !parsing && parsedLeads.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#f0fdf4",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid #bbf7d0",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <HiOutlineDocumentText size={18} color="#16a34a" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>{file.name}</span>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: "#16a34a",
                    color: "#fff",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                  }}
                >
                  {parsedLeads.length} Leads
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Set Default Status for Imported Leads</label>
                <select
                  className="form-input"
                  value={defaultStatus}
                  onChange={(e) => setDefaultStatus(e.target.value as LeadStatus)}
                >
                  {LEAD_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                  Preview (First 5 Rows):
                </label>
                <div
                  style={{
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    maxHeight: 180,
                    overflowY: "auto",
                  }}
                >
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border-default)" }}>
                        <th style={{ padding: "6px 10px", textAlign: "left" }}>#</th>
                        <th style={{ padding: "6px 10px", textAlign: "left" }}>Name</th>
                        <th style={{ padding: "6px 10px", textAlign: "left" }}>Phone (Formatted)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedLeads.slice(0, 5).map((l, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "6px 10px", color: "var(--text-tertiary)" }}>{i + 1}</td>
                          <td style={{ padding: "6px 10px", fontWeight: 600 }}>{l.name}</td>
                          <td style={{ padding: "6px 10px", direction: "ltr", color: "var(--text-secondary)" }}>
                            {l.phone}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {importing && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span>Importing leads...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="settings-quota-bar">
                    <div className="settings-quota-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose} disabled={importing}>
            Cancel
          </button>
          {file && (
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={importing || parsedLeads.length === 0}
            >
              <HiOutlineCheckCircle size={16} /> {importing ? "Importing..." : `Import ${parsedLeads.length} Leads`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
