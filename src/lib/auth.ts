/**
 * Client-side auth for the demo. Accounts live in localStorage; passwords
 * are stored as a salted SHA-256 hash. There is no server, so this is *not*
 * a substitute for real authentication — it just makes the sign up / log in
 * flow real enough that emails and passwords are validated and remembered
 * across reloads on the same device.
 */
"use client";

const ACCOUNTS_KEY = "silverSparks.accounts.v1";
const SESSION_KEY = "silverSparks.session.v1";
const LEGACY_PROFILE_KEY = "silverSparks.userProfile.v1";

export const MIN_PASSWORD_LENGTH = 8;

export type StoredAccount = {
  email: string;
  passwordHash: string;
  salt: string;
  createdAtIso: string;
};

type AccountsStore = { accounts: StoredAccount[] };
type Session = { email: string };

export type AuthErrorCode =
  | "invalid_email"
  | "weak_password"
  | "email_taken"
  | "no_account"
  | "wrong_password";

export type AuthError = { code: AuthErrorCode; message: string };
export type AuthResult =
  | { ok: true; email: string }
  | { ok: false; error: AuthError };

function readAccounts(): AccountsStore {
  if (typeof window === "undefined") return { accounts: [] };
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return { accounts: [] };
    const parsed = JSON.parse(raw) as AccountsStore;
    if (!parsed || !Array.isArray(parsed.accounts)) return { accounts: [] };
    return parsed;
  } catch {
    return { accounts: [] };
  }
}

function writeAccounts(store: AccountsStore) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(store));
}

function setSession(session: Session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getCurrentEmail(): string | null {
  return loadSession()?.email ?? null;
}

export function isAuthenticated(): boolean {
  return getCurrentEmail() !== null;
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

function generateSalt(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return bytesToHex(buf);
}

/**
 * Email is considered valid if it contains an "@" with at least one character
 * before and after, plus a "." in the domain part. We deliberately keep this
 * simple — anything close to a real email is fine for this demo.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): AuthError | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      code: "weak_password",
      message: `Please use at least ${MIN_PASSWORD_LENGTH} characters for your password.`,
    };
  }
  return null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * On first-ever sign up we hand any pre-existing local profile (from the old
 * single-profile demo) over to the new account so seniors don't lose progress.
 */
function migrateLegacyProfileTo(email: string) {
  if (typeof window === "undefined") return;
  const legacy = window.localStorage.getItem(LEGACY_PROFILE_KEY);
  if (!legacy) return;
  const targetKey = `silverSparks.profile.${email}`;
  if (window.localStorage.getItem(targetKey)) return;
  window.localStorage.setItem(targetKey, legacy);
  window.localStorage.removeItem(LEGACY_PROFILE_KEY);
}

export async function signUp(
  emailRaw: string,
  password: string,
): Promise<AuthResult> {
  const email = normalizeEmail(emailRaw);
  if (!isValidEmail(email)) {
    return {
      ok: false,
      error: {
        code: "invalid_email",
        message: "Please enter a valid email — it should include an @ symbol.",
      },
    };
  }
  const pwError = validatePassword(password);
  if (pwError) return { ok: false, error: pwError };

  const store = readAccounts();
  const wasFirstAccount = store.accounts.length === 0;
  if (store.accounts.some((a) => a.email === email)) {
    return {
      ok: false,
      error: {
        code: "email_taken",
        message:
          "An account already exists for this email. Try logging in instead.",
      },
    };
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  store.accounts.push({
    email,
    passwordHash,
    salt,
    createdAtIso: new Date().toISOString(),
  });
  writeAccounts(store);
  setSession({ email });
  if (wasFirstAccount) migrateLegacyProfileTo(email);
  return { ok: true, email };
}

export async function logIn(
  emailRaw: string,
  password: string,
): Promise<AuthResult> {
  const email = normalizeEmail(emailRaw);
  if (!isValidEmail(email)) {
    return {
      ok: false,
      error: {
        code: "invalid_email",
        message: "Please enter a valid email — it should include an @ symbol.",
      },
    };
  }
  if (!password) {
    return {
      ok: false,
      error: {
        code: "wrong_password",
        message: "Please enter your password.",
      },
    };
  }

  const store = readAccounts();
  const account = store.accounts.find((a) => a.email === email);
  if (!account) {
    return {
      ok: false,
      error: {
        code: "no_account",
        message:
          "We couldn't find an account with that email on this device. Sign up to create one.",
      },
    };
  }
  const computed = await hashPassword(password, account.salt);
  if (computed !== account.passwordHash) {
    return {
      ok: false,
      error: {
        code: "wrong_password",
        message: "That email and password don't match. Please try again.",
      },
    };
  }
  setSession({ email });
  return { ok: true, email };
}

export function logOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
