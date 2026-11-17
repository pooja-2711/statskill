import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, RotateCw } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="sk-state">
      <span className="sk-state-icon">
        <Icon size={22} />
      </span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="sk-state error" role="alert">
      <span className="sk-state-icon">
        <AlertTriangle size={22} />
      </span>
      <strong>Something went wrong</strong>
      <p>{message}</p>
      {onRetry && (
        <button className="sk-retry" onClick={onRetry}>
          <RotateCw size={15} /> Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({
  height = 16,
  width = "100%",
  radius = 10,
}: {
  height?: number;
  width?: number | string;
  radius?: number;
}) {
  return (
    <span
      className="sk-skel"
      style={{ height, width, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}
