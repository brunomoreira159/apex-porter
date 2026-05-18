'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { onAuthChange, fetchUserProfile, ensureUserProfile } from '@/lib/auth';
import LoginPage from '@/components/login-page';
import DashboardPage from '@/components/dashboard-page';
import FluxoPage from '@/components/fluxo-page';
import RelatoriosPage from '@/components/relatorios-page';
import CadastrosPage from '@/components/cadastros-page';
import RamaisPage from '@/components/ramais-page';
import AvisosPage from '@/components/avisos-page';
import ListaNegraPage from '@/components/lista-negra-page';
import AchadosPerdidosPage from '@/components/achados-perdidos-page';
import ConfiguracoesPage from '@/components/configuracoes-page';
import CorrespondenciasPage from '@/components/correspondencias-page';
import VeiculosPage from '@/components/veiculos-page';
import PreAutorizacaoPage from '@/components/pre-autorizacao-page';
import OcorrenciasPage from '@/components/ocorrencias-page';
import RondaPage from '@/components/ronda-page';
import ChecklistTurnoPage from '@/components/checklist-turno-page';
import InspecaoDiariaPage from '@/components/inspecao-diaria-page';
import ProtocolosEmergenciaPage from '@/components/protocolos-emergencia-page';
import DepartamentosPage from '@/components/departamentos-page';
import EmpresasPage from '@/components/empresas-page';
import AppHeader from '@/components/app-header';
import BottomNav from '@/components/bottom-nav';

function PageRenderer() {
  const { currentPage } = useAppStore();

  const pages: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage />,
    fluxo: <FluxoPage />,
    relatorios: <RelatoriosPage />,
    cadastros: <CadastrosPage />,
    departamentos: <DepartamentosPage />,
    empresas: <EmpresasPage />,
    ramais: <RamaisPage />,
    avisos: <AvisosPage />,
    'lista-negra': <ListaNegraPage />,
    'achados-perdidos': <AchadosPerdidosPage />,
    configuracoes: <ConfiguracoesPage />,
    correspondencias: <CorrespondenciasPage />,
    veiculos: <VeiculosPage />,
    'pre-autorizacao': <PreAutorizacaoPage />,
    ocorrencias: <OcorrenciasPage />,
    ronda: <RondaPage />,
    'checklist-turno': <ChecklistTurnoPage />,
    'inspecao-diaria': <InspecaoDiariaPage />,
    'protocolos-emergencia': <ProtocolosEmergenciaPage />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        {pages[currentPage] || <DashboardPage />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Home() {
  const { isAuthenticated, currentPage, authInitialized, setAuthFromFirebase } = useAppStore();

  // ── Firebase Auth State Observer ──
  // Restores session on page refresh (persists login via Firebase Auth)
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in — fetch profile from Firestore
        // fetchUserProfile returns null if document doesn't exist or on error
        const profile = await fetchUserProfile(firebaseUser.uid);

        if (!profile) {
          // Profile missing in Firestore — try to create it
          // This handles the case where registration created Auth user but Firestore write failed
          const nome = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário';
          const email = firebaseUser.email || '';
          await ensureUserProfile(firebaseUser.uid, { nome, email, senha: '******' });
        }

        setAuthFromFirebase(firebaseUser, profile);
      } else {
        // User is signed out — the store already handles this via logout()
        // Only reset authInitialized if it hasn't been set yet (first load with no session)
        const state = useAppStore.getState();
        if (!state.authInitialized) {
          useAppStore.setState({ authInitialized: true, isAuthenticated: false, user: null });
        }
      }
    });

    return () => unsubscribe();
  }, [setAuthFromFirebase]);

  // Show loading while Firebase Auth initializes (first load)
  if (!authInitialized) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #0a2e1f 0%, #061a12 40%, #030d09 100%)',
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"
          />
          <p className="text-emerald-300/40 text-xs tracking-widest uppercase">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || currentPage === 'login') {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 overflow-y-auto">
        <PageRenderer />
      </main>
      <BottomNav />
    </div>
  );
}
