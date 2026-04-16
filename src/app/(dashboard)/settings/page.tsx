"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { updateUser, isUsernameTaken } from "@/lib/db/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const companies = [
  "TCS", "Infosys", "Wipro", "HCLTech", "Cognizant",
  "Accenture", "Tech Mahindra", "Zoho", "Flipkart",
  "Amazon India", "Google India", "Microsoft India",
  "Paytm", "Razorpay", "PhonePe", "Swiggy", "Zomato", "CRED",
];

const languages = [
  { value: "python", label: "Python" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
];

const semestersForYear: Record<number, number[]> = {
  1: [1, 2],
  2: [3, 4],
  3: [5, 6],
  4: [7, 8],
};

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [form, setForm] = useState({
    username: "",
    displayName: "",
    university: "",
    year: 1,
    semester: 1,
    targetCompany: "",
    preferredLanguage: "python" as "python" | "c" | "cpp" | "java",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username || "",
        displayName: profile.displayName || "",
        university: profile.university || "",
        year: profile.year || 1,
        semester: profile.semester || 1,
        targetCompany: profile.targetCompany || "",
        preferredLanguage: profile.preferredLanguage || "python",
      });
    }
  }, [profile]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      // Check username uniqueness if changed
      if (form.username && form.username !== profile?.username) {
        const taken = await isUsernameTaken(form.username, user.uid);
        if (taken) {
          setSaveError("Username is already taken.");
          showToast("Username is already taken.", "error");
          setSaving(false);
          return;
        }
      }

      await updateUser(user.uid, {
        username: form.username,
        displayName: form.displayName,
        university: form.university,
        year: form.year,
        semester: form.semester,
        targetCompany: form.targetCompany,
        preferredLanguage: form.preferredLanguage,
      });
      await refreshProfile();
      setSaved(true);
      showToast("Settings saved!", "success");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      const message = err instanceof Error ? err.message : "Failed to save settings. Please try again.";
      setSaveError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-on-surface font-medium tracking-tight">
          Settings
        </h1>
        <p className="text-on-surface-variant text-sm mt-2">
          Manage your profile and preferences.
        </p>
      </div>

      {/* Profile Section */}
      <section className="glass-panel subtle-border rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
          <span className="material-symbols-outlined text-primary-brand text-xl">person</span>
          <h2 className="text-on-surface text-lg font-medium">Profile Information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-on-surface-variant text-sm">
              Username
            </Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="bg-surface-container-lowest border-outline-variant/20 text-on-surface"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-on-surface-variant text-sm">
              Display Name
            </Label>
            <Input
              id="displayName"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="bg-surface-container-lowest border-outline-variant/20 text-on-surface"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="university" className="text-on-surface-variant text-sm">
              University
            </Label>
            <Input
              id="university"
              value={form.university}
              onChange={(e) => setForm({ ...form, university: e.target.value })}
              className="bg-surface-container-lowest border-outline-variant/20 text-on-surface"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year" className="text-on-surface-variant text-sm">
              Year
            </Label>
            <select
              id="year"
              value={form.year}
              onChange={(e) => {
                const newYear = parseInt(e.target.value);
                const validSems = semestersForYear[newYear] || [1, 2];
                const currentSemValid = validSems.includes(form.semester);
                setForm({ ...form, year: newYear, semester: currentSemValid ? form.semester : validSems[0] });
              }}
              className="w-full h-10 rounded-md bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm px-3 outline-none focus:ring-1 focus:ring-primary-brand/40"
            >
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="semester" className="text-on-surface-variant text-sm">
              Semester
            </Label>
            <select
              id="semester"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })}
              className="w-full h-10 rounded-md bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm px-3 outline-none focus:ring-1 focus:ring-primary-brand/40"
            >
              {(semestersForYear[form.year] || [1, 2]).map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="glass-panel subtle-border rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
          <span className="material-symbols-outlined text-primary-brand text-xl">tune</span>
          <h2 className="text-on-surface text-lg font-medium">Preferences</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="targetCompany" className="text-on-surface-variant text-sm">
              Target Company
            </Label>
            <select
              id="targetCompany"
              value={form.targetCompany}
              onChange={(e) => setForm({ ...form, targetCompany: e.target.value })}
              className="w-full h-10 rounded-md bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm px-3 outline-none focus:ring-1 focus:ring-primary-brand/40"
            >
              <option value="">Select a company</option>
              {companies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredLanguage" className="text-on-surface-variant text-sm">
              Preferred Language
            </Label>
            <select
              id="preferredLanguage"
              value={form.preferredLanguage}
              onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value as typeof form.preferredLanguage })}
              className="w-full h-10 rounded-md bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm px-3 outline-none focus:ring-1 focus:ring-primary-brand/40"
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Account Info (read-only) */}
      <section className="glass-panel subtle-border rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
          <span className="material-symbols-outlined text-primary-brand text-xl">shield</span>
          <h2 className="text-on-surface text-lg font-medium">Account</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-on-surface-variant text-sm">Email</Label>
            <p className="text-on-surface text-sm py-2 px-3 rounded-md bg-surface-container-lowest border border-outline-variant/10">
              {user?.email || "—"}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-on-surface-variant text-sm">Auth Provider</Label>
            <p className="text-on-surface text-sm py-2 px-3 rounded-md bg-surface-container-lowest border border-outline-variant/10 capitalize">
              {user?.providerData?.[0]?.providerId === "google.com" ? "Google" : "Email / Password"}
            </p>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gradient-primary text-on-primary font-medium px-8 h-11 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined text-[16px] mr-2 animate-spin">progress_activity</span>
              Saving...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px] mr-2">save</span>
              Save Changes
            </>
          )}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-green-400 text-sm">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Saved successfully!
          </span>
        )}
        {saveError && (
          <span className="flex items-center gap-1.5 text-red-400 text-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {saveError}
          </span>
        )}
      </div>
    </main>
  );
}
