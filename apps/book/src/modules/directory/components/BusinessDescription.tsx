'use client';

import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { Typography } from '@foundly/ui';

/** Approximate character count above which a description is likely to exceed two lines. */
const MAX_CHARS = 120;

export interface BusinessDescriptionProps {
  text: string | null;
  emptyText: string;
}

/**
 * Card description clamped to two lines. When the text overflows, a "(... ver más)"
 * suffix is shown and a tooltip reveals the full description on hover/focus.
 */
export function BusinessDescription({ text, emptyText }: BusinessDescriptionProps) {
  const content = text && text.trim() ? text : emptyText;
  const clampRef = useRef<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const element = clampRef.current;
    const measured = element ? element.scrollHeight > element.clientHeight + 1 : false;
    // jsdom reports 0 for scroll/client height, so a length heuristic backs the measurement.
    setOverflowing(measured || content.length > MAX_CHARS);
  }, [content]);

  return (
    <Box>
      <Box
        ref={clampRef}
        sx={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '2.6em',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {content}
        </Typography>
      </Box>
      {overflowing ? (
        <Tooltip title={content} arrow enterDelay={0}>
          <Box
            component="span"
            tabIndex={0}
            sx={{
              display: 'inline-block',
              mt: 0.25,
              color: 'primary.main',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'help',
            }}
          >
            (... ver más)
          </Box>
        </Tooltip>
      ) : null}
    </Box>
  );
}
