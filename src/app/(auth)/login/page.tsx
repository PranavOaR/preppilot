import { HeroPanel } from "@/components/auth/hero-panel";
import { LoginForm } from "@/components/auth/login-form";
import { PersistenceTimer } from "@/components/auth/persistence-timer";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex bg-surface">
      {/* Left Panel — Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-container-low">
        <HeroPanel />
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-surface">
        <LoginForm />
      </div>

      {/* Floating Timer */}
      <PersistenceTimer />
    </main>
  );
}
