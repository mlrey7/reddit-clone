import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";
import { Inter } from "next/font/google";

export const metadata = {
  title: "Breadit",
  description: "A Reddit clone built with Next.js and TypeScript.",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
  authModal,
}: {
  children: React.ReactNode;
  authModal: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "bg-white font-light text-slate-900 antialiased",
        inter.className,
      )}
    >
      <body className="min-h-screen bg-slate-50 antialiased">
        <Providers>
          <Navbar />
          <div>{authModal}</div>

          <div className="container mx-auto h-full max-w-7xl pt-24">
            {children}
          </div>

          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
