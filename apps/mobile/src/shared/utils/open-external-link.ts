import { Linking } from 'react-native';

const ALLOWED_SCHEME = /^(https?:\/\/|mailto:)/i;

export interface ExternalLinkResult {
  ok: boolean;
  message?: string;
}

export async function openExternalLink(url: string): Promise<ExternalLinkResult> {
  const target = url.trim();
  if (!ALLOWED_SCHEME.test(target)) {
    return { ok: false, message: 'El enlace no es válido.' };
  }
  try {
    await Linking.openURL(target);
    return { ok: true };
  } catch {
    return { ok: false, message: 'No pudimos abrir el enlace. Inténtalo de nuevo.' };
  }
}
