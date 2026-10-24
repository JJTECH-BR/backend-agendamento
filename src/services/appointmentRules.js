const weekdayNumbers = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
};

function localDateTimeParts(date) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

    return {
        dayOfWeek: weekdayNumbers[values.weekday],
        day: `${values.year}-${values.month}-${values.day}`,
        minutes: Number(values.hour) * 60 + Number(values.minute),
    };
}

function toMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

export function isWithinAppointmentHours(date, duration, company, schedules = []) {
    const local = localDateTimeParts(date);
    if ((Array.isArray(company.closedDates) && company.closedDates.includes(local.day))
        || local.dayOfWeek === undefined) {
        return false;
    }

    const companyStart = toMinutes(company.openingTime);
    const companyEnd = toMinutes(company.closingTime);
    let start = companyStart;
    let end = companyEnd;

    if (schedules.length > 0) {
        const schedule = schedules.find((item) => item.dayOfWeek === local.dayOfWeek);
        if (!schedule?.available) return false;
        start = Math.max(start, toMinutes(schedule.startTime));
        end = Math.min(end, toMinutes(schedule.endTime));
    }

    return local.minutes >= start && local.minutes + duration <= end;
}

export function hasAppointmentConflict(date, duration, appointments) {
    const start = date.getTime();
    const end = start + duration * 60_000;

    return appointments.some((appointment) => {
        if (appointment.status === 'CANCELLED') return false;
        const existingStart = appointment.date.getTime();
        const existingEnd = existingStart + appointment.service.duration * 60_000;
        return start < existingEnd && end > existingStart;
    });
}
