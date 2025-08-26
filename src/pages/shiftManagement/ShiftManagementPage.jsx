import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ShiftCalendar from './components/ShiftCalendar';

const ShiftManagementPage = () => {
  const { idLavanderia } = useParams();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      className="p-4 md:p-6 lg:p-8"
    >
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link to={`/centros-lavado/${idLavanderia}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
          </Link>
        </Button>
      </div>
      <ShiftCalendar />
    </motion.div>
  );
};

export default ShiftManagementPage;
