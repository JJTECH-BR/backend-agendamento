import { hasAppointmentConflict, isWithinAppointmentHours } from '../../services/appointmentRules.js';

describe('Regras de disponibilidade de agendamento', () => {
    const company = {
        openingTime: '09:00',
        closingTime: '17:00',
        closedDates: [],
    };

    it('usa o expediente da empresa como fallback sem horários individuais', () => {
        expect(isWithinAppointmentHours(
            new Date('2099-06-10T14:00:00.000Z'),
            60,
            company,
        )).toBe(true);
    });

    it('limita o agendamento ao horário individual e ao expediente da empresa', () => {
        const schedules = [{
            dayOfWeek: 3,
            startTime: '10:00',
            endTime: '12:00',
            available: true,
        }];

        expect(isWithinAppointmentHours(
            new Date('2099-06-10T14:00:00.000Z'),
            60,
            company,
            schedules,
        )).toBe(true);
        expect(isWithinAppointmentHours(
            new Date('2099-06-10T12:00:00.000Z'),
            60,
            company,
            schedules,
        )).toBe(false);
    });

    it('rejeita dias indisponíveis e datas fechadas', () => {
        expect(isWithinAppointmentHours(
            new Date('2099-06-10T14:00:00.000Z'),
            30,
            company,
            [{ dayOfWeek: 3, startTime: '09:00', endTime: '17:00', available: false }],
        )).toBe(false);
        expect(isWithinAppointmentHours(
            new Date('2099-06-10T14:00:00.000Z'),
            30,
            { ...company, closedDates: ['2099-06-10'] },
        )).toBe(false);
    });

    it('detecta sobreposição e ignora agendamentos cancelados', () => {
        const date = new Date('2099-06-10T14:00:00.000Z');
        expect(hasAppointmentConflict(date, 45, [{
            date: new Date('2099-06-10T14:15:00.000Z'),
            status: 'PENDING',
            service: { duration: 30 },
        }])).toBe(true);
        expect(hasAppointmentConflict(date, 45, [{
            date: new Date('2099-06-10T14:15:00.000Z'),
            status: 'CANCELLED',
            service: { duration: 30 },
        }])).toBe(false);
    });
});
