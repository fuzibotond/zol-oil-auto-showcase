import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  name: string;
  /** Omit `path` for the current (last) page. */
  path?: string;
}

/** Visible breadcrumb trail. Pair with breadcrumbJsonLd() for structured data. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {c.path && !last ? (
                <Link to={c.path} className="hover:text-foreground transition-colors">
                  {c.name}
                </Link>
              ) : (
                <span
                  className={last ? "text-foreground font-medium" : ""}
                  aria-current={last ? "page" : undefined}
                >
                  {c.name}
                </span>
              )}
              {!last && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
