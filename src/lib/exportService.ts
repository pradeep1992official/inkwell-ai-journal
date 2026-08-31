import { jsPDF } from 'jspdf';
import { JournalEntry } from '../types';

/**
 * Formats a timestamp into a human-readable string.
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Triggers a browser file download using a Blob.
 */
function downloadFile(content: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Cleans Markdown formatting to readable plain text for PDF lines.
 */
function stripMarkdown(md: string): string {
  return md
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .trim();
}

/**
 * Generates a clean, professional, printable PDF for a single journal entry.
 */
export function exportEntryToPdf(entry: JournalEntry) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin - 20) {
      doc.addPage();
      cursorY = margin;
      addHeaderBanner();
    }
  };

  const addHeaderBanner = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('Inkwell Reflection Journal', margin, 24);
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, 28, pageWidth - margin, 28);
  };

  // Top header banner
  addHeaderBanner();
  cursorY = 50;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(26, 30, 36);
  const titleLines = doc.splitTextToSize(entry.title || 'Untitled Reflection', contentWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += titleLines.length * 24 + 4;

  // Date & Time
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 110, 120);
  doc.text(`Recorded on: ${formatDate(entry.createdAt || entry.updatedAt)}`, margin, cursorY);
  cursorY += 16;

  // Metadata pills / info
  const metadataParts: string[] = [];
  if (entry.metadata?.mood) {
    metadataParts.push(`Mood: ${entry.metadata.mood}`);
  }
  if (entry.metadata?.tags && entry.metadata.tags.length > 0) {
    metadataParts.push(`Tags: ${entry.metadata.tags.join(', ')}`);
  }
  if (entry.messages.length > 0 && entry.messages[0].mode) {
    metadataParts.push(`Mode: ${entry.messages[0].mode}`);
  }

  if (metadataParts.length > 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(80, 90, 100);
    const metaText = metadataParts.join('  •  ');
    const metaLines = doc.splitTextToSize(metaText, contentWidth);
    doc.text(metaLines, margin, cursorY);
    cursorY += metaLines.length * 12 + 8;
  }

  // Divider
  doc.setDrawColor(220, 226, 235);
  doc.setLineWidth(1);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 18;

  // Optional Executive Summary / Insights if present
  if (entry.summary) {
    checkPageBreak(50);
    doc.setFillColor(245, 248, 255);
    doc.setDrawColor(210, 225, 250);
    doc.roundedRect(margin, cursorY, contentWidth, 40, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(26, 115, 232);
    doc.text('SYNTHESIS SUMMARY', margin + 10, cursorY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 50, 60);
    const summaryLines = doc.splitTextToSize(entry.summary, contentWidth - 20);
    doc.text(summaryLines, margin + 10, cursorY + 28);
    cursorY += Math.max(46, summaryLines.length * 13 + 24);
  }

  // Conversation turns
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 40, 50);
  doc.text('Conversation & Reflections', margin, cursorY);
  cursorY += 16;

  if (entry.messages.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(130, 140, 150);
    doc.text('(No messages recorded in this entry)', margin, cursorY);
    cursorY += 20;
  } else {
    for (const msg of entry.messages) {
      const isUser = msg.role === 'user';
      const senderLabel = isUser ? 'You' : 'Gemini AI';
      const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const rawContent = stripMarkdown(msg.content);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const headerLines = `${senderLabel}  —  ${timeStr}`;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const textLines = doc.splitTextToSize(rawContent, contentWidth - 16);
      const boxHeight = textLines.length * 14 + 26;

      checkPageBreak(boxHeight + 10);

      // Background card
      if (isUser) {
        doc.setFillColor(248, 249, 251);
        doc.setDrawColor(230, 234, 240);
      } else {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(218, 226, 238);
      }
      doc.roundedRect(margin, cursorY, contentWidth, boxHeight, 4, 4, 'FD');

      // Sender badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      if (isUser) {
        doc.setTextColor(50, 70, 90);
      } else {
        doc.setTextColor(26, 115, 232);
      }
      doc.text(headerLines, margin + 8, cursorY + 12);

      // Body text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(35, 45, 55);
      doc.text(textLines, margin + 8, cursorY + 26);

      cursorY += boxHeight + 10;
    }
  }

  // Page numbers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 50, pageHeight - 15);
  }

  const cleanTitle = (entry.title || 'reflection').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`inkwell_${cleanTitle}_${entry.id.slice(0, 8)}.pdf`);
}

/**
 * Generates a clean PDF containing all user entries combined.
 */
export function exportAllEntriesToPdf(entries: JournalEntry[]) {
  const activeEntries = entries.filter((e) => !e.deletedAt);
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin - 20) {
      doc.addPage();
      cursorY = margin;
    }
  };

  // Cover / Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(26, 30, 36);
  doc.text('Inkwell Journal Vault', margin, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 110, 120);
  doc.text(`Exported on ${new Date().toLocaleDateString()}  •  Total Reflections: ${activeEntries.length}`, margin, 78);

  doc.setDrawColor(220, 226, 235);
  doc.line(margin, 90, pageWidth - margin, 90);
  cursorY = 110;

  activeEntries.forEach((entry, idx) => {
    checkPageBreak(80);

    // Entry header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(26, 115, 232);
    doc.text(`${idx + 1}. ${entry.title || 'Untitled Reflection'}`, margin, cursorY);
    cursorY += 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 130, 140);
    doc.text(`Date: ${formatDate(entry.createdAt || entry.updatedAt)} | Mood: ${entry.metadata?.mood || 'None'}`, margin, cursorY);
    cursorY += 14;

    if (entry.summary) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(60, 70, 80);
      const sumLines = doc.splitTextToSize(`Summary: ${entry.summary}`, contentWidth);
      doc.text(sumLines, margin, cursorY);
      cursorY += sumLines.length * 12 + 6;
    }

    // Messages
    for (const msg of entry.messages) {
      const isUser = msg.role === 'user';
      const sender = isUser ? 'You' : 'Gemini AI';
      const raw = stripMarkdown(msg.content);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(isUser ? 60 : 26, isUser ? 70 : 115, isUser ? 80 : 232);
      checkPageBreak(25);
      doc.text(`[${sender}]`, margin, cursorY);
      cursorY += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40, 50, 60);
      const textLines = doc.splitTextToSize(raw, contentWidth);
      checkPageBreak(textLines.length * 11 + 6);
      doc.text(textLines, margin, cursorY);
      cursorY += textLines.length * 11 + 8;
    }

    cursorY += 12;
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 18;
  });

  // Number pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 50, pageHeight - 15);
  }

  doc.save(`inkwell_vault_export_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Generates a Markdown (.md) string for an entry.
 */
export function exportEntryToMarkdown(entry: JournalEntry): string {
  let md = `# ${entry.title || 'Untitled Reflection'}\n\n`;
  md += `**Date:** ${formatDate(entry.createdAt || entry.updatedAt)}\n`;
  if (entry.metadata?.mood) md += `**Mood:** ${entry.metadata.mood}\n`;
  if (entry.metadata?.tags && entry.metadata.tags.length > 0) {
    md += `**Tags:** ${entry.metadata.tags.join(', ')}\n`;
  }
  md += `\n---\n\n`;

  if (entry.summary) {
    md += `### Summary & Synthesis\n\n${entry.summary}\n\n---\n\n`;
  }

  md += `### Conversation\n\n`;
  if (entry.messages.length === 0) {
    md += `*(No messages recorded)*\n`;
  } else {
    for (const msg of entry.messages) {
      const isUser = msg.role === 'user';
      const sender = isUser ? 'You' : 'Gemini AI';
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      md += `#### ${sender} (${time})\n\n${msg.content}\n\n`;
    }
  }

  return md;
}

/**
 * Downloads a single entry in Markdown.
 */
export function downloadEntryMarkdown(entry: JournalEntry) {
  const md = exportEntryToMarkdown(entry);
  const cleanTitle = (entry.title || 'reflection').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadFile(md, `inkwell_${cleanTitle}_${entry.id.slice(0, 8)}.md`, 'text/markdown;charset=utf-8');
}

/**
 * Downloads all entries in Markdown.
 */
export function downloadAllEntriesMarkdown(entries: JournalEntry[]) {
  const activeEntries = entries.filter((e) => !e.deletedAt);
  let fullMd = `# Inkwell Journal Vault Export\n\n*Exported on ${new Date().toLocaleDateString()} — Total Reflections: ${activeEntries.length}*\n\n---\n\n`;
  for (const entry of activeEntries) {
    fullMd += exportEntryToMarkdown(entry);
    fullMd += `\n\n=========================================\n\n`;
  }
  downloadFile(fullMd, `inkwell_all_reflections_${new Date().toISOString().slice(0, 10)}.md`, 'text/markdown;charset=utf-8');
}

/**
 * Downloads a single entry in Plain Text (.txt).
 */
export function downloadEntryPlainText(entry: JournalEntry) {
  let txt = `INKWELL REFLECTION\n`;
  txt += `===================\n`;
  txt += `Title: ${entry.title || 'Untitled Reflection'}\n`;
  txt += `Date: ${formatDate(entry.createdAt || entry.updatedAt)}\n`;
  if (entry.metadata?.mood) txt += `Mood: ${entry.metadata.mood}\n`;
  if (entry.metadata?.tags && entry.metadata.tags.length > 0) {
    txt += `Tags: ${entry.metadata.tags.join(', ')}\n`;
  }
  txt += `\n`;

  if (entry.summary) {
    txt += `SUMMARY:\n${stripMarkdown(entry.summary)}\n\n`;
  }

  txt += `MESSAGES:\n`;
  for (const msg of entry.messages) {
    const sender = msg.role === 'user' ? 'YOU' : 'GEMINI AI';
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    txt += `\n[${sender} - ${time}]\n${stripMarkdown(msg.content)}\n`;
  }

  const cleanTitle = (entry.title || 'reflection').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadFile(txt, `inkwell_${cleanTitle}_${entry.id.slice(0, 8)}.txt`, 'text/plain;charset=utf-8');
}

/**
 * Downloads all entries in Plain Text (.txt).
 */
export function downloadAllEntriesPlainText(entries: JournalEntry[]) {
  const activeEntries = entries.filter((e) => !e.deletedAt);
  let txt = `INKWELL JOURNAL VAULT EXPORT\n`;
  txt += `============================\n`;
  txt += `Date: ${new Date().toLocaleString()}\n`;
  txt += `Total Entries: ${activeEntries.length}\n\n`;

  for (const entry of activeEntries) {
    txt += `----------------------------------------\n`;
    txt += `Title: ${entry.title || 'Untitled Reflection'}\n`;
    txt += `Date: ${formatDate(entry.createdAt || entry.updatedAt)}\n`;
    if (entry.metadata?.mood) txt += `Mood: ${entry.metadata.mood}\n`;
    if (entry.summary) txt += `Summary: ${stripMarkdown(entry.summary)}\n`;
    txt += `\nMessages:\n`;
    for (const msg of entry.messages) {
      const sender = msg.role === 'user' ? 'YOU' : 'GEMINI AI';
      txt += `[${sender}] ${stripMarkdown(msg.content)}\n`;
    }
    txt += `\n\n`;
  }

  downloadFile(txt, `inkwell_all_reflections_${new Date().toISOString().slice(0, 10)}.txt`, 'text/plain;charset=utf-8');
}

/**
 * Downloads a single entry in human-readable structured JSON.
 */
export function downloadEntryJson(entry: JournalEntry) {
  const exportData = {
    id: entry.id,
    title: entry.title,
    summary: entry.summary || null,
    metadata: entry.metadata || {},
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    messages: entry.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      mode: m.mode || null,
    })),
    exportedAt: new Date().toISOString(),
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const cleanTitle = (entry.title || 'reflection').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadFile(jsonStr, `inkwell_${cleanTitle}_${entry.id.slice(0, 8)}.json`, 'application/json;charset=utf-8');
}

/**
 * Downloads all entries in human-readable structured JSON.
 */
export function downloadAllEntriesJson(entries: JournalEntry[]) {
  const activeEntries = entries.filter((e) => !e.deletedAt);
  const exportData = {
    vault: 'Inkwell Journal',
    exportedAt: new Date().toISOString(),
    totalEntries: activeEntries.length,
    entries: activeEntries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      summary: entry.summary || null,
      metadata: entry.metadata || {},
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      messages: entry.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        mode: m.mode || null,
      })),
    })),
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  downloadFile(jsonStr, `inkwell_vault_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json;charset=utf-8');
}
