import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './shared/components/AdminLayout';
import { NotFoundPage } from './shared/components/NotFoundPage';
import { PublicLayout } from './shared/components/PublicLayout';
import { RouteLoading } from './shared/components/RouteStates';
import { RequireAnonymous } from './shared/components/guards/RequireAnonymous';
import { RequireAuth } from './shared/components/guards/RequireAuth';
import { RequireTenant } from './shared/components/guards/RequireTenant';

const HomePage = lazy(() => import('./app/page'));
const NegociosPage = lazy(() => import('./app/negocios/page'));
const BusinessesPage = lazy(() => import('./app/businesses/page'));
const TenantPortalPage = lazy(() => import('./app/[tenantSlug]/page'));
const LoginPage = lazy(() => import('./app/login/page'));
const RegisterPage = lazy(() => import('./app/register/page'));
const OnboardingPage = lazy(() => import('./app/onboarding/page'));
const PrivacyPage = lazy(() => import('./app/privacy/page'));
const TermsPage = lazy(() => import('./app/terms/page'));
const SuperAdminPage = lazy(() => import('./app/super-admin/page'));

const AgendaPage = lazy(() => import('./app/admin/agenda/page'));
const AvailabilityPage = lazy(() => import('./app/admin/availability/page'));
const ServicesPage = lazy(() => import('./app/admin/services/page'));
const StaffPage = lazy(() => import('./app/admin/staff/page'));
const GalleryPage = lazy(() => import('./app/admin/gallery/page'));
const ConfiguracionPage = lazy(() => import('./app/admin/configuracion/page'));
const ReviewsPage = lazy(() => import('./app/admin/reviews/page'));
const NotificacionesPage = lazy(() => import('./app/admin/notificaciones/page'));
const SoportePage = lazy(() => import('./app/admin/soporte/page'));
const AcercaPage = lazy(() => import('./app/admin/acerca/page'));

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

/** Full SPA route table (feature 024). */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Lazy><HomePage /></Lazy>} />

      <Route element={<PublicLayout />}>
        <Route path="/negocios" element={<Lazy><NegociosPage /></Lazy>} />
        <Route path="/businesses" element={<Lazy><BusinessesPage /></Lazy>} />
      </Route>

      <Route path="/:tenantSlug" element={<Lazy><TenantPortalPage /></Lazy>} />

      <Route element={<RequireAnonymous />}>
        <Route path="/login" element={<Lazy><LoginPage /></Lazy>} />
      </Route>

      <Route path="/register" element={<Lazy><RegisterPage /></Lazy>} />
      <Route path="/onboarding" element={<Lazy><OnboardingPage /></Lazy>} />
      <Route path="/privacy" element={<Lazy><PrivacyPage /></Lazy>} />
      <Route path="/terms" element={<Lazy><TermsPage /></Lazy>} />

      <Route path="/directorio" element={<Navigate to="/negocios" replace />} />

      <Route element={<RequireTenant />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/agenda" replace />} />
          <Route path="/admin/agenda" element={<Lazy><AgendaPage /></Lazy>} />
          <Route path="/admin/availability" element={<Lazy><AvailabilityPage /></Lazy>} />
          <Route path="/admin/services" element={<Lazy><ServicesPage /></Lazy>} />
          <Route path="/admin/staff" element={<Lazy><StaffPage /></Lazy>} />
          <Route path="/admin/gallery" element={<Lazy><GalleryPage /></Lazy>} />
          <Route path="/admin/configuracion" element={<Lazy><ConfiguracionPage /></Lazy>} />
          <Route path="/admin/reviews" element={<Lazy><ReviewsPage /></Lazy>} />
          <Route path="/admin/notificaciones" element={<Lazy><NotificacionesPage /></Lazy>} />
          <Route path="/admin/soporte" element={<Lazy><SoportePage /></Lazy>} />
          <Route path="/admin/acerca" element={<Lazy><AcercaPage /></Lazy>} />
          <Route
            path="/admin/profile"
            element={<Navigate to="/admin/configuracion?tab=perfil" replace />}
          />
          <Route
            path="/admin/seguridad"
            element={<Navigate to="/admin/configuracion?tab=seguridad" replace />}
          />
        </Route>
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/super-admin" element={<Lazy><SuperAdminPage /></Lazy>} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
