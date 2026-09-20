import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Review | Job Match",
  description: "A focused, evidence-based resume review powered by TypeSafe Jev.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
