// A due date is a calendar day, saved as that day's UTC midnight: shown in UTC, it's the same
// day wherever it's read (in local time it would show the day before west of UTC).
export const formatDueDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { timeZone: 'UTC' });
