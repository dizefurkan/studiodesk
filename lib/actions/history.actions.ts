"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getOrganization } from "@/lib/auth/getOrganization";
import { createAdminClient } from "@/lib/supabase/admin";

// ========================================
// LOGGING UTILITY - NON-BREAKING
// ========================================

export type HistoryAction = "CREATE" | "UPDATE" | "DELETE";
export type HistoryEntity =
  | "student"
  | "instructor"
  | "course"
  | "package"
  | "student_package"
  | "branch"
  | "dance_type"
  | "attendance"
  | "course_student"
  | "instructor_rate"
  | "cash_register"
  | "studio"
  | "invitation"
  | "organization_settings";

interface HistoryLogData {
  before?: Record<string, any>; // Previous values (for UPDATE/DELETE)
  after?: Record<string, any>; // New values (for CREATE/UPDATE)
  changes?: Record<string, { before: any; after: any }>; // Only changed fields (for UPDATE)
  [key: string]: any; // Allow additional metadata
}

/**
 * Logs an operation to history_logs table
 * Designed to be non-blocking - continues even if logging fails
 */
export async function logOperation(
  action: HistoryAction,
  entity: HistoryEntity,
  entityId: string,
  data?: HistoryLogData,
  organizationId?: string
) {
  try {
    // Get current user and organization if not provided
    const user = await getCurrentUser();
    if (!user) {
      console.warn("[logOperation] ⚠️ User not authenticated, skipping log");
      return;
    }

    const org = organizationId ? null : await getOrganization();
    const finalOrgId = organizationId || org?.id;
    if (!finalOrgId) {
      console.warn("[logOperation] ⚠️ No organization found, skipping log");
      return;
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient();

    console.log("[logOperation] 📝 Starting insertion:", {
      action,
      entity,
      entityId,
      organizationId: finalOrgId,
    });

    // Test if table exists by listing it
    console.log(
      "[logOperation] 🔍 Checking if history_logs table is accessible..."
    );
    const { error: tableError } = await (admin.from("history_logs") as any)
      .select("id")
      .limit(1);

    if (tableError) {
      console.error(
        "[logOperation] ❌ TABLE ERROR - history_logs table may not exist:",
        {
          code: (tableError as any).code,
          message: (tableError as any).message,
          details: (tableError as any).details,
        }
      );
      // Continue anyway - log to console what we would have logged
      console.log(
        "[logOperation] 📋 [CONSOLE LOG FALLBACK] Would have logged:",
        { action, entity, entityId }
      );
      return;
    }

    console.log("[logOperation] ✅ Table access OK, proceeding with insert...");

    const { error } = await (admin.from("history_logs") as any).insert({
      organization_id: finalOrgId,
      user_id: user.id,
      action,
      entity,
      entity_id: entityId,
      data: data || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[logOperation] ❌ INSERT ERROR:", {
        code: (error as any).code,
        message: (error as any).message,
        details: (error as any).details,
        hint: (error as any).hint,
        status: (error as any).status,
      });
    } else {
      console.log("[logOperation] ✅ Successfully inserted:", {
        action,
        entity,
        entityId,
      });
    }
  } catch (error) {
    console.error("[logOperation] ❌ EXCEPTION:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

// ========================================
// EXISTING HISTORY QUERIES
// ========================================

export async function getStudentAttendanceHistory(studentId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const organization = await getOrganization();
  if (!organization) return { error: "No organization found" };

  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await (supabase.from("attendances") as any)
      .select(
        `
        id,
        created_at,
        course_sessions!inner(
          session_date,
          course:courses(
            id,
            name,
            dance_types(name),
            branches(name)
          )
        )
      `
      )
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching attendance history:", error);
      return { error: "Failed to fetch attendance history" };
    }

    return { data: data || [] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function getStudentPackageHistory(studentId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const organization = await getOrganization();
  if (!organization) return { error: "No organization found" };

  try {
    const supabase = await createServerSupabaseClient();

    // Get all attendance records for credit deductions
    const { data: attendances } = await supabase
      .from("attendances")
      .select("student_package_id, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    // Get package purchase history
    const { data: packages, error } = await supabase
      .from("student_packages")
      .select(
        `
        id,
        created_at,
        remaining_credits,
        package:packages(
          id,
          name,
          total_credits,
          dance_types(name)
        )
      `
      )
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching package history:", error);
      return { error: "Failed to fetch package history" };
    }

    // Combine: for each package, count how many attendances used that package
    const packagesWithStats = (packages || []).map((pkg: any) => {
      const creditsUsed =
        (pkg.package?.total_credits || 0) - (pkg.remaining_credits || 0);
      const attendanceCount =
        (attendances || []).filter((a: any) => a.student_package_id === pkg.id)
          .length || 0;

      return {
        ...pkg,
        creditsUsed,
        attendanceCount,
      };
    });

    return { data: packagesWithStats };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// ========================================
// HISTORY LOGS QUERIES
// ========================================

export interface HistoryLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  data?: Record<string, any>;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

/**
 * Get recent history logs for the organization
 */
export async function getHistoryLogs(limit = 50): Promise<HistoryLog[]> {
  try {
    const organization = await getOrganization();
    if (!organization) {
      return [];
    }

    const supabase = await createServerSupabaseClient();

    // Get history logs with user profile join
    const { data: logs, error: logsError } = await (supabase as any)
      .from("history_logs")
      .select(
        "id, action, entity, entity_id, data, created_at, profiles:user_id(full_name)"
      )
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(limit)
      .throwOnError(); // Throw error if table doesn't exist

    if (logsError) {
      const errorDetails = {
        code: (logsError as any).code,
        message: (logsError as any).message,
        details: (logsError as any).details,
        hint: (logsError as any).hint,
      };
      console.error(
        "[Get History By Entity Error]",
        JSON.stringify(errorDetails, null, 2)
      );
      if (
        errorDetails.code === "42P01" ||
        errorDetails.message?.includes("does not exist")
      ) {
        console.warn(
          "[Get History By Entity] Table does not exist - run migration"
        );
      }
      return [];
    }

    // Build result - fetch user profiles separately
    const userIds = [
      ...new Set(logs.map((log: any) => log.user_id).filter(Boolean)),
    ];
    const profiles: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profileData } = await (supabase.from("profiles") as any)
        .select("id, full_name")
        .in("id", userIds);

      if (profileData) {
        profileData.forEach((p: any) => {
          profiles[p.id] = p;
        });
      }
    }

    const result: HistoryLog[] = logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entity_id: log.entity_id,
      data: log.data,
      created_at: log.created_at,
      profiles: log.user_id ? profiles[log.user_id] || null : null,
    }));

    return result;
  } catch (err) {
    console.error(
      "[Get History Logs Exception]",
      err instanceof Error ? err.message : String(err)
    );
    return [];
  }
}

/**
 * Get history logs for a specific entity
 * For courses, also includes course_student logs (add/remove operations)
 */
export async function getEntityHistory(
  entity: string,
  entityId: string,
  limit = 20
): Promise<HistoryLog[]> {
  try {
    console.log("[Get Entity History] Starting with:", {
      entity,
      entityId,
      limit,
    });
    const organization = await getOrganization();
    console.log("[Get Entity History] Organization:", organization?.id);
    if (!organization) {
      console.warn("[Get Entity History] No organization found");
      return [];
    }

    const supabase = await createServerSupabaseClient();

    // For courses, include course_student logs (add/remove operations)
    // For students, we need to handle two cases:
    //   1. Direct student logs (entity='student', entity_id=studentId)
    //   2. Student package logs (entity='student_package', but entity_id is packageId - need to filter by data.studentId)
    // Build query filters - we'll fetch profiles separately
    let query = supabase
      .from("history_logs")
      .select("id, action, entity, entity_id, data, created_at, user_id")
      .eq("organization_id", organization.id);

    // Add entity filter based on type
    if (entity === "course") {
      // For courses, show both direct course changes AND course_student changes
      query = query
        .in("entity", ["course", "course_student"])
        .eq("entity_id", entityId);
    } else if (entity === "student") {
      // For students, fetch both student and student_package logs
      // We can't filter by entity_id for student_package, so we'll filter in application layer
      query = query.in("entity", ["student", "student_package"]);
    } else {
      // For other entities, only show exact type matches
      query = query.eq("entity", entity).eq("entity_id", entityId);
    }

    console.log("[Get Entity History] Fetching history for:", {
      entity,
      entityId,
      organization: organization.id,
    });
    const { data: allLogs, error: logsError } = await query
      .order("created_at", { ascending: false })
      .limit(limit * 2); // Fetch more since we'll filter some out for student queries

    console.log(
      "[Get Entity History] Response received, logsError present:",
      !!logsError,
      "logsCount:",
      allLogs?.length
    );

    if (logsError) {
      const errorDetails = {
        code: (logsError as any).code,
        message: (logsError as any).message,
        details: (logsError as any).details,
        hint: (logsError as any).hint,
      };
      console.error(
        "[Get Entity History Error] Complete error object:",
        JSON.stringify(errorDetails, null, 2)
      );
      return [];
    }

    if (!allLogs || allLogs.length === 0) {
      return [];
    }

    // For student queries, filter out student_package logs where studentId doesn't match
    let logs = allLogs;
    if (entity === "student") {
      logs = allLogs
        .filter((log: any) => {
          if (log.entity === "student") {
            // Direct student logs - check entity_id matches student
            return log.entity_id === entityId;
          } else if (log.entity === "student_package") {
            // Student package logs - check if this package belongs to the student
            // The data might be in .before.studentId, .after.studentId, or .studentId
            const data =
              typeof log.data === "string" ? JSON.parse(log.data) : log.data;
            const logStudentId =
              data?.studentId ||
              data?.after?.studentId ||
              data?.before?.studentId;
            return logStudentId === entityId;
          }
          return false;
        })
        .slice(0, limit); // Limit after filtering
    }

    // Second step: Fetch user profiles for all unique user_ids
    const userIds = [
      ...new Set(logs.map((log: any) => log.user_id).filter(Boolean)),
    ];
    const profiles: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profileData } = await (supabase.from("profiles") as any)
        .select("id, full_name")
        .in("id", userIds);

      if (profileData) {
        profileData.forEach((p: any) => {
          profiles[p.id] = p;
        });
      }
    }

    // Build result with profiles merged in
    const result: HistoryLog[] = logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entity_id: log.entity_id,
      data: log.data,
      created_at: log.created_at,
      profiles: log.user_id ? profiles[log.user_id] || null : null,
    }));

    return result;
  } catch (err) {
    console.error(
      "[Get Entity History Exception]",
      err instanceof Error ? err.message : String(err)
    );
    return [];
  }
}

/**
 * Get history logs filtered by entity type
 */
export async function getHistoryByEntity(
  entity: string,
  limit = 20
): Promise<HistoryLog[]> {
  try {
    const organization = await getOrganization();
    if (!organization) {
      return [];
    }

    const supabase = await createServerSupabaseClient();

    // Get history logs by entity type
    const { data: logs, error: logsError } = await supabase
      .from("history_logs")
      .select("id, action, entity, entity_id, data, created_at, user_id")
      .eq("organization_id", organization.id)
      .eq("entity", entity)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (logsError) {
      const errorDetails = {
        code: (logsError as any).code,
        message: (logsError as any).message,
        details: (logsError as any).details,
        hint: (logsError as any).hint,
      };
      console.error(
        "[Get History By Entity Error]",
        JSON.stringify(errorDetails, null, 2)
      );
      if (
        errorDetails.code === "42P01" ||
        errorDetails.message?.includes("does not exist")
      ) {
        console.warn(
          "[Get History By Entity] Table or column does not exist - run migration"
        );
      }
      return [];
    }

    if (!logs || logs.length === 0) {
      return [];
    }

    // Second step: Fetch user profiles for all unique user_ids
    const userIds = [
      ...new Set(logs.map((log: any) => log.user_id).filter(Boolean)),
    ];
    const profiles: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profileData } = await (supabase.from("profiles") as any)
        .select("id, full_name")
        .in("id", userIds);

      if (profileData) {
        profileData.forEach((p: any) => {
          profiles[p.id] = p;
        });
      }
    }

    // Build result with profiles merged in
    const result: HistoryLog[] = logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entity_id: log.entity_id,
      data: log.data,
      created_at: log.created_at,
      profiles: log.user_id ? profiles[log.user_id] || null : null,
    }));

    return result;
  } catch (err) {
    console.error(
      "[Get History By Entity Exception]",
      err instanceof Error ? err.message : String(err)
    );
    return [];
  }
}
