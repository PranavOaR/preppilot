export default function FlaggedPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <span className="material-symbols-outlined text-error text-7xl">
            gpp_bad
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-on-surface text-2xl font-semibold">
            Account Flagged
          </h1>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Your account has been flagged for unethical behavior during a
            proctored session (repeated tab switching or fullscreen exits).
          </p>
          <p className="text-on-surface-variant text-sm">
            If you believe this is a mistake, please contact support.
          </p>
        </div>

        <div className="pt-2">
          <a
            href="/login"
            className="text-primary-brand text-sm hover:underline"
          >
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
