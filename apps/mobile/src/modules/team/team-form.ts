import type { TeamMember } from './services';

export interface TeamDraft {
  name: string;
  role: string;
  bio: string;
  avatar: string;
  active: boolean;
  serviceIds: string[];
}

export const EMPTY_TEAM_DRAFT: TeamDraft = {
  name: '',
  role: '',
  bio: '',
  avatar: '',
  active: true,
  serviceIds: [],
};

export function teamDraftFrom(member: TeamMember | null): TeamDraft {
  if (!member) return EMPTY_TEAM_DRAFT;
  return {
    name: member.name,
    role: member.role ?? '',
    bio: member.bio ?? '',
    avatar: member.avatar ?? '',
    active: member.active,
    serviceIds: member.services.map((service) => service.id),
  };
}

export function validateTeamDraft(draft: TeamDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = 'El nombre es obligatorio.';
  if (draft.bio.length > 500) errors.bio = 'La biografía no puede superar 500 caracteres.';
  return errors;
}

export function serviceDiff(
  previousIds: string[],
  nextIds: string[],
): { addServiceIds: string[]; removeServiceIds: string[] } {
  const previous = new Set(previousIds);
  const next = new Set(nextIds);
  return {
    addServiceIds: [...next].filter((id) => !previous.has(id)),
    removeServiceIds: [...previous].filter((id) => !next.has(id)),
  };
}
