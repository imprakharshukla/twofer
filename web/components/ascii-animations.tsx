"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

/* ── Braille Spinner ── */
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function AsciiSpinner({ className }: { className?: string }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % SPINNER_FRAMES.length), 80);
    return () => clearInterval(id);
  }, []);
  return <span className={`font-mono ${className ?? ""}`}>{SPINNER_FRAMES[frame]}</span>;
}

/* ── Idle / Awaiting ── */
export function IdleAnimation() {
  return (
    <div className="flex flex-col items-center gap-3 h-[60px] justify-center">
      <div className="relative w-[200px] h-[24px]">
        {/* Left diamond */}
        <motion.span
          className="absolute font-mono text-orange text-lg select-none"
          animate={{ x: [20, 70, 20] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          ◇
        </motion.span>
        {/* Right diamond */}
        <motion.span
          className="absolute font-mono text-foreground text-lg select-none"
          animate={{ x: [170, 120, 170] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          ◇
        </motion.span>
      </div>
      <span className="font-mono text-muted-foreground/30 text-[10px] tracking-[0.3em] select-none">
        + ─────────────────── +
      </span>
    </div>
  );
}

/* ── Converged / Merged ── */
export function ConvergedAnimation() {
  const [merged, setMerged] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMerged(true), 1600);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 h-[80px] justify-center">
      <div className="relative w-[200px] h-[28px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!merged ? (
            /* Approach phase */
            <motion.div key="approach" className="absolute inset-0 flex items-center justify-center">
              <motion.span
                className="absolute font-mono text-orange text-xl select-none"
                initial={{ x: -60 }}
                animate={{ x: -6 }}
                transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
              >
                ◇
              </motion.span>
              <motion.span
                className="absolute font-mono text-foreground text-xl select-none"
                initial={{ x: 60 }}
                animate={{ x: 6 }}
                transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
              >
                ◇
              </motion.span>
            </motion.div>
          ) : (
            /* Merged + breathing */
            <motion.div
              key="merged"
              className="flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.span
                className="font-mono text-orange text-2xl select-none"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                ◆
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: merged ? 1 : 0, y: merged ? 0 : 4 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <span className="font-mono text-muted-foreground/40 text-xs">──</span>
        <span className="font-mono text-agreed text-xs tracking-[0.3em]">CONVERGED</span>
        <span className="font-mono text-muted-foreground/40 text-xs">──</span>
      </motion.div>
    </div>
  );
}

/* ── Disputed ── */
export function DisputedIcon({ className }: { className?: string }) {
  return (
    <motion.span
      className={`font-mono text-disputed text-[11px] select-none inline-block ${className ?? ""}`}
      animate={{ x: [-1, 1, -1] }}
      transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
    >
      ▸✕◂
    </motion.span>
  );
}

/* ── Connecting ── */
export function ConnectingAnimation() {
  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <AsciiSpinner className="text-orange text-3xl" />
    </motion.div>
  );
}
