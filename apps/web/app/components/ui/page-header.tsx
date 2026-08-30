import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="page-header">
      <div className="page-title">{title}</div>
      {subtitle && <div className="page-subtitle">{subtitle}</div>}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="page-container">{children}</div>;
}
