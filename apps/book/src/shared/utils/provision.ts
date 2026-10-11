import type { AvailabilityRule, Resource, Service } from '../types/appointments';
import type { ProvisionedDefaults, Tenant } from '../types/tenancy';

/**
 * Pure provisioning (research R7): maps the wizard's step-3 configuration to
 * the tenant's initial operational state — a default resource, one availability
 * rule per open weekday, and a default service with the chosen duration.
 */
export function provisionDefaults(tenant: Tenant): ProvisionedDefaults {
  const resource: Resource = {
    id: `res-${tenant.id}`,
    name: tenant.name,
    type: 'professional',
    active: true,
    timezone: tenant.timezone,
    tenantId: tenant.id,
    role: null,
    avatar: null,
    bio: null,
  };

  const rules: AvailabilityRule[] = tenant.businessHours
    .filter((hours) => hours.isOpen)
    .map((hours) => ({
      id: `rule-${tenant.id}-${hours.weekday}`,
      resourceId: resource.id,
      weekday: hours.weekday,
      startTime: hours.startTime,
      endTime: hours.endTime,
      slotGranularityMinutes: 30,
      minLeadTimeMinutes: 0,
      bookingHorizonDays: 60,
    }));

  const service: Service = {
    id: `svc-${tenant.id}`,
    name: 'Servicio principal',
    description: `Servicio por defecto de ${tenant.name}`,
    durationMinutes: tenant.defaultAppointmentDurationMinutes,
    bufferMinutes: 0,
    category: tenant.category,
    active: true,
    tenantId: tenant.id,
  };

  return { resource, rules, service };
}
