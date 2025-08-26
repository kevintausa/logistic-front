import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ProtectedNavLink = ({ to, module, children, className, ...props }) => {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const isActive = location.pathname === to;

  if (module && !hasPermission(module)) {
    return null;
  }

  return (
    <Link
      to={to}
      className={cn(
        'text-sm font-medium transition-colors hover:text-primary',
        isActive ? 'text-primary' : 'text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
};

export default ProtectedNavLink;
