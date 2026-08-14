import { useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from './store'
import { LocaleProvider } from './i18n'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { HomePage } from './pages/HomePage'
import { ChapterPage } from './pages/ChapterPage'

export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <LocaleProvider>
      <AppProvider>
        <HashRouter>
          <div className="app-shell">
            <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
            <div className="app-body">
              <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
              <main className="app-main">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/:chapterId" element={<ChapterPage />} />
                </Routes>
              </main>
            </div>
            <footer className="site-footer">
              <span>learning-dsh · MIT · pinning dsh to sourceRef commits</span>
            </footer>
          </div>
        </HashRouter>
      </AppProvider>
    </LocaleProvider>
  )
}