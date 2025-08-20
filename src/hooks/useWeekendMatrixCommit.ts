import { supabase } from '@/integrations/supabase/client';

export interface WeekendMatrixEvent {
  talent_id: string;
  event_title: string;
  status: 'booked'|'hold'|'tentative'|'available'|'cancelled'|'not_available';
  all_day: true;
  timezone: string;
  start_date: string;   // YYYY-MM-DD format
  end_date: string;     // YYYY-MM-DD format
  venue_name?: string|null;
  location_city?: string|null;
  location_state?: string|null;
  location_country?: string|null;
  address_line?: string|null;
  notes_public?: string|null;
  notes_internal?: string|null;
  source_file?: string|null;
  source_row_id?: string|null;
}

export interface CommitResponse {
  ok: boolean;
  counts: {
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  errors?: string[];
}

export async function commitWeekendMatrix({
  talentId,
  year,
  mode,
  events
}: {
  talentId: string;
  year: number;
  mode: 'merge' | 'replace';
  events: WeekendMatrixEvent[];
}): Promise<CommitResponse> {
  // Get the current session for authorization
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.session?.access_token) {
    throw new Error('Authentication required');
  }

  const response = await supabase.functions.invoke('import-weekend-matrix-commit', {
    body: {
      talentId,
      year,
      mode,
      events
    }
  });

  if (response.error) {
    console.error('Weekend Matrix commit failed:', response.error);
    throw new Error(response.error.message || 'Import failed');
  }

  return response.data as CommitResponse;
}