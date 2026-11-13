/**
 * @file AuthLayout.jsx
 * @module Authentication UI
 * @desc Shared public-auth card, branding and scoped accessible color/control rules.
 * @author Codex Review Assistant (Stage 3A; no student authorship claimed)
 */
import Card from '../common/Card';
import './auth.css';

/**
 * @component AuthLayout
 * @param {Object} props Title, optional help and screen content.
 * @returns {JSX.Element} Responsive auth shell; no session or navigation logic.
 */
export default function AuthLayout({ title, description, children }) {
  return (
    <main className="auth-page min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md min-w-0">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-deep">Care4U</h1>
          <p className="text-muted-foreground mt-1 font-medium">Centralized Healthcare Ecosystem</p>
        </header>
        <Card>
          <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mb-6 break-words">{description}</p>}
          {children}
        </Card>
        <p className="text-center text-xs font-medium text-muted-foreground mt-6">© 2026 Care4U · Group D · CSC3213</p>
      </div>
    </main>
  );
}
