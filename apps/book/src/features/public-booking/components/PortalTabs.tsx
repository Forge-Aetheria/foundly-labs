'use client';

import { useState, type ReactNode } from 'react';
import { Button, Stack } from '@foundly/ui';
import { PRIMARY_BUTTON_SX, SECONDARY_BUTTON_SX } from '../../../app/components/landingCanon';

export interface PortalTabDef {
  id: string;
  label: string;
  content: ReactNode;
}

/** Accessible tab controller built from pill `Button` primitives (research R3). */
export function PortalTabs({ tabs }: { tabs: PortalTabDef[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '');
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <Stack spacing={2}>
      <Stack
        role="tablist"
        aria-label="Contenido del negocio"
        direction="row"
        spacing={1}
        sx={{ flexWrap: 'wrap' }}
      >
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={active?.id === tab.id ? 'primary' : 'secondary'}
            sx={active?.id === tab.id ? PRIMARY_BUTTON_SX : SECONDARY_BUTTON_SX}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active?.id === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </Stack>

      {active ? (
        <Stack
          role="tabpanel"
          id={`panel-${active.id}`}
          aria-labelledby={`tab-${active.id}`}
        >
          {active.content}
        </Stack>
      ) : null}
    </Stack>
  );
}