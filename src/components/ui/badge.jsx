import React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
  success: "bg-green-100 text-green-800 hover:bg-green-200",
  warning: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  info: "bg-blue-100 text-blue-800 hover:bg-blue-200",
};

const Badge = ({ 
  children, 
  className, 
  variant = "default", 
  ...props 
}) => {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  const variantClass = badgeVariants[variant] || badgeVariants.default;
  
  return (
    <div className={cn(baseClasses, variantClass, className)} {...props}>
      {children}
    </div>
  );
};

export { Badge, badgeVariants };