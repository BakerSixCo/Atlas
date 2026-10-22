import type { ImageMetadata } from 'astro';

// Every image the CMS can reference, resolved at build time so Astro can optimize it.
const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}',
  { eager: true },
);

export function resolveImage(path: string | null | undefined): ImageMetadata | undefined {
  if (!path) return undefined;
  const hit = files[path];
  if (!hit) {
    console.warn(`[images] Not found: ${path}`);
    return undefined;
  }
  return hit.default;
}
