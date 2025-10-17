import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Jazz Metadata Viewer",
  description: "View detailed jazz session credits",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
