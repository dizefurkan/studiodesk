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
  before?: Record<string, unknown>;
  after?: Record<string, unknown> & { studentName?: string; packageName?: string };
  changes?: Record<string, HistoryChange>;
  summary?: string;
  action_type?: string;
  packageName?: string;
  studentName?: string;
  user_name?: string;
  [key: string]: unknown;
}

/**
 * Format human-readable history message
 */
export function formatHistoryMessage(
  action: HistoryAction,
  entity: HistoryEntity,
  data?: HistoryLogData,
  userName?: string
): string {
  const user = userName || "Someone";
  const entityLabel = getEntityLabel(entity);
  const actionLower = (action || "").toLowerCase();

  if (data?.summary) {
    return data.summary;
  }

  // Handle special action types
  if (data?.action_type === "student_added_to_course") {
    return `${user} added a student to ${entityLabel}`;
  }
  if (data?.action_type === "student_removed_from_course") {
    return `${user} removed a student from ${entityLabel}`;
  }

  // Format based on action and entity
  switch (actionLower) {
    case "create":
      // Special case for course_student creations
      if (entity === "course_student") {
        const addedStudentName = data?.after?.studentName || "a student";
        return `${user} added ${addedStudentName} to course`;
      }
      // Special case for student_package creations - show package name
      if (entity === "student_package") {
        const packageName = data?.after?.packageName || "a package";
        return `${user} created a new package purchase: ${packageName}`;
      }
      return `${user} created a new ${entityLabel}`;
    case "update":
      // Show changed fields if available
      if (data?.changes && typeof data.changes === "object") {
        // Special case for student_package updates - show package name
        if (entity === "student_package" && data?.packageName) {
          const changedFields = Object.entries(data.changes)
            .map(([field, value]) => {
              // Convert camelCase/snake_case to readable format
              const readableField = field
                .replace(/([A-Z])/g, "_$1") // camelCase to snake_case
                .split("_")
                .filter(Boolean)
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

              // Format the change
              if (
                typeof value === "object" &&
                value.before !== undefined &&
                value.after !== undefined
              ) {
                return `${readableField} to "${value.after}"`;
              }
              return readableField;
            })
            .join(", ");

          return `${user} updated ${data.packageName} ${changedFields}`;
        }

        const changedFields = Object.entries(data.changes)
          .map(([field, value]) => {
            // Convert camelCase/snake_case to readable format
            const readableField = field
              .replace(/([A-Z])/g, "_$1") // camelCase to snake_case
              .split("_")
              .filter(Boolean)
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            // Format the change
            if (
              typeof value === "object" &&
              value.before !== undefined &&
              value.after !== undefined
            ) {
              return `${readableField} to "${value.after}"`;
            }
            return readableField;
          })
          .join(", ");

        return `${user} updated ${entityLabel} ${changedFields}`;
      }
      return `${user} updated ${entityLabel}`;
    case "delete":
      // Special case for course_student deletions
      if (entity === "course_student") {
        const removedStudentName = data?.before?.studentName || "a student";
        return `${user} removed ${removedStudentName} from course`;
      }
      return `${user} deleted ${entityLabel}`;
    case "add":
      return `${user} added to ${entityLabel}`;
    case "remove":
      return `${user} removed from ${entityLabel}`;
    case "view":
      return `${user} viewed ${entityLabel}`;
    case "import":
      return `${user} imported ${entityLabel}s`;
    case "export":
      return `${user} exported ${entityLabel}s`;
    default:
      return `${user} performed action on ${entityLabel}`;
  }
}

/**
 * Get entity display label
 */
function getEntityLabel(entity: HistoryEntity): string {
  const labels: Record<string, string> = {
    student: "student",
    instructor: "instructor",
    course: "course",
    course_student: "course enrollment",
    student_package: "package purchase",
    branch: "branch",
    package: "package",
    dance_type: "dance type",
    attendance: "attendance",
    cash_register: "cash register",
    organization: "organization",
    user: "user",
    studio: "studio",
    instructor_rate: "instructor rate",
    organization_settings: "organization settings",
    invitation: "team invitation",
  };
  return labels[entity] || entity;
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
