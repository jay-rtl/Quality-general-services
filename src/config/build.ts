/** Build-time preview controls; production remains the root-domain Hostinger build. */
export const isPreview = import.meta.env.PUBLIC_PREVIEW === 'true';
export const PRODUCTION_ORIGIN = 'https://qualitygeneralservices.net';

export function withoutBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base && (path === base || path.startsWith(base + '/')) ? path.slice(base.length) || '/' : path;
}
