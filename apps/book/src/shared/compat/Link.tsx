import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';

export interface CompatLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  [key: string]: unknown;
}

/**
 * Compatibility shim for `next/link` (feature 024). Maps `href` to React Router
 * `to`; extra MUI props (component, underline, sx…) are forwarded as-is.
 */
export default function Link({ href, children, ...rest }: CompatLinkProps) {
  const { onClick, ...forwarded } = rest as CompatLinkProps;
  return (
    <RouterLink to={href} onClick={onClick} {...(forwarded as Record<string, unknown>)}>
      {children}
    </RouterLink>
  );
}
