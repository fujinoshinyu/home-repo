import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon?: ReactNode;
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <div className="empty-state-title">{title}</div>}
      {description && <div className="empty-state-desc">{description}</div>}
      {children}
    </div>
  );
}
