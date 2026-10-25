'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Card } from '@foundly/ui';
import { SUPPORT_CHANNELS, SUPPORT_FAQS, SUPPORT_INTRO } from './support-content';

/** Help & support page: static FAQ and contact channels. */
export function SupportView() {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4" component="h1">
          Ayuda y soporte
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {SUPPORT_INTRO}
        </Typography>
      </Stack>

      <Card
        header={
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Preguntas frecuentes
          </Typography>
        }
      >
        <Stack spacing={1}>
          {SUPPORT_FAQS.map((item) => (
            <Accordion
              key={item.id}
              disableGutters
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 600 }}>{item.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Card>

      <Card
        header={
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Contacto
          </Typography>
        }
      >
        <Stack spacing={2}>
          {SUPPORT_CHANNELS.map((channel) => (
            <Box key={channel.id}>
              <Typography sx={{ fontWeight: 600 }}>{channel.label}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {channel.description}
              </Typography>
              <Button
                href={channel.href}
                target={channel.href.startsWith('http') ? '_blank' : undefined}
                rel={channel.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                variant="outlined"
              >
                {channel.label}
              </Button>
            </Box>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
