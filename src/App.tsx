import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from './hooks/useAuth'
import { useWeather } from './hooks/useWeather'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import RiskMap from './pages/RiskMap'
import Simulation from './pages/Simulation'
import Climate from './pages/Climate'
import Preparedness from './pages/Preparedness'
import Resources from './pages/Resources'
import Auth from './pages/Auth'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const weather = useWeather()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar user={user} onSignOut={signOut} weather={weather} />
      <main style={{ flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>
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
      style={{ padding: '36px 44px 80px', maxWidth: '1240px', margin: '0 auto' }}
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
          width: 40, height: 40,
          borderRadius: '50%',
          border: '3px solid var(--ln)',
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
            user ? <Navigate to="/dashboard" replace /> : (
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <Landing weatherData={weather} />
              </motion.div>
            )
          }
        />

        {/* Auth */}
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
        <Route path="/risk-map" element={
          <ProtectedLayout>
            <AnimatedPage key="risk-map"><RiskMap /></AnimatedPage>
          </ProtectedLayout>
        } />
        <Route path="/simulation" element={
          <ProtectedLayout>
            <AnimatedPage key="simulation"><Simulation /></AnimatedPage>
          </ProtectedLayout>
        } />
        <Route path="/climate" element={
          <ProtectedLayout>
            <AnimatedPage key="climate"><Climate /></AnimatedPage>
          </ProtectedLayout>
        } />
        <Route path="/preparedness" element={
          <ProtectedLayout>
            <AnimatedPage key="preparedness"><Preparedness /></AnimatedPage>
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
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
