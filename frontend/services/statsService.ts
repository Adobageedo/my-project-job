import { supabase } from '@/lib/supabase';

export interface PlatformStat {
  id: string;
  key: string;
  value: number;
  label: string;
  display_order: number;
  is_active: boolean;
}

export interface FormattedStat {
  key: string;
  displayValue: string;
  label: string;
}

/**
 * Format a number to display with + suffix
 * e.g., 1045 -> "1000+", 523 -> "500+", 50 -> "50+"
 */
export function formatStatValue(value: number): string {
  if (value < 100) {
    // For small numbers, round to nearest 10
    const rounded = Math.floor(value / 10) * 10;
    return `${rounded > 0 ? rounded : value}+`;
  } else if (value < 1000) {
    // For hundreds, round to nearest 100
    const rounded = Math.floor(value / 100) * 100;
    return `${rounded}+`;
  } else if (value < 10000) {
    // For thousands, round to nearest 1000
    const rounded = Math.floor(value / 1000) * 1000;
    return `${rounded.toLocaleString('fr-FR')}+`;
  } else {
    // For larger numbers, round to nearest 10000
    const rounded = Math.floor(value / 10000) * 10000;
    return `${rounded.toLocaleString('fr-FR')}+`;
  }
}

/**
 * Fetch all active platform statistics
 */
export async function getPlatformStats(): Promise<PlatformStat[]> {
  const { data, error } = await supabase
    .from('platform_stats')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching platform stats:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch platform statistics formatted for display
 */
export async function getFormattedPlatformStats(): Promise<FormattedStat[]> {
  const stats = await getPlatformStats();
  
  return stats.map(stat => ({
    key: stat.key,
    displayValue: formatStatValue(stat.value),
    label: stat.label,
  }));
}

/**
 * Update a platform statistic (admin only)
 */
export async function updatePlatformStat(key: string, value: number): Promise<boolean> {
  const { error } = await supabase
    .from('platform_stats')
    .update({ value })
    .eq('key', key);

  if (error) {
    console.error('Error updating platform stat:', error);
    return false;
  }

  return true;
}

/**
 * Get a single stat by key
 */
export async function getPlatformStatByKey(key: string): Promise<PlatformStat | null> {
  const { data, error } = await supabase
    .from('platform_stats')
    .select('*')
    .eq('key', key)
    .single();

  if (error) {
    console.error('Error fetching platform stat:', error);
    return null;
  }

  return data;
}
