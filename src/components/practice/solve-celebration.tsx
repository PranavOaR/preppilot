"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import type { Problem } from "@/lib/types";

interface SolveCelebrationProps {
  problem: Problem;
  xpEarned: number;
  username?: string;
  onClose: () => void;
}

export function SolveCelebration({ problem, xpEarned, username, onClose }: SolveCelebrationProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Multi-burst confetti
    const colors = ["#bb86fc", "#03dac6", "#ffd700", "#ff6b9d"];
    const duration = 1800;
    const end = Date.now() + duration;
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.6 },
      colors,
    });
  }, []);

  const shareText =
    `I just solved "${problem.title}" on PrepPilot${username ? ` (@${username})` : ""}! ` +
    `+${xpEarned} XP · ${problem.difficulty} · ${problem.topic.replace(/-/g, " ")}`;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/practice/${problem.slug}`
      : "";

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-surface rounded-2xl subtle-border w-full max-w-md p-6 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-primary-brand/20 blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-on-surface-variant hover:text-on-surface transition-colors z-10"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="relative space-y-4 text-center">
          <div className="text-5xl">🎉</div>
          <div>
            <h3 className="font-serif text-on-surface text-2xl font-medium">
              First solve!
            </h3>
            <p className="text-on-surface-variant text-sm mt-1">
              You cracked <span className="text-on-surface font-medium">{problem.title}</span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-container/20">
              <span className="material-symbols-outlined text-primary-brand text-[16px]">bolt</span>
              <span className="text-primary-brand font-mono text-sm font-semibold">+{xpEarned} XP</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container">
              <span className="text-on-surface-variant text-xs capitalize">{problem.difficulty}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-on-surface-variant text-xs uppercase tracking-wider">
              Share your win
            </p>
            <div className="flex items-center gap-2 justify-center">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Copied!" : "Copy"}
              </button>
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1da1f2]/15 text-[#1da1f2] text-xs font-medium hover:bg-[#1da1f2]/25 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">share</span>
                Twitter
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/15 text-green-400 text-xs font-medium hover:bg-green-500/25 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">share</span>
                WhatsApp
              </a>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-2 py-2.5 rounded-xl gradient-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Keep grinding
          </button>
        </div>
      </div>
    </div>
  );
}
