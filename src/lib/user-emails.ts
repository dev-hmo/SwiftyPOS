/**
 * User email resolution via database RPC.
 *
 * Replaces supabase.auth.admin.getUserById() which requires the service_role
 * key and must never be used in client-side code. The get_user_emails() RPC
 * is a SECURITY DEFINER function that returns emails for a list of user UUIDs.
 */
import { supabase } from './supabase';

export interface UserEmail {
  userId: string;
  email: string;
}

const emailCache = new Map<string, string>();

/**
 * Fetches email addresses for an array of user IDs via the get_user_emails RPC.
 * Results are cached in-memory to avoid redundant calls within a session.
 */
export async function getUserEmails(userIds: string[]): Promise<UserEmail[]> {
  const uncached = userIds.filter((id) => !emailCache.has(id));

  if (uncached.length > 0) {
    const { data, error } = await supabase.rpc('get_user_emails', {
      p_user_ids: uncached,
    });

    if (!error && Array.isArray(data)) {
      for (const row of data as { user_id: string; email: string }[]) {
        emailCache.set(row.user_id, row.email);
      }
    }
  }

  return userIds.map((id) => ({
    userId: id,
    email: emailCache.get(id) ?? 'unknown',
  }));
}

/**
 * Returns a single user's email, or 'unknown' if not found.
 */
export async function getUserEmail(userId: string): Promise<string> {
  const results = await getUserEmails([userId]);
  return results[0]?.email ?? 'unknown';
}
