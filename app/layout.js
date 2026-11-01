import './globals.css';
import AppLayout from '@/frontend/components/common/AppLayout';

export const metadata = {
  title: 'Apex Sports Academy Management System | Vibe Coding Challenge',
  description:
    'High-performance sports academy management system uniting Coaches, Athletes, and Talent Scouts with verified readiness intelligence.',
  keywords: ['Sports Academy', 'Athlete Management', 'Readiness Score', 'Attendance Tracking', 'Next.js App Router'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}

