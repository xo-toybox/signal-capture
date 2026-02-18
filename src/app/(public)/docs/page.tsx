import { redirect } from 'next/navigation';
import { getAllDocs } from '@/lib/docs';

export default function DocsPage() {
  const docs = getAllDocs();
  const first = docs[0];
  if (first) {
    redirect(`/docs/${first.slug}`);
  }
  // Fallback if no docs exist
  return (
    <main className="pt-6">
      <p className="text-sm text-[#525252]">No docs available.</p>
    </main>
  );
}
