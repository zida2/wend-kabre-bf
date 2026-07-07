// Admin layout — no Navbar, no Footer.
// The admin page itself manages its own sidebar (AdminSidebar component)
// and authentication (onAuthStateChanged check).
// This layout is intentionally minimal.

export const metadata = {
  title: 'Admin — Wend-Kabré',
  description: 'Panel d\'administration Wend-Kabré',
  robots: { index: false, follow: false }, // Don't index admin pages
};

export default function AdminLayout({ children }) {
  return <>{children}</>;
}
