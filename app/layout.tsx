import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "QUEDERA SENTINEL — Trusted consulting expertise. Controlled engagement.",
  description:
    "Two-sided consultant marketplace with a controlled contracting workflow. Trusted expertise. Controlled engagement.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="min-h-[calc(100vh-160px)]">{children}</main>
        <footer className="border-t border-gray-200 py-8 mt-16">
          <div className="container mx-auto px-4 text-sm text-gray-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p>
                <span className="font-semibold text-quedera-navy">QUEDERA</span>{" "}
                <span className="font-semibold text-sentinel">SENTINEL</span>
                <span className="ml-3">— Trusted expertise. Controlled engagement.</span>
              </p>
              <p className="text-xs">
                Your information is securely held within QUEDERA SENTINEL.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
