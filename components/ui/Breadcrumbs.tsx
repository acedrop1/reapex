import Link from 'next/link';
import { Box, Breadcrumbs as MuiBreadcrumbs, Typography } from '@mui/material';
import { Home, NavigateNext } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <MuiBreadcrumbs
      separator={<NavigateNext fontSize="small" sx={{ color: '#666666' }} />}
      sx={{ mt: 3, mb: 3 }}
      aria-label="breadcrumb"
    >
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          color: '#ffffff',
        }}
      >
        <Home sx={{ mr: 0.5, fontSize: 20, color: '#d4af37' }} />
        <Typography sx={{ color: '#ffffff', '&:hover': { textDecoration: 'underline', color: '#d4af37' } }}>
          Home
        </Typography>
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.href) {
          return (
            <Typography key={index} fontWeight={600} sx={{ color: '#999999' }}>
              {item.label}
            </Typography>
          );
        }

        return (
          <Link
            key={index}
            href={item.href}
            style={{ textDecoration: 'none', color: '#ffffff' }}
          >
            <Typography sx={{ color: '#ffffff', '&:hover': { textDecoration: 'underline', color: '#d4af37' } }}>
              {item.label}
            </Typography>
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}
