"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatHistoryMessage,
  getHistoryActionIcon,
  getHistoryEntityColor,
} from "@/lib/utils/history";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

interface HistoryLog {
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

interface HistoryComponentProps {
  logs: HistoryLog[];
  title?: string;
  description?: string;
  maxItems?: number;
  showFullPage?: boolean;
  onRefresh?: () => Promise<void>;
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

  if (displayLogs.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3 md:pb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg sm:text-xl">
                {title || t("dashboard.recentActivity")}
              </CardTitle>
              {description && (
                <CardDescription className="text-xs sm:text-sm">
                  {description}
                </CardDescription>
              )}
            </div>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-shrink-0"
              >
                <RefreshCw
                  size={18}
                  className={isRefreshing ? "animate-spin" : ""}
                />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            {t("dashboard.noRecentActivity")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-border ${showFullPage ? "h-full" : ""}`}>
      <CardHeader className="pb-3 md:pb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl">
              {title || t("dashboard.recentActivity")}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs sm:text-sm">
                {description}
              </CardDescription>
            )}
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-shrink-0"
            >
              <RefreshCw
                size={18}
                className={isRefreshing ? "animate-spin" : ""}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {displayLogs.map((log, idx) => (
            <HistoryItem key={log.id || idx} log={log} />
          ))}
        </div>
        {maxItems && logs.length > maxItems && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              {logs.length - maxItems} more activities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryItem({ log }: { log: HistoryLog }) {
  const userName =
    log.profiles?.full_name ||
    (log.data?.user_name as string) ||
    "Unknown User";
  const actionIcon = getHistoryActionIcon(log.action as any);
  const entityColor = getHistoryEntityColor(log.entity as any);
  const message = formatHistoryMessage(
    log.action as any,
    log.entity as any,
    log.data,
    userName
  );

  return (
    <div className="flex gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
      <div className="flex-shrink-0 text-lg">{actionIcon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground break-words">
          {message}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge
            variant="secondary"
            className={`${entityColor} border text-xs font-normal capitalize`}
          >
            {log.entity}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
          </span>
        </div>
        {log.data?.summary && (
          <p className="text-xs text-muted-foreground mt-1 break-words">
            {log.data.summary}
          </p>
        )}
      </div>
    </div>
  );
}
