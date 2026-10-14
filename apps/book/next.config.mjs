/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  transpilePackages: ['@foundly/ui'],
  /**
   * ESLint integrado de Next desactivado a propósito:
   * `eslint-config-next` (plugin que Next detecta para su panel) aún exige
   * ESLint <= 9, mientras el monorepo usa ESLint 10 (flat config) y el gate
   * real de lint es `npm run lint` en la raíz (constitution.md §8).
   * Sin esto, el overlay de Next informa "1 Issue" por el plugin no detectado.
   */
  eslint: {
    ignoreDuringBuilds: true,
  },
  /**
   * Server Actions desde orígenes distintos al deployment (multi-zone / apex
   * custom, specs/architecture.md §2) requieren allow al origen emisor.
   * specs/book/008-api-integration-catalog-sync — api-connectivity.contract.md
   * (Next 15: `serverActions.allowedOrigins` vive bajo `experimental`).
   */
  experimental: {
    serverActions: {
      allowedOrigins: [
        'foundly-book.vercel.app',
        'book.foundlylabs.com',
        'foundlylabs.com',
        'www.foundlylabs.com',
        'localhost:3001',
      ],
    },
  },
  /** The discovery directory was renamed from `/directorio` to `/negocios`. */
  async redirects() {
    return [{ source: '/directorio', destination: '/negocios', permanent: false }];
  },
};

export default nextConfig;