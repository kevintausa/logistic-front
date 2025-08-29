import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Menu, X, LayoutDashboard, Building2, Users, User2, Briefcase, Clock, BarChart3, Shirt, PackageSearch, Settings, UserCog, LogOut, Cog, Zap, Book, FileText, Layers3, Navigation, Anchor, Plane, ClipboardList } from 'lucide-react';
import { useAuth, MODULES } from '@/contexts/AuthContext';
import logo from '@/images/LOGO-DLT.png';
import ThemeToggle from '@/components/ui/ThemeToggle';
import UpdateNotifier from '@/components/UpdateNotifier';
import { fetchLatestVersion, getLocalVersion } from '@/services/version.service';

const Navbar = () => {
  const { user, logout, hasPermission } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [appVersion, setAppVersion] = useState(null);
  const [versionData, setVersionData] = useState(null);
  const [openVersionModal, setOpenVersionModal] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const activeLinkClass = "bg-primary/20 text-primary";
  const inactiveLinkClass = "hover:bg-primary/10 hover:text-primary/80";

  useEffect(() => {
    let mounted = true;
    (async () => {
      const v = await fetchLatestVersion();
      if (!mounted) return;
      setAppVersion(v?.version || getLocalVersion() || null);
      setVersionData(v);
    })();
    return () => { mounted = false; };
  }, []);

  // Definir los ítems de navegación dinámicamente basados en los permisos
  const navItems = [
    {
      name: 'Inicio',
      path: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      module: MODULES.DASHBOARD
    },
    {
      name: 'Documentación',
      path: '/documentacion',
      icon: <FileText className="h-5 w-5" />,
      module: MODULES.DOCUMENTATION
    },
    {
      name: 'Operaciones',
      path: '/operaciones',
      icon: <ClipboardList className="h-5 w-5" />,
      module: MODULES.OPERATIONS
    },

    {
      name: 'Parametrización',
      path: '/parametrizacion',
      icon: <Settings className="h-5 w-5" />,
      module: 'settings',
      subLinks: [
        {
          name: 'Usuarios',
          path: '/parametrizacion/usuarios',
          icon: UserCog,
          module: 'users'
        },
        {
          name: 'Tipos de Archivo',
          path: '/parametrizacion/tipos-archivo',
          icon: FileText,
          module: MODULES.DOCUMENT_TYPES
        },
        {
          name: 'Clientes',
          path: '/parametrizacion/clientes',
          icon: User2,
          module: 'clients'
        },
        {
          name: 'Operadores',
          path: '/parametrizacion/operadores',
          icon: Briefcase,
          module: MODULES.OPERATORS
        },
        {
          name: 'Tipos de Operación',
          path: '/parametrizacion/tipos-operacion',
          icon: Layers3,
          module: MODULES.OPERATION_TYPES,
        },
        {
          name: 'Vías',
          path: '/parametrizacion/vias',
          icon: Navigation,
          module: MODULES.VIAS,
        },
        {
          name: 'Puertos de Carga',
          path: '/parametrizacion/puertos-carga',
          icon: Anchor,
          module: MODULES.LOADING_PORTS,
        },
        {
          name: 'Incoterms',
          path: '/parametrizacion/incoterms',
          icon: FileText,
          module: MODULES.INCOTERMS,
        },
        {
          name: 'Aeropuertos',
          path: '/parametrizacion/aeropuertos',
          icon: Plane,
          module: MODULES.AIRPORTS,
        },
        {
          name: 'Conceptos de Oferta',
          path: '/parametrizacion/conceptos-oferta',
          icon: FileText,
          module: MODULES.OFFER_CONCEPTS,
        },
        {
          name: 'Proveedores',
          path: '/parametrizacion/proveedores',
          icon: Briefcase,
          module: MODULES.PROVIDERS
        },
      ].filter(item => hasPermission(item.module))
    },
  ].filter(item => {
    // Filtrar ítems principales
    if (item.subLinks) {
      // Mantener el ítem si tiene subLinks y al menos uno es visible
      return item.subLinks.length > 0;
    }
    // Mantener el ítem si no requiere módulo o el usuario tiene permiso
    return !item.module || hasPermission(item.module);
  });



  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="bg-card shadow-lg sticky top-0 z-50"
    >
      {/* Notificador de actualizaciones: verifica nuevas versiones y muestra toast */}
      <UpdateNotifier checkIntervalMs={60000} />
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-2 pt-4 ">
            <motion.div whileHover={{ rotate: [0, 5, -5, 0] }}>
              <img src={logo} alt="LOGO-PROFLUX-ERP" style={{ 
                height: '40px',
                width: 'auto',
                filter: 'invert(28%) sepia(90%) saturate(7470%) hue-rotate(200deg) brightness(95%) contrast(100%)', }} />
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) =>
              item.subLinks ? (
                <DropdownMenu key={item.name}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`flex items-center space-x-2 px-3 py-2 text-base font-medium transition-colors duration-300 rounded-md ${location.pathname.startsWith(item.path)
                        ? activeLinkClass
                        : inactiveLinkClass
                        }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {item.subLinks.map((sub) => (
                      <DropdownMenuItem key={sub.name} asChild>
                        <NavLink
                          to={sub.path}
                          className={({ isActive }) =>
                            `w-full flex items-center space-x-2 px-3 py-2 text-base font-medium transition-colors duration-300 rounded-md ${isActive ? activeLinkClass : 'hover:bg-primary/10'
                            }`
                          }
                        >
                          <sub.icon className="h-5 w-5" />
                          <span>{sub.name}</span>
                        </NavLink>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 text-base font-medium transition-colors duration-300 rounded-md ${isActive ? activeLinkClass : inactiveLinkClass
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              )
            )}
            {/* Version badge */}
            <button
              type="button"
              onClick={() => setOpenVersionModal(true)}
              className="ml-2 px-2 py-1 text-xs rounded bg-primary/10 text-primary select-none hover:bg-primary/20 transition"
              title="Ver cambios de la versión"
            >
              v{appVersion || '—'}
            </button>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="ml-2 rounded-full w-10 h-10 p-0">
                    <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="sr-only">Menú de usuario</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    <div className="text-foreground">{user.name} - {user.role}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                    <div className="text-xs text-primary">{user?.lavanderia?.nombre || ''}</div>
                  </div>

                  {/* Theme toggle (desktop) */}
                  <div className="ml-2">
                    <ThemeToggle variant="buttons" />
                  </div>
                  <DropdownMenuItem asChild>
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center text-red-600 hover:text-red-700"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-foreground hover:text-primary"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden absolute top-20 left-0 right-0 bg-card shadow-lg rounded-b-lg p-4 space-y-2 max-h-[calc(100vh-5rem)] overflow-y-auto"
        >
          {/* Theme toggle (mobile) */}
          <div className="flex justify-end pb-2">
            <ThemeToggle variant="select" />
          </div>
          {navItems.map((item) => (
            <React.Fragment key={item.name}>
              <NavLink
                to={item.subLinks ? '#' : item.path}
                onClick={() => !item.subLinks && setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-md text-base font-medium transition-colors duration-300 flex items-center space-x-3 ${isActive && !item.subLinks ? activeLinkClass : inactiveLinkClass
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
              {item.subLinks && (
                <div className="pl-4">
                  {item.subLinks.map((sub) => (
                    <NavLink
                      key={sub.name}
                      to={sub.path}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md text-base font-medium transition-colors duration-300 flex items-center space-x-3 ${isActive ? activeLinkClass : inactiveLinkClass
                        }`
                      }
                    >
                      <sub.icon className="h-5 w-5" />
                      <span>{sub.name}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}

          {user && (
            <div className="border-t border-border pt-4 mt-4">
              <div className="px-4 py-2 text-sm font-medium text-foreground">
                {user.name}
              </div>
              <div className="px-4 text-xs text-muted-foreground mb-3">
                {user.email}
              </div>

              {/* Theme toggle (desktop) */}
              <div className="ml-2">
                <ThemeToggle variant="buttons" />
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </motion.div>
      )}
      {/* Version Changelog Modal - top-level in Navbar */}
      <Dialog open={openVersionModal} onOpenChange={setOpenVersionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Versión {appVersion || (versionData?.version ?? '')}</DialogTitle>
            <DialogDescription>
              Novedades y cambios incluidos en esta versión.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {versionData?.changes?.length ? (
              <ul className="list-disc pl-5 space-y-1">
                {versionData.changes.map((c, idx) => (
                  <li key={idx} className="text-sm">{c}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hay cambios listados.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpenVersionModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.nav>
  );
};

export default Navbar;