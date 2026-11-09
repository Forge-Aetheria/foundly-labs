import type { ImgHTMLAttributes } from 'react';

export interface CompatImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fill?: boolean;
}

/**
 * Compatibility shim for `next/image` (feature 024). Renders a native image with
 * native lazy/eager loading; `priority` maps to eager, `fill` is ignored.
 */
export default function Image({ src, alt, priority, fill, ...rest }: CompatImageProps) {
  // `fill` (next/image layout prop) has no native equivalent; keep the type
  // compatible but render a normal image.
  void fill;
  return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} {...rest} />;
}
