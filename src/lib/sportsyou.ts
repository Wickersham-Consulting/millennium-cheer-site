// Minimal iCalendar (RFC 5545) reader for the SportsYou booster calendar.
//
// The feed contains only VEVENTs with DTSTART/DTEND/SUMMARY/LOCATION/DESCRIPTION
// (no RRULE/VTIMEZONE — SportsYou pre-expands recurrences), so a focused parser
// is enough and keeps the build dependency-free. If SportsYou ever starts
// emitting recurrence rules or timezone blocks, swap this for a real iCal lib.

export type CalEvent = {
  start: Date;
  end?: Date;
  allDay: boolean;
  title: string;
  location?: string;
  description?: string;
  // Weekly practice / weightroom / tumbling — rendered de-emphasized so the
  // games, fundraisers, and milestones stand out.
  routine: boolean;
};

// Every SportsYou summary is prefixed with the team name; strip it for display.
const TITLE_PREFIX = /^MHS CHEER BOOSTER CLUB\s*-\s*/i;
const ROUTINE = /\b(practice|weightroom|weight room|tumbling|dauntless)\b/i;

// RFC 5545 line folding: a CRLF followed by a space/tab continues the prior line.
function unfold(ics: string): string[] {
  return ics.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n");
}

function unescapeText(v: string): string {
  return v
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function parseDate(raw: string, params: string): { date: Date; allDay: boolean } {
  // All-day: ";VALUE=DATE" with a bare YYYYMMDD value. Stored at UTC midnight so
  // the display layer can read the calendar date back without a TZ shift.
  if (/VALUE=DATE/i.test(params) || /^\d{8}$/.test(raw)) {
    return {
      date: new Date(Date.UTC(+raw.slice(0, 4), +raw.slice(4, 6) - 1, +raw.slice(6, 8))),
      allDay: true,
    };
  }
  // Timed: YYYYMMDDTHHMMSSZ (feed uses UTC). Display layer converts to Arizona.
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (m) {
    const [, y, mo, d, h, mi, s] = m;
    return { date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)), allDay: false };
  }
  return { date: new Date(raw), allDay: false };
}

export function parseIcs(ics: string): CalEvent[] {
  const events: CalEvent[] = [];
  let cur: Partial<CalEvent> | null = null;

  for (const line of unfold(ics)) {
    if (line === "BEGIN:VEVENT") { cur = { routine: false, allDay: false }; continue; }
    if (line === "END:VEVENT") {
      if (cur?.start && cur.title) events.push(cur as CalEvent);
      cur = null;
      continue;
    }
    if (!cur) continue;

    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const value = line.slice(idx + 1);
    const [name, ...rest] = line.slice(0, idx).split(";");
    const params = rest.join(";");

    switch (name) {
      case "DTSTART": {
        const { date, allDay } = parseDate(value, params);
        cur.start = date;
        cur.allDay = allDay;
        break;
      }
      case "DTEND":
        cur.end = parseDate(value, params).date;
        break;
      case "SUMMARY": {
        const clean = unescapeText(value);
        cur.title = clean.replace(TITLE_PREFIX, "").trim() || clean;
        cur.routine = ROUTINE.test(clean);
        break;
      }
      case "LOCATION":
        cur.location = unescapeText(value) || undefined;
        break;
      case "DESCRIPTION":
        cur.description = unescapeText(value) || undefined;
        break;
    }
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

// Load the calendar at build time: prefer the live feed (URL kept in the
// SPORTSYOU_ICS_URL env var / CI secret), fall back to the committed snapshot so
// builds never break when the URL is absent or the network is down.
export async function loadCalendar(snapshotIcs: string): Promise<CalEvent[]> {
  const url = import.meta.env.SPORTSYOU_ICS_URL;
  if (url) {
    try {
      const res = await fetch(url);
      if (res.ok) return parseIcs(await res.text());
      console.warn(`[sportsyou] feed responded ${res.status}; using committed snapshot`);
    } catch (err) {
      console.warn(`[sportsyou] feed fetch failed (${err}); using committed snapshot`);
    }
  }
  return parseIcs(snapshotIcs);
}
