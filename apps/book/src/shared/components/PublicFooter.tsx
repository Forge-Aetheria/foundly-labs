import Image from 'next/image';
import Link from 'next/link';
import MuiLink from '@mui/material/Link';
import { Container, Stack, Typography } from '@foundly/ui';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Producto',
    links: [
      { label: 'Negocios', href: '/negocios' },
      { label: 'Precios', href: '/#precios' },
      { label: 'Iniciar sesión', href: '/login' },
      { label: 'Registrar mi negocio', href: '/onboarding' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      {
        label: 'Documentación',
        href: 'https://github.com/Ragomez33/foundly-labs',
        external: true,
      },
      { label: 'Privacidad', href: '/privacy' },
    ],
  },
];

const LINK_SX = {
  color: 'text.secondary',
  textDecoration: 'none',
  '&:visited': { color: 'text.secondary' },
  '&:hover': { color: 'primary.main' },
};

function FooterNavLink({ link }: { link: FooterLink }) {
  if (link.external) {
    return (
      <MuiLink href={link.href} target="_blank" rel="noopener noreferrer" underline="none" sx={LINK_SX}>
        <Typography variant="body2">{link.label}</Typography>
      </MuiLink>
    );
  }
  return (
    <MuiLink component={Link} href={link.href} underline="none" sx={LINK_SX}>
      <Typography variant="body2">{link.label}</Typography>
    </MuiLink>
  );
}

/** Platform footer (feature `020`/landing): shared brand close for the landing and `/negocios`. */
export function PublicFooter() {
  return (
    <Stack
      component="footer"
      sx={{ mt: 6, borderTop: 1, borderColor: 'border.subtle', backgroundColor: 'surface.elevated' }}
    >
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="space-between">
          <Stack spacing={2} sx={{ maxWidth: 320 }}>
            <Link href="/" aria-label="Foundly Book — inicio" style={{ display: 'inline-flex' }}>
              <Image src="/branding-logo.png" alt="Foundly Book" width={140} height={70} />
            </Link>
            <Typography variant="body2" color="text.secondary">
              Agendas, servicios y reservas para negocios que quieren crecer.
            </Typography>
          </Stack>

          {COLUMNS.map((column) => (
            <Stack key={column.title} spacing={1.5}>
              <Typography variant="subtitle2" component="p" sx={{ fontWeight: 700 }}>
                {column.title}
              </Typography>
              {column.links.map((link) => (
                <FooterNavLink key={link.label} link={link} />
              ))}
            </Stack>
          ))}
        </Stack>

        <Stack sx={{ mt: 5, pt: 3, borderTop: 1, borderColor: 'border.subtle' }}>
          <Typography variant="caption" color="text.secondary">
            © 2026 Foundly Labs. Todos los derechos reservados.
          </Typography>
        </Stack>
      </Container>
    </Stack>
  );
}
