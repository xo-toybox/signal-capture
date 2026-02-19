import ExternalLinks from '@/components/ExternalLinks';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="flex items-center justify-end pt-4">
        <ExternalLinks />
      </header>
      {children}
    </>
  );
}
