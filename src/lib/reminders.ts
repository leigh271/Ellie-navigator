import type { Appointment } from './types';
import { appointmentUTC, hasValidLocalTime, isValidAppointment } from './calendar';
export const reminderOptions = [0, 5, 15, 30, 60, 1440] as const;
export function reminderLabel(minutes: number | null | undefined) {
  if (minutes == null) return 'No reminder';
  if (minutes === 0) return 'At appointment time';
  if (minutes === 60) return '1 hour before';
  if (minutes === 1440) return '1 day before';
  return `${minutes} minutes before`;
}
export function reminderKey(a: Appointment) {
  return `${a.id}:${a.date}:${a.time}:${a.reminderMinutes}`;
}
export function dueReminders(appointments: Appointment[], now: number, sent: Set<string>) {
  return appointments.filter((a) => {
    if (a.reminderMinutes == null || sent.has(reminderKey(a))) return false;
    try {
      if (!isValidAppointment(a) || !hasValidLocalTime(a)) return false;
      const start = appointmentUTC(a).getTime();
      // Catch up if the tab resumes after the reminder time, but never notify about old visits.
      return now >= start - a.reminderMinutes * 60000 && now < start + 60000;
    } catch {
      return false;
    }
  });
}
