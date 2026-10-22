import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useWeather } from './hooks/useWeather'
import { ToastProvider, useToast } from './context/ToastContext'
import Navbar from './components/Navbar'
import MobileDock from './components/MobileDock'
import MobileHeader from './components/MobileHeader'
import ExecutiveTopBar from './components/ExecutiveTopBar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import RiskMap from './pages/RiskMap'
import Climate from './pages/Climate'
import Preparedness from './pages/Preparedness'
import Resources from './pages/Resources'
import YelahankaHub from './pages/YelahankaHub'
import Auth from './pages/Auth'
import FloatingReliefWidget from './components/FloatingReliefWidget'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const weather = useWeather()
  const navigate = useNavigate()
  const toast = useToast()

  if (loading) return <LoadingScreen />

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  const handleSignOut = async () => {
    await signOut()
    toast.info('Signed Out', 'You have been safely signed out.')
    navigate('/auth', { replace: true })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <MobileHeader user={user} onSignOut={handleSignOut} />
      <ExecutiveTopBar user={user} onSignOut={handleSignOut} weather={weather} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Navbar user={user} onSignOut={handleSignOut} weather={weather} />
        <MobileDock />
        <FloatingReliefWidget />
        <main className="app-main-content">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-container"
    >
      {children}
    </motion.div>
  )
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '3px solid rgba(16, 185, 129, 0.15)',
          borderTopColor: 'var(--pri)',
        }}
      />
    </div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const weather = useWeather()

  if (loading) return <LoadingScreen />

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public landing */}
        <Route
          path="/"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Landing weatherData={weather} />
            </motion.div>
          }
        />

        {/* Auth page */}
        <Route
          path="/auth"
          element={
            user ? <Navigate to="/dashboard" replace /> : (
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <Auth />
              </motion.div>
            )
          }
        />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedLayout>
            <AnimatedPage key="dashboard"><Dashboard weatherData={weather} /></AnimatedPage>
          </ProtectedLayout>
        } />
        <Route path="/yelahanka" element={
          <ProtectedLayout>
            <AnimatedPage key="yelahanka"><YelahankaHub /></AnimatedPage>
          </ProtectedLayout>
        } />
        <Route path="/risk-map" element={
          <ProtectedLayout>
            <AnimatedPage key="risk-map"><RiskMap /></AnimatedPage>
          </ProtectedLayout>
        } />
        <Route path="/climate" element={
          <ProtectedLayout>
            <AnimatedPage key="climate"><Climate /></AnimatedPage>
          </ProtectedLayout>
        } />
        <Route path="/preparedness" element={
          <ProtectedLayout>
            <AnimatedPage key="preparedness"><Preparedness weatherData={weather} /></AnimatedPage>
          </ProtectedLayout>
        } />
        <Route path="/resources" element={
          <ProtectedLayout>
            <AnimatedPage key="resources"><Resources /></AnimatedPage>
          </ProtectedLayout>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  )
}
