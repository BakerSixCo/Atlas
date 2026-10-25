import { createReader } from '@keystatic/core/reader';
import Markdoc, { type Config, type Node, type RenderableTreeNode, type RenderableTreeNodes, type Tag } from '@markdoc/markdoc';
import keystaticConfig from '../../keystatic.config';

export const reader = createReader(process.cwd(), keystaticConfig);

async function required<T>(p: Promise<T | null>, name: string): Promise<T> {
  const v = await p;
  if (!v) throw new Error(`Missing content: ${name}. Create it in the admin at /keystatic.`);
  return v;
}

export const getSettings = () => required(reader.singletons.settings.read(), 'Site settings');
export const getHome = () => required(reader.singletons.home.read(), 'Home page');
export const getAbout = () => required(reader.singletons.about.read(), 'About page');
export const getFaq = async () => (await reader.singletons.faq.read())?.items ?? [];
export const getTestimonials = async () => (await reader.singletons.testimonials.read())?.items ?? [];
export const getScheduleNotes = async () =>
  (await reader.singletons.schedule.read()) ?? { intro: '', closures: [] };
export const getTrial = () => required(reader.singletons.trial.read(), 'Free trial page');
export const getHandbook = () => required(reader.singletons.handbook.read(), 'Handbook');

export async function getInstructors() {
  const all = await reader.collections.instructors.all();
  return all.sort((a, b) => (a.entry.order ?? 10) - (b.entry.order ?? 10));
}

export async function getPrograms() {
  const all = await reader.collections.programs.all();
  return all.sort((a, b) => (a.entry.order ?? 10) - (b.entry.order ?? 10));
}

export async function getPosts() {
  const all = await reader.collections.posts.all();
  return all
    .filter((p) => !p.entry.draft)
    .sort((a, b) => (b.entry.date ?? '').localeCompare(a.entry.date ?? ''));
}

/** Render a Keystatic markdoc field to HTML. Content is owner-authored and escaped by Markdoc. */
export function renderMarkdoc(node: Node, config?: Config): string {
  return Markdoc.renderers.html(unwrapArticle(Markdoc.transform(node, config)));
}

/** Markdoc wraps documents in <article>; drop it so .prose styles apply to the real children. */
function unwrapArticle(tree: RenderableTreeNode): RenderableTreeNodes {
  const isTag = (t: unknown): t is Tag => !!t && typeof t === 'object' && (t as Tag).$$mdtype === 'Tag';
  return isTag(tree) && tree.name === 'article' ? tree.children : tree;
}
