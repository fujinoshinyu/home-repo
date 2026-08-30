import type { ReactNode } from 'react';

export function Card({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`card${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div className="card-header" style={style}>{children}</div>;
}

export function CardBody({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div className="card-body" style={style}>{children}</div>;
}
