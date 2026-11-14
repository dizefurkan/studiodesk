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
        return t("changedTo", { field: label, value: String(value.after) })
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

/**
 * Get icon for history action
 */
export function getHistoryActionIcon(action: HistoryAction): string {
  const icons: Record<HistoryAction, string> = {
    CREATE: "➕",
    UPDATE: "✏️",
    DELETE: "🗑️",
    add: "➕",
    remove: "➖",
    view: "👁️",
    import: "⬇️",
    export: "⬆️",
  };
  // Handle both uppercase and lowercase
  const found = icons[action];
  if (found) return found;

  // Fallback: try lowercase
  const actionLower = ((action || "") as string).toLowerCase() as HistoryAction;
  return icons[actionLower] || "📝";
}

/**
 * Get color for history entity
 */
export function getHistoryEntityColor(entity: HistoryEntity): string {
  const colors: Record<string, string> = {
    student: "bg-blue-100 text-blue-800 border-blue-300",
    instructor: "bg-purple-100 text-purple-800 border-purple-300",
    course: "bg-green-100 text-green-800 border-green-300",
    course_student: "bg-teal-100 text-teal-800 border-teal-300",
    student_package: "bg-violet-100 text-violet-800 border-violet-300",
    branch: "bg-yellow-100 text-yellow-800 border-yellow-300",
    package: "bg-pink-100 text-pink-800 border-pink-300",
    dance_type: "bg-orange-100 text-orange-800 border-orange-300",
    attendance: "bg-primary/10 text-primary border-primary/30",
    cash_register: "bg-emerald-100 text-emerald-800 border-emerald-300",
    organization: "bg-red-100 text-red-800 border-red-300",
    user: "bg-cyan-100 text-cyan-800 border-cyan-300",
    studio: "bg-amber-100 text-amber-800 border-amber-300",
    instructor_rate: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
    organization_settings: "bg-muted text-muted-foreground border-border",
    invitation: "bg-sky-100 text-sky-800 border-sky-300",
  };
  return colors[entity] || "bg-muted text-muted-foreground border-border";
}
