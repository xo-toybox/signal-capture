import { createServiceClient, isConfigured } from '@/lib/supabase-server';
import { MOCK_SIGNALS } from '@/lib/mock-data';
import type { SignalFeedItem } from '@/lib/types';
import BlogList from '@/components/BlogList';

async function getPublishedSignals(): Promise<SignalFeedItem[]> {
  if (!isConfigured) {
    return MOCK_SIGNALS
      .filter(s => s.is_published)
      .sort((a, b) => {
        const aDate = a.published_at ?? a.created_at;
        const bDate = b.published_at ?? b.created_at;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('signals_feed')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('blog list error:', error);
    return [];
  }

  return (data ?? []) as SignalFeedItem[];
}

export default async function BlogPage() {
  const signals = await getPublishedSignals();

  return (
    <main>
      <BlogList signals={signals} />
    </main>
  );
}
