import type { ReactNode } from 'react';

type Variant = 'info' | 'success' | 'warning';

export function Alert({ children, variant = 'info', style }: { children: ReactNode; variant?: Variant; style?: React.CSSProperties }) {
  return <div className={`alert alert-${variant}`} style={style}>{children}</div>;
}
