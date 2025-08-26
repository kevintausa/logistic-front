
import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card border-t border-border py-8 text-center"
    >
      <div className="container mx-auto px-4">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} ERP- Proflux . Todos los derechos reservados.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Desarrollado por By DLTausa
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;
  