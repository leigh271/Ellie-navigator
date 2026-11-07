import type { Appointment } from './types';
export const APPOINTMENT_ZONE = 'America/New_York';
export function isValidAppointment(value: unknown): value is Appointment {
  if (!value || typeof value !== 'object') return false;
  const a = value as Appointment;
  if (
    typeof a.id !== 'string' ||
    typeof a.provider !== 'string' ||
    a.provider.trim().length < 1 ||
    a.provider.length > 100 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(a.date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(a.time) ||
    ![15, 30, 45, 60, 90, 120].includes(a.duration)
  )
    return false;
  const date = new Date(`${a.date}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === a.date;
}
export function localStamp(a: Appointment) {
  return `${a.date.replaceAll('-', '')}T${a.time.replace(':', '')}00`;
}
export function escapeICS(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}
// All personal appointments use the care region's time zone, including DST.
export function appointmentUTC(a: Appointment) {
  const naive = new Date(`${a.date}T${a.time}:00Z`);
  let result = naive;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: APPOINTMENT_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(result);
    const part = (type: string) => parts.find((p) => p.type === type)?.value;
    const displayed = new Date(
      `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:00Z`,
    );
    result = new Date(result.getTime() + naive.getTime() - displayed.getTime());
  }
  return result;
}
export function hasValidLocalTime(a: Appointment) {
  const d = appointmentUTC(a);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APPOINTMENT_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const p = (key: string) => parts.find((x) => x.type === key)?.value;
  return (
    `${p('year')}-${p('month')}-${p('day')}` === a.date && `${p('hour')}:${p('minute')}` === a.time
  );
}
function utcStamp(d: Date) {
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}
function foldLine(line: string) {
  const lines: string[] = [];
  let chunk = '';
  let length = 0;
  for (const c of line) {
    const size = new TextEncoder().encode(c).length;
    if (length + size > 73) {
      lines.push(chunk);
      chunk = ' ';
      length = 1;
    }
    chunk += c;
    length += size;
  }
  lines.push(chunk);
  return lines.join('\r\n');
}
export function createICS(a: Appointment) {
  const start = appointmentUTC(a);
  return (
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ellie Navigator//Personal care calendar//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${escapeICS(a.id)}@ellie-navigator`,
      `DTSTAMP:${utcStamp(new Date())}`,
      `DTSTART:${utcStamp(start)}`,
      `DTEND:${utcStamp(new Date(start.getTime() + a.duration * 60000))}`,
      `SUMMARY:${escapeICS(`Appointment: ${a.provider}`)}`,
      'DESCRIPTION:Personal calendar record only. Confirm booking directly with your clinic.',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .map(foldLine)
      .join('\r\n') + '\r\n'
  );
}
export function googleCalendarURL(a: Appointment) {
  const start = appointmentUTC(a);
  return (
    'https://calendar.google.com/calendar/render?' +
    new URLSearchParams({
      action: 'TEMPLATE',
      text: `Appointment: ${a.provider}`,
      dates: `${utcStamp(start)}/${utcStamp(new Date(start.getTime() + a.duration * 60000))}`,
      ctz: APPOINTMENT_ZONE,
      details: 'Personal calendar record only. Confirm booking directly with your clinic.',
    })
  );
}
