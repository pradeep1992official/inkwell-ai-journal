import { CalendarEventItem, DaySynthesisData, JournalEntry } from '../types';
import { getStoredCalendarToken } from './firebase';

/**
 * Default sample schedule matching the prompt scenario:
 * Today:
 * 9:00 AM — Meeting
 * 11:00 AM — Class
 * 2:00 PM — Project Review
 */
export const SAMPLE_TODAY_EVENTS: CalendarEventItem[] = [
  {
    id: 'sample-event-1',
    summary: 'Meeting',
    description: 'Quarterly strategy sync with design and product leads.',
    location: 'Conference Room B / Google Meet',
    start: { dateTime: new Date(new Date().setHours(9, 0, 0, 0)).toISOString() },
    end: { dateTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString() },
    startTimeFormatted: '9:00 AM',
    endTimeFormatted: '10:00 AM',
    timeDisplay: '9:00 AM',
  },
  {
    id: 'sample-event-2',
    summary: 'Class',
    description: 'Advanced Computer Science Seminar & Discussion.',
    location: 'Hall 402',
    start: { dateTime: new Date(new Date().setHours(11, 0, 0, 0)).toISOString() },
    end: { dateTime: new Date(new Date().setHours(12, 30, 0, 0)).toISOString() },
    startTimeFormatted: '11:00 AM',
    endTimeFormatted: '12:30 PM',
    timeDisplay: '11:00 AM',
  },
  {
    id: 'sample-event-3',
    summary: 'Project Review',
    description: 'Architecture review & milestone demonstration for Inkwell.',
    location: 'Innovation Lab',
    start: { dateTime: new Date(new Date().setHours(14, 0, 0, 0)).toISOString() },
    end: { dateTime: new Date(new Date().setHours(15, 30, 0, 0)).toISOString() },
    startTimeFormatted: '2:00 PM',
    endTimeFormatted: '3:30 PM',
    timeDisplay: '2:00 PM',
  },
];

/**
 * Formats a date or ISO string to a clean time string like "9:00 AM"
 */
export function formatEventTime(isoOrDateStr?: string): string {
  if (!isoOrDateStr) return 'All Day';
  try {
    const date = new Date(isoOrDateStr);
    if (isNaN(date.getTime())) return 'All Day';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return 'All Day';
  }
}

/**
 * Fetch calendar events for a specific target day from Google Calendar API
 */
export async function fetchCalendarEvents(
  token?: string | null,
  targetDate?: Date
): Promise<{ events: CalendarEventItem[]; isConnected: boolean; source: 'google' | 'sample' }> {
  const authToken = token || getStoredCalendarToken();
  const date = targetDate || new Date();

  // If no auth token is active, return sample events gracefully
  if (!authToken) {
    return {
      events: SAMPLE_TODAY_EVENTS,
      isConnected: false,
      source: 'sample',
    };
  }

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const timeMin = startOfDay.toISOString();
    const timeMax = endOfDay.toISOString();

    const response = await fetch(
      `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired
        return {
          events: SAMPLE_TODAY_EVENTS,
          isConnected: false,
          source: 'sample',
        };
      }
      throw new Error(`Calendar API returned ${response.status}`);
    }

    const data = await response.json();
    const rawEvents: any[] = Array.isArray(data.events) ? data.events : [];

    const formattedEvents: CalendarEventItem[] = rawEvents.map((item, idx) => {
      const startIso = item.start?.dateTime || item.start?.date;
      const endIso = item.end?.dateTime || item.end?.date;
      const startTime = formatEventTime(startIso);
      const endTime = formatEventTime(endIso);

      return {
        id: item.id || `event-${idx}`,
        summary: item.summary || 'Untitled Event',
        description: item.description || '',
        location: item.location || '',
        start: item.start || {},
        end: item.end || {},
        startTimeFormatted: startTime,
        endTimeFormatted: endTime,
        timeDisplay: startTime !== 'All Day' ? startTime : 'All Day',
        hangoutLink: item.hangoutLink,
        status: item.status,
        htmlLink: item.htmlLink,
      };
    });

    return {
      events: formattedEvents.length > 0 ? formattedEvents : [],
      isConnected: true,
      source: 'google',
    };
  } catch (error) {
    console.warn('Failed to fetch from Google Calendar API, falling back to sample schedule:', error);
    return {
      events: SAMPLE_TODAY_EVENTS,
      isConnected: false,
      source: 'sample',
    };
  }
}

/**
 * Synthesizes "How was my day?" via Gemini
 */
export async function requestDaySynthesis(params: {
  calendarEvents: CalendarEventItem[];
  journalEntries: JournalEntry[];
  targetDateStr?: string;
  language?: string;
  userName?: string;
}): Promise<DaySynthesisData> {
  const { calendarEvents, journalEntries, targetDateStr, language = 'en', userName } = params;

  // Extract meaningful text from today's journal entries
  const simplifiedEntries = journalEntries.map((e) => {
    const textLines: string[] = [];
    if (e.title) textLines.push(`Title: ${e.title}`);
    for (const msg of e.messages) {
      if (msg.role === 'user' && msg.content) {
        textLines.push(msg.content);
      }
    }
    return {
      title: e.title,
      text: textLines.join('\n\n'),
      mood: e.metadata?.mood,
      timestamp: e.createdAt,
      tags: e.metadata?.tags,
    };
  }).filter((e) => e.text.trim().length > 0);

  const response = await fetch('/api/calendar/synthesize-day', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      date: targetDateStr || new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
      calendarEvents,
      journalEntries: simplifiedEntries,
      language,
      userName,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Day synthesis request failed (${response.status})`);
  }

  const data: DaySynthesisData = await response.json();

  // Defense-in-depth sanitization helper for client consumption
  const cleanStr = (s?: any): string => {
    if (!s || typeof s !== 'string') return '';
    return s
      .replace(/\u00a0/g, ' ')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\n/g, '\n')
      .replace(/\\\\/g, '')
      .replace(/^(#+\s*|[-*•]\s*|\d+[\.\)]\s*)+/g, '')
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/^\*+([^*]+)\*+$/g, '$1')
      .trim();
  };

  const cleanedTheme = cleanStr(data.dayTheme) || 'Daily Synthesis';
  const cleanedMood = cleanStr(data.detectedMood) || 'Grounded';
  const cleanedSummary = cleanStr(data.summary);
  const cleanedGrounding = cleanStr(data.groundingThought);
  const cleanedIntention = cleanStr(data.tomorrowIntention);
  const cleanedHighlights = (Array.isArray(data.keyHighlights) ? data.keyHighlights : []).map(cleanStr).filter(Boolean);
  const cleanedSchedule = (Array.isArray(data.scheduleBreakdown) ? data.scheduleBreakdown : []).map((item) => ({
    time: cleanStr(item.time) || 'Scheduled',
    event: cleanStr(item.event) || 'Event',
    reflection: cleanStr(item.reflection),
  }));

  const dateLabel = targetDateStr || new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  const scheduleMarkdown = cleanedSchedule.length > 0
    ? cleanedSchedule.map((s) => `- **${s.time}** — **${s.event}**\n  *${s.reflection}*`).join('\n\n')
    : '- *Unscheduled self-directed day*';

  const highlightsMarkdown = cleanedHighlights.length > 0
    ? cleanedHighlights.map((h) => `- ${h}`).join('\n')
    : '';

  const cleanFullMarkdown = [
    `### 🌅 Day Review: ${dateLabel}`,
    ``,
    `**Theme**: ${cleanedTheme}  `,
    `**Emotional Arc**: ${cleanedMood}`,
    ``,
    `#### 📝 Executive Day Summary`,
    cleanedSummary,
    ``,
    `#### 🗓️ Schedule & Timeline Reflections`,
    scheduleMarkdown,
    cleanedHighlights.length > 0 ? `\n#### ✨ Key Realizations & Breakthroughs\n${highlightsMarkdown}` : '',
    cleanedGrounding ? `\n#### 🌿 Evening Grounding\n> "${cleanedGrounding}"` : '',
    cleanedIntention ? `\n#### 🎯 Tomorrow's Intention\n*${cleanedIntention}*` : '',
  ].filter(Boolean).join('\n\n');

  return {
    ...data,
    dayTheme: cleanedTheme,
    detectedMood: cleanedMood,
    summary: cleanedSummary,
    groundingThought: cleanedGrounding,
    tomorrowIntention: cleanedIntention,
    keyHighlights: cleanedHighlights,
    scheduleBreakdown: cleanedSchedule,
    fullMarkdown: cleanFullMarkdown,
  };
}
