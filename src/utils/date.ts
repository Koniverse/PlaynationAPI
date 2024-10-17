export function dateDiffInDays(a: Date, b: Date) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

export function getTodayDateRange() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  return { startOfDay, endOfDay };
}

const formatDate = (date: Date, isEndDay: boolean) => {
  const year = date.getFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
  const day = String(date.getUTCDate()).padStart(2, '0');
  const time = isEndDay ? '23:59:59' : '00:00:00';

  return `${year}-${month}-${day} ${time}`;
};

export const formatDateFully = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const second = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const formatFully = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

function getLastDayOfMonth (year: number, month: number): Date {
  const nextMonth = new Date(Date.UTC(year, month + 1, 1));

  nextMonth.setUTCDate(nextMonth.getUTCDate() - 1);

  return nextMonth;
}

export function getLastDayOfYear (year: number): Date {
  const nextYearStart = new Date(Date.UTC(year + 1, 0, 1)); // Ngày đầu năm sau theo UTC

  nextYearStart.setUTCDate(nextYearStart.getUTCDate() - 1); // Trừ đi 1 ngày để được ngày cuối năm hiện tại

  return nextYearStart;
}

export function getLastDayOfYearCurrent (): string {
  const today = new Date();
  const year = today.getUTCFullYear();
  const nextYearStart = new Date(Date.UTC(year + 1, 0, 1)); // Ngày đầu năm sau theo UTC

  nextYearStart.setUTCDate(nextYearStart.getUTCDate() - 1); // Trừ đi 1 ngày để được ngày cuối năm hiện tại

  return formatDate(nextYearStart, true);
}

export function calculateStartAndEnd (key: string) {
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const day = today.getUTCDate();

  switch (key) {
  case 'daily': {
    const todayUTC = new Date(Date.UTC(year, month, day)); // Adjust if today is Sunday

    return { start: formatDate(todayUTC, false), end: formatDate(todayUTC, true) };
  }
  case 'weekly': {
    const dayOfWeek = today.getUTCDay(); // 0 (Chủ Nhật) đến 6 (Thứ Bảy)
    const start = new Date(Date.UTC(year, month, day - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))); // Adjust if today is Sunday
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6));

    return { start: formatDate(start, false), end: formatDate(end, true) };
  }

  case 'monthly': {
    const startOfMonth = new Date(Date.UTC(year, month, 1));
    const endOfMonth = getLastDayOfMonth(year, month);

    return { start: formatDate(startOfMonth, false), end: formatDate(endOfMonth, true) };
  }

  case 'yearly': {
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const endOfYear = getLastDayOfYear(year);

    return { start: formatDate(startOfYear, false), end: formatDate(endOfYear, true) };
  }

  default:
    throw new Error('Invalid key. Must be "weekly", "monthly", or "yearly".');
  }
}
