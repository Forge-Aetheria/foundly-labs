'use client';

import MenuIcon from '@mui/icons-material/Menu';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Container, Stack, Typography } from '@foundly/ui';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { PRIMARY_NAV, SECONDARY_NAV, type AdminNavItem } from './AdminNavigation';

/** Width of the persistent sidebar, shared by the drawer and the content offset. */
const DRAWER_WIDTH = 264;

export interface AdminShellProps {
  children: ReactNode;
  /** The active business shown in the footer user profile (US3). */
  tenantName?: string;
}

/**
 * Application shell: a persistent brand sidebar (collapsible to a temporary
 * drawer on small viewports), the module navigation and the Clean Light UI
 * lavender canvas for the routed screens.
 */
export function AdminShell({ children, tenantName }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleOpen = () => setMobileOpen(true);
  const handleClose = () => setMobileOpen(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SkipLink />

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          },
        }}
      >
        <DrawerContent tenantName={tenantName} />
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <DrawerContent tenantName={tenantName} onNavigate={handleClose} />
      </Drawer>

      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        <MobileBar onOpen={handleOpen} />
        <Box component="main" id="main" sx={{ flexGrow: 1 }}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            {children}
          </Container>
        </Box>
      </Stack>
    </Box>
  );
}

function SkipLink() {
  return (
    <Box
      component="a"
      href="#main"
      sx={{
        position: 'absolute',
        left: -9999,
        zIndex: (theme) => theme.zIndex.tooltip,
        '&:focus': {
          left: 16,
          top: 16,
          px: 2,
          py: 1,
          borderRadius: 1,
          backgroundColor: 'background.paper',
          boxShadow: 1,
        },
      }}
    >
      Saltar al contenido
    </Box>
  );
}

function MobileBar({ onOpen }: { onOpen: () => void }) {
  return (
    <Stack
      component="header"
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        display: { xs: 'flex', md: 'none' },
        position: 'sticky',
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        px: 1,
        py: 0.5,
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <IconButton onClick={onOpen} aria-label="Abrir menú de navegación" edge="start">
        <MenuIcon />
      </IconButton>
      <Image src="/icon.png" alt="Foundly Book" width={28} height={28} priority />
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Foundly Book
      </Typography>
    </Stack>
  );
}

function DrawerContent({
  onNavigate,
  tenantName,
}: {
  onNavigate?: () => void;
  tenantName?: string;
}) {
  const pathname = usePathname();

  return (
    <Stack sx={{ height: '100%' }}>
      <Stack sx={{ px: 3, py: 3, alignItems: 'center' }}>
        <Link
          href="/admin/agenda"
          aria-label="Foundly Book — inicio"
          style={{ display: 'flex' }}
          onClick={onNavigate}
        >
          <Image src="/branding-logo.png" alt="Foundly Book" width={168} height={84} priority />
        </Link>
      </Stack>
      <Divider />

      <List component="nav" aria-label="Navegación principal" sx={{ px: 1.5, py: 1.5 }}>
        {PRIMARY_NAV.map((item) => (
          <NavListItem
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </List>
      <Divider />

      <List component="nav" aria-label="Navegación secundaria" sx={{ px: 1.5, py: 1.5 }}>
        {SECONDARY_NAV.map((item) => (
          <NavListItem
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <UserFooter tenantName={tenantName} />
    </Stack>
  );
}

function NavListItem({
  item,
  active,
  onNavigate,
}: {
  item: AdminNavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <ListItemButton
      component={Link}
      href={item.href}
      selected={active}
      onClick={onNavigate}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        '&.Mui-selected': {
          backgroundColor: 'primary.light',
          '&:hover': { backgroundColor: 'primary.light' },
          '& .MuiListItemIcon-root': { color: 'primary.dark' },
          '& .MuiListItemText-primary': { color: 'primary.dark' },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={item.label}
        slotProps={{ primary: { variant: 'body2', fontWeight: active ? 600 : 500 } }}
      />
    </ListItemButton>
  );
}

function UserFooter({ tenantName }: { tenantName?: string }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2.5, py: 2 }}>
      <Avatar
        sx={{
          width: 38,
          height: 38,
          backgroundColor: 'primary.main',
          color: 'common.white',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        RG
      </Avatar>
      <Stack sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          Raúl Gómez
        </Typography>
        {tenantName ? (
          <Typography variant="caption" noWrap>
            {tenantName}
          </Typography>
        ) : null}
        <Typography variant="caption" color="text.secondary" noWrap>
          Administrador
        </Typography>
      </Stack>
    </Stack>
  );
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
