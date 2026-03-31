'use server'

import type { SupabaseClient, PostgrestSingleResponse } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

/**
 * IMPORTANT: Supabase TypeScript typing works best with LITERAL table names.
 * 
 * WHY: When you use .from('tableName') where 'tableName' is a literal string,
 * TypeScript can statically infer the Row, Insert, and Update types.
 * When you use .from(variable), TypeScript loses type inference.
 * 
 * RECOMMENDATION: Use direct Supabase calls in action files with literal table names.
 * Example:
 *   const { data, error } = await supabase
 *     .from('attendances')  // literal string = type-safe
 *     .insert(insertData)
 *     .select()
 *     .single()
 * 
 * This gives you automatic typing without any casting needed.
 * TypeScript knows exactly what fields exist on 'attendances'.
 */

// These helpers are kept as documentation/examples
// For production, prefer literal table names directly in action functions

/**
 * Example: Insert attendence with automatic type inference
 * const { data, error } = await supabase
 *   .from('attendances')
 *   .insert({ session_id, student_id, ... })
 *   .select()
 *   .single()
 */

/**
 * Example: Check student package credits  
 * const { data: pkg } = await supabase
 *   .from('student_packages')
 *   .select('remaining_credits')
 *   .eq('id', studentPackageId)
 *   .maybeSingle()
 */
