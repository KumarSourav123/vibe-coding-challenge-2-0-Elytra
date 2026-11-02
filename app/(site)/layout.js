import SiteFooter from "@/frontend/components/layout/SiteFooter";
import SiteHeader from "@/frontend/components/layout/SiteHeader";

/** Public marketing pages. */
export default function SiteLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
