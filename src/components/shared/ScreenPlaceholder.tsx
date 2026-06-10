import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  code: string; // mã màn (M1–M6)
  title: string;
  description: string;
  willBuild: string[]; // các phần sẽ dựng ở mốc sau
};

// Placeholder cho mốc M0 — khung bấm qua được, nội dung dựng ở mốc tương ứng.
export function ScreenPlaceholder({ code, title, description, willBuild }: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {code}
            </Badge>
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Sẽ dựng ở mốc này:</p>
          <ul className="space-y-1.5 text-sm">
            {willBuild.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                {b}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
