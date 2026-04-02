import { RegisterForm } from "@/components/auth/register-form";
import { HeroPanel } from "@/components/auth/hero-panel";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex bg-surface">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-container-low">
        <HeroPanel />
      </div>

      {/* Right Panel — Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-surface">
        <RegisterForm />
      </div>
    </main>
  );
}
