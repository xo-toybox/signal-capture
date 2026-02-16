import Script from "next/script";
import BugReporter from "@/components/BugReporter";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <BugReporter />
      <Script id="sw-register" strategy="afterInteractive">
        {`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`}
      </Script>
    </>
  );
}
