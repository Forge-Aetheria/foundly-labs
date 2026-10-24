import { formatAppointmentTime, getAgendaRange } from '../date-range';

describe('getAgendaRange', () => {
  it('returns an inclusive UTC day for the tenant timezone', () => {
    expect(getAgendaRange(new Date('2026-10-24T15:30:00.000Z'), 'UTC')).toEqual({
      from: '2026-10-24T00:00:00.000Z',
      to: '2026-10-24T23:59:59.999Z',
    });
  });

  it('uses the local calendar day instead of the UTC day', () => {
    expect(getAgendaRange(new Date('2026-10-25T02:00:00.000Z'), 'America/Caracas')).toEqual({
      from: '2026-10-24T00:00:00.000Z',
      to: '2026-10-24T23:59:59.999Z',
    });
  });

  it('formats appointment times in the requested timezone', () => {
    expect(formatAppointmentTime('2026-10-24T14:00:00.000Z', 'UTC')).toMatch(/14|2/);
  });
});
