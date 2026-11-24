/**
 * Firebase Crashlytics, wrapped so the app still runs where the native module
 * is missing (Expo Go, Jest). In a real build:
 * - uncaught JS errors and native crashes are reported automatically once
 *   `initCrashlytics()` has run;
 * - `reportError()` records a caught error as a non-fatal issue;
 * - `breadcrumb()` adds a log line that ships with the next report.
 */
type CrashlyticsModule = typeof import("@react-native-firebase/crashlytics");

let mod: CrashlyticsModule | null = null;
let instance: ReturnType<CrashlyticsModule["getCrashlytics"]> | null = null;

function load() {
  if (instance) return instance;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("@react-native-firebase/crashlytics") as CrashlyticsModule;
    instance = mod.getCrashlytics();
  } catch {
    mod = null;
    instance = null;
  }
  return instance;
}

/** Call once at startup. Collection stays off in development builds. */
export function initCrashlytics() {
  const c = load();
  if (!c || !mod) return;
  mod.setCrashlyticsCollectionEnabled(c, !__DEV__).catch(() => {});
}

export function reportError(error: unknown, context?: string) {
  const c = load();
  if (!c || !mod) return;
  const err = error instanceof Error ? error : new Error(String(error));
  if (context) mod.log(c, context);
  mod.recordError(c, err);
}

export function breadcrumb(message: string) {
  const c = load();
  if (!c || !mod) return;
  mod.log(c, message);
}
