import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { SessionProvider } from './shared/auth/session-context';
import { AppRouter } from './router';

/** SPA root (feature 024). */
export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <SessionProvider>
          <AppRouter />
        </SessionProvider>
      </BrowserRouter>
    </AppProviders>
  );
}
