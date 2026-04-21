'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
  drawerWidth: number;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsedState(savedState === 'true');
    }
  }, []);

  const setIsCollapsed = (collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  };

  const toggleMobile = () => {
    setMobileOpen(prev => !prev);
  };

  const drawerWidth = isCollapsed ? 64 : 280;

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen, toggleMobile, drawerWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
