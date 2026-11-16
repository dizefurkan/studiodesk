/**
 * History Utility Functions (Client & Server Safe)
 * Pure utility functions for formatting and styling history logs
 */

export type HistoryAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "add"
  | "remove"
  | "view"
  | "import"
  | "export";

export type HistoryEntity =
  | "student"
  | "instructor"
  | "course"
  | "course_student"
  | "student_package"
  | "branch"
  | "package"
  | "dance_type"
  | "attendance"
  | "cash_register"
  | "instructor_rate"
  | "instructor_earning"
  | "instructor_adjustment"
  | "instructor_payout"
  | "instructor_pay_period"
  | "studio"
  | "invitation"
  | "organization"
  | "organization_settings"
  | "user";

export type HistoryChange = { before: unknown; after: unknown };

/** Shape of history_logs.data written by logOperation() */
export interface HistoryLogData {
  before?: Record<string, unknown> & { studentName?: string };
  after?: Record<string, unknown> & { studentName?: string; packageName?: string };
  changes?: Record<string, HistoryChange>;
  summary?: string;
  action_type?: string;
  packageName?: string;
  studentName?: string;
  user_name?: string;
  [key: string]: unknown;
}

/** next-intl translator for the `historyMessages` namespace */
export type HistoryTranslator = {
  (key: string, values?: Record<string, string | number>): string
  has(key: string): boolean
}

function fieldLabel(t: HistoryTranslator, field: string): string {
  const key = `fields.${field.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())}`
  if (t.has(key)) return t(key)
  // Fallback: camelCase / snake_case -> "Title Case"
  return field
    .replace(/([A-Z])/g, "_$1")
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function describeChanges(t: HistoryTranslator, changes: Record<string, HistoryChange>): string {
  return Object.entries(changes)
    .map(([field, value]) => {
      const label = fieldLabel(t, field)
      if (value && typeof value === "object" && value.before !== undefined && value.after !== undefined) {
        // Values with their own wording (e.g. isActive true/false → "Active"/"Passive")
        const valueKey = `values.${field}.${String(value.after)}`
        return t("changedTo", { field: label, value: t.has(valueKey) ? t(valueKey) : String(value.after) })
      }
      return label
    })
    .join(", ")
}

/**
 * Human-readable history message in the current locale.
 */
export function formatHistoryMessage(
  t: HistoryTranslator,
  action: HistoryAction,
  entity: HistoryEntity,
  data?: HistoryLogData,
  userName?: string
): string {
  const user = userName || t("someone")
  const entityKey = `entities.${entity}`
  const entityLabel = t.has(entityKey) ? t(entityKey) : entity

  if (data?.summary) {
    return data.summary
  }

  // Special action types
  if (data?.action_type === "student_added_to_course") {
    return t("studentAddedTo", { user, entity: entityLabel })
  }
  if (data?.action_type === "student_removed_from_course") {
    return t("studentRemovedFrom", { user, entity: entityLabel })
  }

  switch ((action || "").toLowerCase()) {
    case "create":
      if (entity === "course_student") {
        return t("addedToCourse", { user, student: data?.after?.studentName || t("aStudent") })
      }
      if (entity === "student_package") {
        return t("packagePurchased", { user, package: data?.after?.packageName || t("aPackage") })
      }
      return t("created", { user, entity: entityLabel })
    case "update":
      if (data?.changes && typeof data.changes === "object") {
        const changes = describeChanges(t, data.changes)
        // An update with nothing readable to list reads as a plain "updated"
        if (!changes) return t("updated", { user, entity: entityLabel })
        if (entity === "student_package" && data?.packageName) {
          return t("updatedWithChanges", { user, entity: data.packageName, changes })
        }
        return t("updatedWithChanges", { user, entity: entityLabel, changes })
      }
      return t("updated", { user, entity: entityLabel })
    case "delete":
      if (entity === "course_student") {
        return t("removedFromCourse", { user, student: String(data?.before?.studentName || t("aStudent")) })
      }
      return t("deleted", { user, entity: entityLabel })
    case "add":
      return t("addedTo", { user, entity: entityLabel })
    case "remove":
      return t("removedFrom", { user, entity: entityLabel })
    case "view":
      return t("viewed", { user, entity: entityLabel })
    case "import":
      return t("imported", { user, entity: entityLabel })
    case "export":
      return t("exported", { user, entity: entityLabel })
    default:
      return t("other", { user, entity: entityLabel })
  }
}

