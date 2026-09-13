/**
 * Authentication service — wraps Supabase Auth with phone OTP flow.
 *
 * Usage:
 *   1. Call `sendOtp('+919876543210')` — Supabase sends an SMS to the user.
 *   2. User types the 6-digit code and you call `verifyOtp(phone, code)`.
 *   3. A session is created and stored in AsyncStorage automatically.
 *
 * Falls back gracefully when the Supabase URL is not configured (offline mode).
 */
import { supabase } from '@/lib/supabase';

export type AuthUser = {
  id: string;
  phone: string | null;
  email: string | null;
  displayName: string | null;
};

function sessionToUser(session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>): AuthUser {
  const user = session.user;
  return {
    id: user.id,
    phone: user.phone ?? null,
    email: user.email ?? null,
    displayName: (user.user_metadata?.display_name as string | undefined) ?? null,
  };
}

/** Send a phone OTP. Returns an error string on failure, null on success. */
export async function sendPhoneOtp(phone: string): Promise<string | null> {
  try {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return error?.message ?? null;
  } catch {
    return 'Network unavailable — please try when connected.';
  }
}

/** Verify the OTP code received by SMS. Returns the user or an error string. */
export async function verifyPhoneOtp(phone: string, token: string): Promise<{ user: AuthUser } | { error: string }> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error || !data.session) return { error: error?.message ?? 'Verification failed.' };
    return { user: sessionToUser(data.session) };
  } catch {
    return { error: 'Network unavailable — please try when connected.' };
  }
}

/** Update the display name stored in Supabase Auth user metadata. */
export async function updateDisplayName(name: string): Promise<string | null> {
  try {
    const { error } = await supabase.auth.updateUser({ data: { display_name: name } });
    return error?.message ?? null;
  } catch {
    return 'Network unavailable.';
  }
}

/** Sign out and clear the local session. */
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Best-effort — local session is cleared regardless.
  }
}

/** Get the currently authenticated user, or null if not signed in. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    return sessionToUser(data.session);
  } catch {
    return null;
  }
}
