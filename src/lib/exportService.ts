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
 * Loads an image URL safely into a base64 Data URL for embedding into jsPDF.
 */
async function loadImageAsDataUrl(url: string): Promise<{ data: string; format: string; width: number; height: number } | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    const timer = setTimeout(() => {
      resolve(null);
    }, 4000); // 4s timeout

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 400;
        canvas.height = img.naturalHeight || img.height || 300;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const data = canvas.toDataURL('image/jpeg', 0.85);
        resolve({
          data,
          format: 'JPEG',
          width: canvas.width,
          height: canvas.height,
        });
      } catch (err) {
        console.warn('Canvas toDataURL failed in PDF export:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Generates a clean, professional, printable PDF for a single journal entry.
 */
export async function exportEntryToPdf(entry: JournalEntry): Promise<void> {
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
  if (entry.metadata?.placeLocation?.name) {
    metadataParts.push(`Place: ${entry.metadata.placeLocation.name}`);
  }
  if (entry.metadata?.weather) {
    metadataParts.push(`Weather: ${entry.metadata.weather.condition} (${entry.metadata.weather.temperature}°C)`);
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

  // Attached Photo
  const imageUrl = entry.attachedImage?.url || entry.metadata?.attachedImage?.url;
  if (imageUrl) {
    try {
      const imgData = await loadImageAsDataUrl(imageUrl);
      if (imgData) {
        // Calculate dimensions to fit neatly within contentWidth and max height 220pt
        const maxImgWidth = Math.min(contentWidth, 380);
        const maxImgHeight = 220;
        let renderWidth = maxImgWidth;
        let renderHeight = (imgData.height / imgData.width) * renderWidth;

        if (renderHeight > maxImgHeight) {
          renderHeight = maxImgHeight;
          renderWidth = (imgData.width / imgData.height) * renderHeight;
        }

        checkPageBreak(renderHeight + 35);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(26, 115, 232);
        doc.text('ATTACHED PHOTO', margin, cursorY);
        cursorY += 12;

        doc.addImage(imgData.data, 'JPEG', margin, cursorY, renderWidth, renderHeight);
        cursorY += renderHeight + 16;
      } else {
        checkPageBreak(30);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(120, 130, 140);
        doc.text(`[Attached Photo: ${entry.attachedImage?.fileName || 'photo.jpg'}]`, margin, cursorY);
        cursorY += 16;
      }
    } catch (e) {
      console.warn('Failed to embed image into single entry PDF:', e);
    }
  }

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
export async function exportAllEntriesToPdf(entries: JournalEntry[]): Promise<void> {
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

  for (let idx = 0; idx < activeEntries.length; idx++) {
    const entry = activeEntries[idx];
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

    // Optional image
    const imageUrl = entry.attachedImage?.url || entry.metadata?.attachedImage?.url;
    if (imageUrl) {
      try {
        const imgData = await loadImageAsDataUrl(imageUrl);
        if (imgData) {
          const maxW = Math.min(contentWidth, 300);
          const maxH = 160;
          let rW = maxW;
          let rH = (imgData.height / imgData.width) * rW;
          if (rH > maxH) {
            rH = maxH;
            rW = (imgData.width / imgData.height) * rH;
          }
          checkPageBreak(rH + 20);
          doc.addImage(imgData.data, 'JPEG', margin, cursorY, rW, rH);
          cursorY += rH + 12;
        }
      } catch (e) {
        console.warn('Failed to embed image in vault PDF export:', e);
      }
    }

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
  }

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
  if (entry.metadata?.placeLocation?.name) {
    md += `**Location:** ${entry.metadata.placeLocation.name} (${entry.metadata.placeLocation.formattedAddress})\n`;
  }
  if (entry.metadata?.weather) {
    md += `**Weather:** ${entry.metadata.weather.condition} ${entry.metadata.weather.conditionEmoji || ''} · ${entry.metadata.weather.temperature}°C\n`;
  }

  const imageUrl = entry.attachedImage?.url || entry.metadata?.attachedImage?.url;
  if (imageUrl) {
    md += `\n**Attached Photo:**\n![${entry.attachedImage?.fileName || 'Attached Reflection Photo'}](${imageUrl})\n`;
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
  if (entry.metadata?.placeLocation?.name) {
    txt += `Location: ${entry.metadata.placeLocation.name}\n`;
  }
  if (entry.metadata?.weather) {
    txt += `Weather: ${entry.metadata.weather.condition} (${entry.metadata.weather.temperature}°C)\n`;
  }
  const imageUrl = entry.attachedImage?.url || entry.metadata?.attachedImage?.url;
  if (imageUrl) {
    txt += `Attached Photo: ${entry.attachedImage?.fileName || 'photo'} (${imageUrl})\n`;
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
    const imageUrl = entry.attachedImage?.url || entry.metadata?.attachedImage?.url;
    if (imageUrl) {
      txt += `Attached Photo: ${entry.attachedImage?.fileName || 'photo'} (${imageUrl})\n`;
    }
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
    attachedImage: entry.attachedImage || entry.metadata?.attachedImage || null,
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
      attachedImage: entry.attachedImage || entry.metadata?.attachedImage || null,
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

/**
 * Interface for Mood Trends Export data payload.
 */
export interface MoodTrendsExportData {
  timeRange: '14d' | '30d' | '90d' | 'all';
  timeRangeLabel: string;
  activeTab: 'timeline' | 'frequency';
  stats: {
    totalMoodEntries: number;
    uniqueMoodCount: number;
    activeDays: number;
    topMood: string;
    topEmoji: string;
    topCount: number;
    distribution: Array<{
      count: number;
      config: {
        label: string;
        emoji: string;
        level: number;
        color: string;
      };
    }>;
  };
  chartPoints: Array<{
    entry: JournalEntry;
    config: {
      label: string;
      emoji: string;
      level: number;
      color: string;
    };
    x: number;
    y: number;
  }>;
  filteredEntries: JournalEntry[];
  weatherPatterns?: {
    hasSufficientData: boolean;
    totalWeatherEntries: number;
    primaryObservation: string;
    secondaryObservation?: string;
    conditionBreakdown: Array<{
      category: string;
      label: string;
      emoji: string;
      count: number;
      avgWords: number;
      topMood?: string;
    }>;
  } | null;
  language?: string;
}

/**
 * Client-side HTML5 Canvas renderer for high-resolution Mood Trends charts (Trajectory or Frequency).
 */
export function renderMoodTrendsCanvas(data: MoodTrendsExportData): HTMLCanvasElement {
  const width = 1200;
  const height = 640;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Outer border & subtle shadow frame
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Top Accent Gradient Bar
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#1A73E8');
  gradient.addColorStop(0.5, '#7B1FA2');
  gradient.addColorStop(1, '#E91E63');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, 6);

  // Header Title & Logo
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('Inkwell', 40, 46);

  ctx.fillStyle = '#64748B';
  ctx.font = '500 16px system-ui, -apple-system, sans-serif';
  const subTitleText = data.activeTab === 'timeline' 
    ? '• Mood Trends & Emotional Trajectory' 
    : '• Mood Frequency & Distribution';
  ctx.fillText(subTitleText, 126, 46);

  // Right side badges: Scope & Export date
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const badgeText = `${data.timeRangeLabel} • ${dateStr}`;
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  const badgeWidth = ctx.measureText(badgeText).width + 24;
  const badgeX = width - 40 - badgeWidth;

  ctx.fillStyle = '#F1F5F9';
  ctx.beginPath();
  ctx.roundRect(badgeX, 26, badgeWidth, 28, 14);
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.fillText(badgeText, badgeX + 12, 45);

  // Header separator
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, 68);
  ctx.lineTo(width - 40, 68);
  ctx.stroke();

  // Metrics Stat Cards Row (4 cards)
  const cardY = 82;
  const cardHeight = 64;
  const totalCards = 4;
  const cardSpacing = 16;
  const totalSpacing = cardSpacing * (totalCards - 1);
  const cardWidth = (width - 80 - totalSpacing) / totalCards;

  const statItems = [
    { label: 'Total Reflections', value: `${data.stats.totalMoodEntries}` },
    { label: 'Dominant Mood', value: `${data.stats.topEmoji} ${data.stats.topMood}` },
    { label: 'Unique Moods', value: `${data.stats.uniqueMoodCount}` },
    { label: 'Active Days', value: `${data.stats.activeDays}` },
  ];

  statItems.forEach((item, idx) => {
    const cx = 40 + idx * (cardWidth + cardSpacing);
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.roundRect(cx, cardY, cardWidth, cardHeight, 12);
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#64748B';
    ctx.font = '500 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(item.label, cx + 14, cardY + 24);

    // Value
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillText(item.value, cx + 14, cardY + 50);
  });

  // Chart Canvas Area
  const chartAreaX = 40;
  const chartAreaY = 166;
  const chartAreaWidth = width - 80;
  const chartAreaHeight = 410;

  // Outer Chart Box
  ctx.fillStyle = '#FAFAFA';
  ctx.beginPath();
  ctx.roundRect(chartAreaX, chartAreaY, chartAreaWidth, chartAreaHeight, 16);
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (data.activeTab === 'timeline') {
    // TIMELINE CHART
    const paddingX = 60;
    const paddingY = 48;
    const innerW = chartAreaWidth - paddingX * 2;
    const innerH = chartAreaHeight - paddingY * 2;

    const lanes = [
      { level: 4, label: 'High Energy / Joy (Optimistic, Inspired, Energized)' },
      { level: 3, label: 'Centered & Grounded (Grateful, Calm)' },
      { level: 2, label: 'Contemplative (Reflective)' },
      { level: 1, label: 'Tension / Effort (Challenged, Anxious)' },
    ];

    const getCanvasY = (level: number) => {
      const normalized = (level - 1) / 3;
      return chartAreaY + paddingY + (1 - normalized) * innerH;
    };

    // Draw horizontal dashed grid lines & labels
    lanes.forEach((lane) => {
      const ly = getCanvasY(lane.level);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(chartAreaX + paddingX, ly);
      ctx.lineTo(chartAreaX + chartAreaWidth - paddingX, ly);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(lane.label, chartAreaX + paddingX, ly - 8);
    });

    if (data.filteredEntries.length === 0) {
      // Empty State
      ctx.fillStyle = '#64748B';
      ctx.font = '600 16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No mood reflections recorded for this time range', width / 2, chartAreaY + chartAreaHeight / 2);
      ctx.textAlign = 'left';
    } else {
      const count = data.filteredEntries.length;
      const pts = data.chartPoints.map((pt, idx) => {
        const x = count === 1
          ? chartAreaX + chartAreaWidth / 2
          : chartAreaX + paddingX + (idx / (count - 1)) * innerW;
        const y = getCanvasY(pt.config.level);
        return { ...pt, canvasX: x, canvasY: y };
      });

      // Area fill under curve
      if (pts.length > 1) {
        ctx.beginPath();
        pts.forEach((pt, idx) => {
          if (idx === 0) {
            ctx.moveTo(pt.canvasX, pt.canvasY);
          } else {
            const prev = pts[idx - 1];
            const cp1x = prev.canvasX + (pt.canvasX - prev.canvasX) / 2;
            const cp1y = prev.canvasY;
            const cp2x = prev.canvasX + (pt.canvasX - prev.canvasX) / 2;
            const cp2y = pt.canvasY;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pt.canvasX, pt.canvasY);
          }
        });
        const bottomY = chartAreaY + chartAreaHeight - paddingY + 16;
        ctx.lineTo(pts[pts.length - 1].canvasX, bottomY);
        ctx.lineTo(pts[0].canvasX, bottomY);
        ctx.closePath();

        const areaGrad = ctx.createLinearGradient(0, chartAreaY + paddingY, 0, bottomY);
        areaGrad.addColorStop(0, 'rgba(26, 115, 232, 0.2)');
        areaGrad.addColorStop(1, 'rgba(26, 115, 232, 0.0)');
        ctx.fillStyle = areaGrad;
        ctx.fill();
      }

      // Smooth Curve Line
      if (pts.length > 1) {
        ctx.beginPath();
        pts.forEach((pt, idx) => {
          if (idx === 0) {
            ctx.moveTo(pt.canvasX, pt.canvasY);
          } else {
            const prev = pts[idx - 1];
            const cp1x = prev.canvasX + (pt.canvasX - prev.canvasX) / 2;
            const cp1y = prev.canvasY;
            const cp2x = prev.canvasX + (pt.canvasX - prev.canvasX) / 2;
            const cp2y = pt.canvasY;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pt.canvasX, pt.canvasY);
          }
        });
        ctx.strokeStyle = '#1A73E8';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      // Data Points and Date Labels
      pts.forEach((pt, i) => {
        // Point halo
        ctx.fillStyle = `${pt.config.color}33`;
        ctx.beginPath();
        ctx.arc(pt.canvasX, pt.canvasY, 10, 0, Math.PI * 2);
        ctx.fill();

        // Point circle
        ctx.fillStyle = pt.config.color;
        ctx.beginPath();
        ctx.arc(pt.canvasX, pt.canvasY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Date tick label below
        const shouldShowDate = count <= 12 || i === 0 || i === count - 1 || i % Math.ceil(count / 7) === 0;
        if (shouldShowDate) {
          const dateObj = new Date(pt.entry.createdAt);
          const dLabel = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          ctx.fillStyle = '#64748B';
          ctx.font = '500 11px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(dLabel, pt.canvasX, chartAreaY + chartAreaHeight - 14);
          ctx.textAlign = 'left';
        }
      });
    }
  } else {
    // FREQUENCY DISTRIBUTION VIEW
    const dist = data.stats.distribution;
    if (dist.length === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '600 16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No mood reflections recorded for this time range', width / 2, chartAreaY + chartAreaHeight / 2);
      ctx.textAlign = 'left';
    } else {
      const topRows = dist.slice(0, 6);
      const rowHeight = (chartAreaHeight - 48) / Math.max(topRows.length, 1);

      topRows.forEach((item, idx) => {
        const ry = chartAreaY + 24 + idx * rowHeight;
        const percent = data.stats.totalMoodEntries > 0
          ? Math.round((item.count / data.stats.totalMoodEntries) * 100)
          : 0;

        // Emoji & Label
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${item.config.emoji}  ${item.config.label}`, chartAreaX + 32, ry + 18);

        // Count & percentage text (right side)
        const countStr = `${item.count} reflections (${percent}%)`;
        ctx.font = '600 13px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#475569';
        const countW = ctx.measureText(countStr).width;
        ctx.fillText(countStr, chartAreaX + chartAreaWidth - 32 - countW, ry + 18);

        // Progress bar track
        const barX = chartAreaX + 32;
        const barY = ry + 26;
        const barMaxW = chartAreaWidth - 64;
        const barH = 12;

        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barMaxW, barH, 6);
        ctx.fill();

        // Progress bar fill
        const fillW = Math.max((percent / 100) * barMaxW, item.count > 0 ? 8 : 0);
        ctx.fillStyle = item.config.color;
        ctx.beginPath();
        ctx.roundRect(barX, barY, fillW, barH, 6);
        ctx.fill();
      });
    }
  }

  // Footer Watermark & Privacy note
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Observational emotional patterns • For personal self-reflection', 40, height - 20);

  const watermark = 'Inkwell Journal • Private & Local Vault';
  const wmWidth = ctx.measureText(watermark).width;
  ctx.fillText(watermark, width - 40 - wmWidth, height - 20);

  return canvas;
}

/**
 * Downloads the current Mood Trends chart view as a high-resolution PNG image.
 */
export async function exportMoodTrendsToPng(data: MoodTrendsExportData): Promise<void> {
  const canvas = renderMoodTrendsCanvas(data);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadFile(blob, `inkwell_mood_trends_${data.timeRange}_${dateStr}.png`, 'image/png');
      }
      resolve();
    }, 'image/png');
  });
}

/**
 * Generates and downloads a clean, printable PDF report of Mood Trends.
 */
export async function exportMoodTrendsToPdf(data: MoodTrendsExportData): Promise<void> {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const addHeaderBanner = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('Inkwell Journal — Mood Trends & Emotional Trajectory', margin, 24);
    const dateStr = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    doc.text(`Exported: ${dateStr}`, pageWidth - margin - 80, 24);
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, 28, pageWidth - margin, 28);
  };

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin - 20) {
      doc.addPage();
      cursorY = margin;
      addHeaderBanner();
    }
  };

  // 1. Initial Page Header
  addHeaderBanner();
  cursorY = 50;

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(26, 30, 36);
  doc.text('Mood Trends & Emotional Trajectory', margin, cursorY);
  cursorY += 22;

  // Subtitle / Scope
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 110, 120);
  const nowFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Scope: ${data.timeRangeLabel}  •  Report Date: ${nowFormatted}`, margin, cursorY);
  cursorY += 18;

  // Divider
  doc.setDrawColor(220, 226, 235);
  doc.setLineWidth(1);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 16;

  // 2. Summary Metric Cards (4 boxes in row)
  const cardW = (contentWidth - 30) / 4;
  const cardH = 46;
  const cards = [
    { label: 'Total Reflections', val: `${data.stats.totalMoodEntries}` },
    { label: 'Dominant Mood', val: `${data.stats.topMood}` },
    { label: 'Unique Moods', val: `${data.stats.uniqueMoodCount}` },
    { label: 'Active Days', val: `${data.stats.activeDays}` },
  ];

  cards.forEach((c, idx) => {
    const cx = margin + idx * (cardW + 10);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, cursorY, cardW, cardH, 6, 6, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, cx + 8, cursorY + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(c.val, cx + 8, cursorY + 34);
  });
  cursorY += cardH + 20;

  // 3. Visual Chart Image
  try {
    const chartCanvas = renderMoodTrendsCanvas(data);
    const chartDataUrl = chartCanvas.toDataURL('image/png');
    const chartRenderWidth = contentWidth;
    const chartRenderHeight = (chartCanvas.height / chartCanvas.width) * chartRenderWidth;

    checkPageBreak(chartRenderHeight + 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(26, 30, 36);
    doc.text(data.activeTab === 'timeline' ? 'MOOD TRAJECTORY VISUALIZATION' : 'MOOD FREQUENCY DISTRIBUTION', margin, cursorY);
    cursorY += 14;

    doc.addImage(chartDataUrl, 'PNG', margin, cursorY, chartRenderWidth, chartRenderHeight);
    cursorY += chartRenderHeight + 20;
  } catch (err) {
    console.warn('Unable to embed chart canvas into PDF:', err);
  }

  // 4. Mood Frequency Breakdown Table
  if (data.stats.distribution.length > 0) {
    checkPageBreak(80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(26, 30, 36);
    doc.text('MOOD FREQUENCY BREAKDOWN', margin, cursorY);
    cursorY += 16;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, cursorY, contentWidth, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Mood / Emotional State', margin + 8, cursorY + 13);
    doc.text('Reflections', margin + 220, cursorY + 13);
    doc.text('Percentage', margin + 330, cursorY + 13);
    doc.text('Level Scale', margin + 420, cursorY + 13);
    cursorY += 20;

    data.stats.distribution.forEach((item, index) => {
      checkPageBreak(20);
      const rowY = cursorY;
      const percent = data.stats.totalMoodEntries > 0
        ? Math.round((item.count / data.stats.totalMoodEntries) * 100)
        : 0;

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, rowY, contentWidth, 18, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(item.config.label, margin + 8, rowY + 12);
      doc.text(`${item.count}`, margin + 220, rowY + 12);
      doc.text(`${percent}%`, margin + 330, rowY + 12);
      doc.text(`Level ${item.config.level} of 4`, margin + 420, rowY + 12);

      cursorY += 18;
    });

    cursorY += 18;
  }

  // 5. Chronological Reflection Sequence
  if (data.filteredEntries.length > 0) {
    checkPageBreak(90);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(26, 30, 36);
    doc.text(`RECORDED REFLECTION SEQUENCE (${data.filteredEntries.length})`, margin, cursorY);
    cursorY += 16;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, cursorY, contentWidth, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Date & Time', margin + 8, cursorY + 13);
    doc.text('Reflection Title', margin + 140, cursorY + 13);
    doc.text('Mood Tag', margin + 420, cursorY + 13);
    cursorY += 20;

    data.filteredEntries.forEach((entry, idx) => {
      checkPageBreak(18);
      const rowY = cursorY;
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, rowY, contentWidth, 18, 'F');
      }

      const dateObj = new Date(entry.createdAt);
      const dateText = dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(dateText, margin + 8, rowY + 12);

      const titleText = (entry.title || 'Untitled Reflection').slice(0, 50);
      doc.text(titleText, margin + 140, rowY + 12);

      const moodText = entry.metadata?.mood || 'Reflective';
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 115, 232);
      doc.text(moodText, margin + 420, rowY + 12);

      cursorY += 18;
    });

    cursorY += 20;
  }

  // 6. Ambient Weather Patterns Correlation (if present)
  if (data.weatherPatterns && data.weatherPatterns.totalWeatherEntries > 0) {
    checkPageBreak(120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(26, 30, 36);
    doc.text('AMBIENT WEATHER & WRITING PATTERNS', margin, cursorY);
    cursorY += 14;

    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(186, 230, 253);
    const boxHeight = data.weatherPatterns.secondaryObservation ? 54 : 40;
    doc.roundedRect(margin, cursorY, contentWidth, boxHeight, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(3, 105, 161);
    doc.text(`Observations across ${data.weatherPatterns.totalWeatherEntries} weather-tagged reflections:`, margin + 10, cursorY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(12, 74, 110);
    doc.text(data.weatherPatterns.primaryObservation, margin + 10, cursorY + 28);
    if (data.weatherPatterns.secondaryObservation) {
      doc.text(data.weatherPatterns.secondaryObservation, margin + 10, cursorY + 42);
    }
    cursorY += boxHeight + 14;

    if (data.weatherPatterns.conditionBreakdown && data.weatherPatterns.conditionBreakdown.length > 0) {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, cursorY, contentWidth, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Atmospheric Condition', margin + 8, cursorY + 12);
      doc.text('Reflections', margin + 200, cursorY + 12);
      doc.text('Avg. Words', margin + 300, cursorY + 12);
      doc.text('Most Common Mood', margin + 400, cursorY + 12);
      cursorY += 18;

      data.weatherPatterns.conditionBreakdown.forEach((cond, idx) => {
        checkPageBreak(16);
        const rowY = cursorY;
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, rowY, contentWidth, 16, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(cond.label, margin + 8, rowY + 11);
        doc.text(`${cond.count}`, margin + 200, rowY + 11);
        doc.text(`~${cond.avgWords} words`, margin + 300, rowY + 11);
        doc.text(cond.topMood || '—', margin + 400, rowY + 11);

        cursorY += 16;
      });

      cursorY += 16;
    }
  }

  // 7. Privacy & Observational Notice Banner
  checkPageBreak(45);
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 34, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Observational Reflection Notice:', margin + 10, cursorY + 14);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('This report captures observational emotional states over time for personal reflection. No diagnostic or medical claims are made.', margin + 10, cursorY + 26);
  cursorY += 45;

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text('Inkwell Journal — Private & Local Vault', margin, pageHeight - 20);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin - 40, pageHeight - 20);
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`inkwell_mood_trends_report_${data.timeRange}_${dateStr}.pdf`);
}
