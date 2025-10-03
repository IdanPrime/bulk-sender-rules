import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function TemplateLintTool() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [results, setResults] = useState<{
    score: number;
    warnings: string[];
    suggestions: string[];
  } | null>(null);

  const lintMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/template-lint", {
        subject,
        text: body,
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      setResults(data);
    },
  });

  const handleLint = () => {
    lintMutation.mutate();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Template Linter</h1>
        <p className="text-muted-foreground">
          Check your email templates for spam triggers and deliverability issues
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Subject Line</label>
            <Input
              placeholder="Enter email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              data-testid="input-subject"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Email Body</label>
            <Textarea
              placeholder="Enter email body content..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[300px]"
              data-testid="input-body"
            />
          </div>
          <Button
            onClick={handleLint}
            className="w-full"
            data-testid="button-lint"
            disabled={lintMutation.isPending || !subject}
          >
            {lintMutation.isPending ? "Analyzing..." : "Analyze Template"}
          </Button>
        </div>

        <div>
          {results ? (
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(results.score)}`}>
                  {results.score}
                </div>
                <p className="text-sm text-muted-foreground">Deliverability Score</p>
              </div>

              {results.warnings.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <h3 className="font-semibold">Warnings</h3>
                  </div>
                  <ul className="space-y-2">
                    {results.warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-muted-foreground pl-7">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.suggestions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Suggestions</h3>
                  </div>
                  <ul className="space-y-2">
                    {results.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-muted-foreground pl-7">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.warnings.length === 0 && results.suggestions.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No issues found! Your template looks good.
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-12 flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p>Enter your template details and click Analyze</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
