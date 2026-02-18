import { redirect } from 'next/navigation';
import { getAllDocsMeta } from '@/lib/docs';

export default function DocsPage() {
  const docs = getAllDocsMeta();
  const features = docs.find((d) => d.slug === 'features');
  const fallback = features ?? docs[0];
  if (fallback) {
    redirect(`/docs/${fallback.slug}`);
  }
  // Fallback if no docs exist
  return (
    <main className="pt-6">
      <p className="text-sm text-[#888888]">No docs available.</p>
    </main>
  );
}
