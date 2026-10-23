'use client';

import { useState, type ReactNode } from 'react';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Stack, Typography } from '@foundly/ui';
import { ProfileView } from '../profile/ProfileView';
import { SecurityView } from '../security/SecurityView';
import { PaymentsView } from './PaymentsView';
import { GLASS_CARD_SX } from '../../shared/utils/landingCanon';

export const CONFIG_TABS = ['perfil', 'pagos', 'seguridad'] as const;

export type ConfigurationTab = (typeof CONFIG_TABS)[number];

const TAB_META: Record<
  ConfigurationTab,
  { label: string; icon: typeof StorefrontOutlinedIcon }
> = {
  perfil: { label: 'Perfil del Negocio', icon: StorefrontOutlinedIcon },
  pagos: { label: 'Métodos de Pago', icon: PaymentsOutlinedIcon },
  seguridad: { label: 'Seguridad', icon: LockOutlinedIcon },
};

/** Coerce a `?tab=` query value into a known tab (defaults to the business profile). */
export function parseConfigurationTab(value: string | null | undefined): ConfigurationTab {
  return CONFIG_TABS.includes(value as ConfigurationTab)
    ? (value as ConfigurationTab)
    : 'perfil';
}

/**
 * Configuración hub: one page, three internal tabs (business profile, payment
 * methods and security). Panels stay mounted after their first visit so tab
 * switching keeps form state and previously loaded data.
 */
export function ConfigurationView({ initialTab = 'perfil' }: { initialTab?: ConfigurationTab }) {
  const [tab, setTab] = useState<ConfigurationTab>(initialTab);
  const [mounted, setMounted] = useState<ReadonlySet<ConfigurationTab>>(
    () => new Set<ConfigurationTab>([initialTab]),
  );

  function selectTab(next: ConfigurationTab) {
    setTab(next);
    setMounted((current) =>
      current.has(next) ? current : new Set<ConfigurationTab>([...current, next]),
    );
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/admin/configuracion?tab=${next}`);
    }
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4" component="h1">
          Configuración
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administra el perfil público de tu negocio, tus métodos de pago y tus credenciales.
        </Typography>
      </Stack>

      <Box
        sx={[
          GLASS_CARD_SX,
          {
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            px: { xs: 1, sm: 2 },
          },
        ]}
      >
        <Tabs
          value={tab}
          onChange={(_, next: ConfigurationTab) => selectTab(next)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Secciones de configuración"
          sx={{
            minHeight: 52,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 52,
              gap: 1,
            },
          }}
        >
          {CONFIG_TABS.map((key) => {
            const Icon = TAB_META[key].icon;
            return (
              <Tab
                key={key}
                value={key}
                id={`config-tab-${key}`}
                aria-controls={`config-panel-${key}`}
                icon={<Icon sx={{ fontSize: 19 }} />}
                iconPosition="start"
                label={TAB_META[key].label}
              />
            );
          })}
        </Tabs>
      </Box>

      {mounted.has('perfil') ? (
        <TabPanel value="perfil" current={tab}>
          <ProfileView embedded />
        </TabPanel>
      ) : null}
      {mounted.has('pagos') ? (
        <TabPanel value="pagos" current={tab}>
          <PaymentsView embedded />
        </TabPanel>
      ) : null}
      {mounted.has('seguridad') ? (
        <TabPanel value="seguridad" current={tab}>
          <SecurityView embedded />
        </TabPanel>
      ) : null}
    </Stack>
  );
}

function TabPanel({
  value,
  current,
  children,
}: {
  value: ConfigurationTab;
  current: ConfigurationTab;
  children: ReactNode;
}) {
  const active = value === current;

  return (
    <Box
      role="tabpanel"
      id={`config-panel-${value}`}
      aria-labelledby={`config-tab-${value}`}
      hidden={!active}
      sx={{
        animation: active ? 'config-panel-in 180ms ease' : 'none',
        '@keyframes config-panel-in': {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    >
      {children}
    </Box>
  );
}
