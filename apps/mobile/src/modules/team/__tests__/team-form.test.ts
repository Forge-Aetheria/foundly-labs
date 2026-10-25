import { serviceDiff, teamDraftFrom, validateTeamDraft } from '../team-form';
import type { TeamMember } from '../services';

const member: TeamMember = {
  id: 'sp1',
  tenantId: 't1',
  name: 'Ana Pérez',
  role: 'Peluquera',
  avatar: null,
  bio: 'Especialista en color',
  active: true,
  services: [
    { id: 's1', name: 'Corte' },
    { id: 's2', name: 'Color' },
  ],
};

describe('team form helpers', () => {
  it('maps a team member to an editable draft', () => {
    expect(teamDraftFrom(member)).toEqual({
      name: 'Ana Pérez',
      role: 'Peluquera',
      bio: 'Especialista en color',
      avatar: '',
      active: true,
      serviceIds: ['s1', 's2'],
    });
  });

  it('validates name and bio length', () => {
    const errors = validateTeamDraft({
      name: ' ',
      role: '',
      bio: 'x'.repeat(501),
      avatar: '',
      active: true,
      serviceIds: [],
    });
    expect(errors.name).toBeDefined();
    expect(errors.bio).toBeDefined();
  });

  it('computes service assignment diffs', () => {
    expect(serviceDiff(['s1', 's2'], ['s2', 's3'])).toEqual({
      addServiceIds: ['s3'],
      removeServiceIds: ['s1'],
    });
  });
});
