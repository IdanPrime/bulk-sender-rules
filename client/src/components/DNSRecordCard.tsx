import { Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import { useState } from "react";

interface DNSRecordCardProps {
  type: string;
  status: "PASS" | "WARN" | "FAIL";
  record?: string;
  issues?: string[];
  suggestions?: string[];
}

export default function DNSRecordCard({
  type,
  status,
  record,
  issues = [],
  suggestions = [],
}: DNSRecordCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (record) {
      navigator.clipboard.writeText(record);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="p-6" data-testid={`card-dns-${type.toLowerCase()}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">{type}</h3>
          <StatusBadge status={status} />
        </div>
        {record && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            data-testid={`button-copy-${type.toLowerCase()}`}
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {record && (
        <div className="mb-4 p-3 bg-muted rounded-md">
          <code className="text-sm font-mono break-all" data-testid={`text-record-${type.toLowerCase()}`}>
            {record}
          </code>
        </div>
      )}

      {issues.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-destructive mb-2">Issues:</h4>
          <ul className="space-y-1">
            {issues.map((issue, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                • {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-primary mb-2">Suggestions:</h4>
          <ul className="space-y-1">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
