"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  BookOpen,
  Building2,
  ClipboardCheck,
  DoorOpen,
  FileClock,
  MapPin,
  Music2,
  Package,
  Percent,
  RefreshCw,
  Settings,
  ShoppingBag,
  User,
  UserCheck,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatHistoryMessage } from "@/lib/utils/history";
import type { HistoryLog } from "@/lib/actions/history.actions";

interface HistoryComponentProps {
  logs: HistoryLog[];
  title?: string;
  description?: string;
  maxItems?: number;
  showFullPage?: boolean;
  onRefresh?: () => Promise<void>;
}

const ENTITY_ICONS: Record<string, LucideIcon> = {
  student: User,
  instructor: UserCheck,
  course: BookOpen,
  course_student: UserPlus,
  student_package: ShoppingBag,
  branch: MapPin,
  package: Package,
  dance_type: Music2,
  attendance: ClipboardCheck,
  cash_register: Wallet,
  organization: Building2,
  user: User,
  studio: DoorOpen,
  instructor_rate: Percent,
  organization_settings: Settings,
  invitation: UserPlus,
};

/** Icon tile color by what happened: added, changed or removed. */
function actionTone(action: string) {
  const a = (action || "").toUpperCase();
  if (a === "CREATE" || a === "ADD" || a === "IMPORT") return "bg-highlight text-highlight-foreground";
  if (a === "DELETE" || a === "REMOVE") return "bg-danger/10 text-danger";
  return "bg-primary/10 text-primary";
}

/** "3 min ago", "yesterday", or a date for anything older than a week. */
function useRelativeTime() {
  const locale = useLocale();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const df = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (iso: string) => {
    const diff = (new Date(iso).getTime() - Date.now()) / 1000;
    const abs = Math.abs(diff);
    if (abs < 60) return rtf.format(Math.round(diff), "second");
    if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
    if (abs < 7 * 86400) return rtf.format(Math.round(diff / 86400), "day");
    return df.format(new Date(iso));
  };
}

export function HistoryComponent({
  logs,
  title,
  description,
  maxItems = 10,
  showFullPage = false,
  onRefresh,
}: HistoryComponentProps) {
  const t = useTranslations();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const displayLogs = maxItems ? logs.slice(0, maxItems) : logs;

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className={cn("gap-0", showFullPage && "h-full")}>
      <CardHeader className="pb-4">
        <CardTitle>{title || t("dashboard.recentActivity")}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {onRefresh && (
          <CardAction>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label={t("common.refresh")}
            >
              <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {displayLogs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileClock className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">{t("dashboard.noRecentActivity")}</p>
          </div>
        ) : (
          <ol className={cn("relative", !showFullPage && "max-h-96 overflow-y-auto pr-1")}>
            {displayLogs.map((log, idx) => (
              <HistoryItem key={log.id || idx} log={log} last={idx === displayLogs.length - 1} />
            ))}
          </ol>
        )}
        {maxItems > 0 && logs.length > maxItems && (
          <p className="mt-3 border-t border-border pt-3 text-center text-xs text-muted-foreground">
            {t("historyPage.moreActivities", { count: logs.length - maxItems })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryItem({ log, last }: { log: HistoryLog; last: boolean }) {
  const t = useTranslations();
  const tMsg = useTranslations("historyMessages");
  const relative = useRelativeTime();
  const userName = log.profiles?.full_name || (log.data?.user_name as string) || t("history.unknownUser");
  const message = formatHistoryMessage(tMsg, log.action, log.entity, log.data, userName);
  const Icon = ENTITY_ICONS[log.entity] ?? FileClock;
  const entityLabel = tMsg.has(`entities.${log.entity}`) ? tMsg(`entities.${log.entity}`) : log.entity;

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {/* connector */}
      {!last && <span aria-hidden className="absolute left-[17px] top-10 bottom-1 w-px bg-border" />}
      <span className={cn("relative flex size-9 shrink-0 items-center justify-center rounded-xl", actionTone(log.action))}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="break-words text-sm leading-snug text-foreground">{message}</p>
        {log.data?.summary && (
          <p className="mt-1 break-words text-xs text-muted-foreground">{log.data.summary}</p>
        )}
        <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          <span className="inline-block first-letter:uppercase">{entityLabel}</span>
          <time dateTime={log.created_at} suppressHydrationWarning>
            {relative(log.created_at)}
          </time>
        </p>
      </div>
    </li>
  );
}
