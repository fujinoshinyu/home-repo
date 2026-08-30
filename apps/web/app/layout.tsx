import type { Metadata } from 'next';
import { Header } from './components/header';
import { Providers } from './components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'RAG System',
  description: '自作 RAG システムの管理画面',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
