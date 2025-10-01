import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StatusType = "PASS" | "WARN" | "FAIL";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = {
    PASS: {
      icon: CheckCircle2,
      className: "bg-success text-success-foreground",
      label: "PASS",
    },
    WARN: {
      icon: AlertTriangle,
      className: "bg-warning text-warning-foreground",
      label: "WARN",
    },
    FAIL: {
      icon: XCircle,
      className: "bg-destructive text-destructive-foreground",
      label: "FAIL",
    },
  };

  const { icon: Icon, className: badgeClassName, label } = config[status];

  return (
    <Badge
      className={`${badgeClassName} ${className} flex items-center gap-1 rounded-full px-3 py-1`}
      data-testid={`badge-status-${status.toLowerCase()}`}
    >
      <Icon className="h-3 w-3" />
      <span className="text-xs font-medium">{label}</span>
    </Badge>
  );
}
