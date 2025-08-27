
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap, Shirt } from 'lucide-react';

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="card-gradient-bg p-6 rounded-lg shadow-xl flex flex-col items-center text-center"
  >
    <div className="p-3 bg-primary/20 rounded-full mb-4 text-primary">{icon}</div>
    <h3 className="text-xl font-semibold mb-2 text-primary-foreground">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </motion.div>
);

const HomePage = () => {
  return (
    <div className="space-y-16 py-8">
      <motion.section
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="text-center hero-gradient-bg py-20 px-6 rounded-xl shadow-2xl"
      >
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl md:text-6xl font-extrabold mb-6"
        >
          <span className="gradient-text">ERP- Logistic International</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl md:text-2xl text-primary-foreground/80 mb-10 max-w-3xl mx-auto"
        >
          Optimiza la gestión de tu lavandería industrial y el control horario de tus empleados de forma eficiente y moderna.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-transform duration-300">
            <Link to="/dashboard">
              Empezar Ahora <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </motion.section>

      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Características Principales</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Gestión Integral"
            description="Controla lugares de trabajo, empleados, clientes y procesos de lavado en un solo lugar."
            delay={0.2}
          />
          <FeatureCard
            icon={<CheckCircle className="h-8 w-8" />}
            title="Control Horario Preciso"
            description="Registro de jornada laboral fácil para empleados, con seguimiento detallado de horas."
            delay={0.4}
          />
          <FeatureCard
            icon={<Shirt className="h-8 w-8" />}
            title="Seguimiento de Lavandería"
            description="Registra prendas, peso y genera informes por cliente para una facturación transparente."
            delay={0.6}
          />
        </div>
      </section>

      <section className="text-center py-12">
         <img
            alt="Equipo de lavandería trabajando eficientemente"
            className="w-full max-w-3xl mx-auto rounded-lg shadow-xl mb-8"
           src="https://images.unsplash.com/photo-1638949493140-edb10b7be2f3" />
        <h2 className="text-3xl font-bold mb-6 gradient-text">Transforma tu Negocio Hoy</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Deja atrás los métodos obsoletos y da el salto a una gestión digital, ágil y poderosa con ERP- Logistic International.
        </p>
        <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary font-semibold shadow-md transform hover:scale-105 transition-transform duration-300">
          <Link to="/contacto">
            Solicitar una Demostración
          </Link>
        </Button>
      </section>
    </div>
  );
};

export default HomePage;
  