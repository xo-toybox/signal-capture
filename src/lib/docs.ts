import fs from 'fs';
import path from 'path';

export interface Doc {
  slug: string;
  topic: string;
  date: string;
  content: string;
}

const DOCS_DIR = path.join(process.cwd(), 'docs', 'public');

export function getDocSlugs(): string[] {
  const entries = fs.readdirSync(DOCS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name.replace(/\.md$/, ''));
}

export function getDoc(slug: string): Doc | null {
  const filePath = path.join(DOCS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');

  // Parse YAML frontmatter
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return null;

  const frontmatter = fmMatch[1];
  const content = fmMatch[2].trim();

  const topic =
    frontmatter.match(/^topic:\s*(.+)$/m)?.[1]?.trim() ?? slug;
  const date =
    frontmatter.match(/^date:\s*(.+)$/m)?.[1]?.trim() ?? '';

  return { slug, topic, date, content };
}

export function getAllDocs(): Doc[] {
  return getDocSlugs()
    .map((slug) => getDoc(slug))
    .filter((doc): doc is Doc => doc !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}
