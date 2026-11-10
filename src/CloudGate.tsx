import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import CloudApp from "./CloudApp";
import { Eye, EyeOff } from "lucide-react";

/**
 * DEMO-ONLY CLIENT GATE
 * This is a UI gate, not production authentication. The verifier is shipped
 * to the browser and can be attacked offline; client-side state can be changed
 * in DevTools. Do not use it to protect confidential data or privileged APIs.
 */
const SESSION_KEY = "cloudgate.demo.unlocked";
const PBKDF2_ITERATIONS = 600_000;

// Replace these with the values from a fresh, correctly generated hash pair.
const ACCESS_SALT_B64 = "XGtMq8dkVNuTmmpf0uvhHGfhN+edfM3dK0iFx/451Dw=";
const ACCESS_HASH_B64 = "jxeyfuVkFB3jkjLxoRk7rmK+mGF+ag6sNJmttePxB8g=";

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

// Copy bytes into a plain ArrayBuffer. This satisfies newer TypeScript
// BufferSource typings, which distinguish ArrayBuffer from SharedArrayBuffer.
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }

  return difference === 0;
}

async function verifyAccessPhrase(passphrase: string): Promise<boolean> {
  if (
    !ACCESS_SALT_B64 ||
    !ACCESS_HASH_B64 ||
    ACCESS_SALT_B64.startsWith("REPLACE_") ||
    ACCESS_HASH_B64.startsWith("REPLACE_")
  ) {
    throw new Error("SETUP_REQUIRED");
  }

  if (!globalThis.crypto?.subtle) {
    throw new Error("SECURE_CONTEXT_REQUIRED");
  }

  let salt: Uint8Array;
  let expectedHash: Uint8Array;

  try {
    salt = fromBase64(ACCESS_SALT_B64);
    expectedHash = fromBase64(ACCESS_HASH_B64);
  } catch {
    throw new Error("INVALID_VERIFIER");
  }

  // The generator creates a 32-byte random salt and a 32-byte PBKDF2 result.
  if (salt.length !== 32 || expectedHash.length !== 32) {
    throw new Error("INVALID_VERIFIER");
  }

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(new TextEncoder().encode(passphrase)),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return constantTimeEqual(
    new Uint8Array(derivedBits),
    expectedHash,
  );
}

function CloudGate() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const configured =
    !ACCESS_SALT_B64.startsWith("REPLACE_") &&
    !ACCESS_HASH_B64.startsWith("REPLACE_");

  useEffect(() => {
    try {
      setAuthenticated(sessionStorage.getItem(SESSION_KEY) === "yes");
    } catch {
      setAuthenticated(false);
    } finally {
      setReady(true);
    }
  }, []);

  const handleUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (checking || !password.trim()) return;

    setChecking(true);
    setError("");

    try {
      const valid = await verifyAccessPhrase(password);

      if (!valid) {
        setError("That access phrase doesn’t match. Try again.");
        setPassword("");
        return;
      }

      try {
        sessionStorage.setItem(SESSION_KEY, "yes");
      } catch {
        // The current React state still unlocks this tab if storage is disabled.
      }

      setAuthenticated(true);
      setPassword("");
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "UNKNOWN";
      if (code === "SETUP_REQUIRED") {
        setError(
          "This demo gate needs its generated verifier configured first.",
        );
      } else if (code === "SECURE_CONTEXT_REQUIRED") {
        setError("Password verification requires HTTPS or localhost.");
      } else if (code === "INVALID_VERIFIER") {
        setError("The access verifier is invalid. Regenerate the salt and hash.");
      } else {
        setError("Verification couldn’t complete. Please try again.");
      }
    } finally {
      setChecking(false);
    }
  };

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f7fa] px-6">
        <div
          className="flex items-center gap-3 text-sm text-slate-500"
          role="status"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
          Preparing your workspace
        </div>
      </main>
    );
  }

  if (authenticated) return <CloudApp />;

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f6f9] px-4 py-10 text-[#182230] sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-blue-200/35 blur-3xl" />
        <div className="absolute -bottom-56 -right-32 h-[36rem] w-[36rem] rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.24] [background-image:radial-gradient(#94a3b8_0.65px,transparent_0.65px)] [background-size:22px_22px]" />
      </div>

      <section className="w-full max-w-[1040px] overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_32px_100px_-48px_rgba(15,23,42,0.34)] lg:grid lg:min-h-[650px] lg:grid-cols-[1.02fr_0.98fr]">
        {/* Brand / context panel */}
        <div className="relative flex min-h-[260px] flex-col justify-between overflow-hidden bg-[#101b2d] p-7 text-white sm:p-10 lg:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute -right-28 -top-32 h-96 w-96 rounded-full border border-white/[0.07]" />
            <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/[0.06]" />
            <div className="absolute bottom-[-170px] left-[-100px] h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[90px]" />
            <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          </div>

          <div className="relative flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#15233a] shadow-lg shadow-black/10">
              <svg
                viewBox="0 0 24 24"
                className="h-[22px] w-[22px]"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7.2 18.2h10.1a4.1 4.1 0 0 0 .5-8.17A5.8 5.8 0 0 0 6.7 8.8a4.75 4.75 0 0 0 .5 9.4Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.02em]">
                CloudGate
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.19em] text-slate-400">
                Cloud workspace
              </p>
            </div>
          </div>

          <div className="relative mt-12 max-w-[430px] lg:mt-0 lg:py-14">
            <p className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200/80">
              <span className="h-px w-7 bg-blue-300/70" /> A focused environment
            </p>
            <h1 className="max-w-[420px] text-[clamp(2.6rem,5vw,4.15rem)] font-semibold leading-[1.04] tracking-[-0.065em] text-white">
              Your cloud work,
              <span className="block text-blue-200">in one place.</span>
            </h1>
            <p className="mt-6 max-w-[340px] text-sm leading-7 text-slate-300/75">
              A considered workspace for architecture, delivery, and the systems
              behind them.
            </p>

            <div className="mt-10 flex flex-wrap gap-2">
              {[
                ["01", "Architecture"],
                ["02", "Engineering"],
                ["03", "Operations"],
              ].map(([number, label]) => (
                <div
                  key={number}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2.5"
                >
                  <span className="font-mono text-[9px] text-blue-200/70">
                    {number}
                  </span>
                  <span className="text-[11px] font-medium text-slate-200">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-12 flex items-center justify-between border-t border-white/10 pt-5 text-[10px] text-slate-400 lg:mt-0">
            <span>BUILT FOR DEEP WORK</span>
            <span className="font-mono tracking-wide text-slate-500">
              CG / 01
            </span>
          </div>
        </div>

        {/* Access panel */}
        <div className="flex items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-14">
          <div className="w-full max-w-[360px]">
            <div className="mb-12 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Workspace access
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Local
                demo
              </span>
            </div>

            <div>
              <p className="text-sm font-medium text-blue-700">Welcome</p>
              <h2 className="mt-2 text-[34px] font-semibold tracking-[-0.055em] text-slate-900">
                Sign in to continue
              </h2>
              <p className="mt-3 text-[13px] leading-6 text-slate-500">
                Enter the private access phrase to open your cloud workspace.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="mt-8 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="cloud-access-phrase"
                    className="text-[12px] font-medium tracking-tight text-slate-700 select-none"
                  >
                    Access phrase
                  </label>
                  <span className="text-[11px] font-normal text-slate-400">
                    Verified in this browser
                  </span>
                </div>

                {/* Input container with layered shadow and micro-glow */}
                <div
                  className={`group relative flex h-12 items-center rounded-xl border bg-white/80 backdrop-blur-md px-3.5 transition-all duration-200 ${
                    error
                      ? "border-rose-400/80 bg-rose-50/20 shadow-[0_0_0_3px_rgba(244,63,94,0.12)]"
                      : "border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-slate-300 focus-within:border-slate-900 focus-within:shadow-[0_0_0_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(0,0,0,0.04)]"
                  }`}
                >
                  {/* Icon with interactive color shift */}
                  <svg
                    viewBox="0 0 24 24"
                    className={`mr-2.5 h-[17px] w-[17px] shrink-0 transition-colors duration-150 ${
                      error
                        ? "text-rose-500"
                        : "text-slate-400 group-focus-within:text-slate-800"
                    }`}
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="4.5"
                      y="10"
                      width="15"
                      height="10.5"
                      rx="2.2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M8 10V7.4a4 4 0 1 1 8 0V10"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>

                  <input
                    id="cloud-access-phrase"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter your security phrase…"
                    autoComplete="current-password"
                    spellCheck={false}
                    required
                    disabled={checking}
                    className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  {/* Show/Hide password toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Hide access phrase" : "Show access phrase"
                    }
                    className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-95"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Animated error banner */}
                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium text-rose-600"
                  >
                    <svg
                      className="h-3.5 w-3.5 shrink-0"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm7.25-3.25a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Zm.75 6.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={checking || !password.trim() || !configured}
                className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-4 text-[13px] font-medium tracking-tight text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.14)] transition-all duration-150 hover:bg-slate-800 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
              >
                {checking ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <span className="text-white">Open workspace</span>
                    <svg
                      viewBox="0 0 16 16"
                      className="h-3.5 w-3.5 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {!configured && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-800">
                Setup required: generate a verifier and replace the two
                configuration values in{" "}
                <span className="font-mono">CloudGate.tsx</span>.
              </p>
            )}

            <div className="mt-9 border-t border-slate-100 pt-5">
              <div className="flex items-start gap-3">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3.5 19 6v5.1c0 4.6-2.8 7.7-7 9.4-4.2-1.7-7-4.8-7-9.4V6l7-2.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m9 12 2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-[10px] leading-[1.7] text-slate-400">
                  Demo access is checked locally in this browser. It is intended
                  to keep a casual visitor out of the UI, not to secure
                  confidential content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <p className="absolute bottom-4 left-0 right-0 px-4 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-slate-400">
        CloudGate <span className="mx-1.5 text-slate-300">/</span> Private
        workspace demo
      </p>
    </main>
  );
}

export default CloudGate;
