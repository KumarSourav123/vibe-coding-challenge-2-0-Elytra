import './globals.css';

export const metadata = {
  title: 'Sports Academy Management System',
  description: 'Manage players, practice sessions, attendance, matches, and player readiness.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}

