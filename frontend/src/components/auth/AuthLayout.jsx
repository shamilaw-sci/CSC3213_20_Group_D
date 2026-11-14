/**
 * @file AuthLayout.jsx
 * @module Authentication UI
 * @desc Shared public-auth card, branding and scoped accessible color/control rules.
 * @author Original author unverified
 */
import Card from '../common/Card';
import './auth.css';

/** Shared sign-in and registration layout. Keeps the Care4U heading and card consistent on all public authentication screens. */
export default function AuthLayout({ title, description, children }) {
  return (
    <main className="auth-page min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md min-w-0">
        <header className="text-center mb-8">
          {/* Care4U heading — change the public auth page title here */}
          <h1 className="text-3xl font-bold text-brand-deep">Care4U</h1>
          <p className="text-muted-foreground mt-1 font-medium">Centralized Healthcare Ecosystem</p>
        </header>
        <Card>
          {/* Screen heading — login, registration and recovery pages supply this text */}
          <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mb-6 break-words">{description}</p>}
          {children}
        </Card>
        <p className="text-center text-xs font-medium text-muted-foreground mt-6">© 2026 Care4U · Group D · CSC3213</p>
      </div>
    </main>
  );
}
