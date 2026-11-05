import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/frontend/features/auth/context/AuthProvider";
import Onboarding from "@/frontend/features/onboarding/components/Onboarding";
import { APP_NAME } from "@/frontend/utils/config";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Manage players, practice attendance, matches and scouting readiness for your sports academy.",
};

/** Root shell only. Each route group - (site), (auth), (app) - provides its own layout. */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      {/* overflow-x-clip: no sideways page scroll on phones (unlike overflow-hidden it keeps sticky headers working). */}
      <body className="min-h-screen overflow-x-clip font-sans">
        <AuthProvider>
          {children}
          <Onboarding />
        </AuthProvider>
      </body>
    </html>
  );
}
