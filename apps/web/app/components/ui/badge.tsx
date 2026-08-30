import type { ReactNode } from 'react';

type Variant = 'default' | 'primary';

export function Badge({ children, variant = 'default', style }: { children: ReactNode; variant?: Variant; style?: React.CSSProperties }) {
  return <span className={`badge badge-${variant}`} style={style}>{children}</span>;
}
