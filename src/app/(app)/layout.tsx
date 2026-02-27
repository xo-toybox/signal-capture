import Script from "next/script";
import BugReporter from "@/components/BugReporter";
import ToastProvider from "@/components/ToastProvider";
import CommandPaletteProvider from "@/components/CommandPaletteProvider";
import GlobalKeyboardNav from "@/components/GlobalKeyboardNav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ToastProvider>
      <CommandPaletteProvider>
        {children}
        <GlobalKeyboardNav />
        <BugReporter />
        <Script id="sw-register" strategy="afterInteractive">
          {`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`}
        </Script>
      </CommandPaletteProvider>
    </ToastProvider>
  );
}
