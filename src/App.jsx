import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import AddTransaction from './components/AddTransaction'
import Analytics from './components/Analytics'
import ThemeToggle from './components/ThemeToggle'
import { getTransactions, saveTransactions } from './utils/storage'

function Sidebar({ isDark, isOpen, onClose }) {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  const navItems = [
    { path: '/', icon: '📊', label: 'Главная' },
    { path: '/transactions', icon: '📝', label: 'Транзакции' },
    { path: '/add', icon: '➕', label: 'Добавить' },
    { path: '/analytics', icon: '📈', label: 'Аналитика' },
  ]

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h1 className="sidebar-logo">💰 Finance</h1>
          </div>
          
          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="nav-section-title">Навигация</div>
              {navItems.map(item => (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={`nav-link ${isActive(item.path)}`}
                  onClick={onClose}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </aside>
    </>
  )
}

function App() {
  const [transactions, setTransactions] = useState([])
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return true
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const loadedTransactions = getTransactions()
    setTransactions(loadedTransactions)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const handleAddTransaction = (newTransaction) => {
    const updated = [...transactions, newTransaction]
    setTransactions(updated)
    saveTransactions(updated)
  }

  const handleDeleteTransaction = (id) => {
    const updated = transactions.filter(t => t.id !== id)
    setTransactions(updated)
    saveTransactions(updated)
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <Router>
      <div className="app">
        <Sidebar isDark={isDark} isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="app-main">
          <header className="app-header">
            <div className="header-content">
              <button className="menu-toggle" onClick={toggleSidebar} aria-label="Меню">
                ☰
              </button>
              <h2 className="page-title">Личный Финансовый Трекер</h2>
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            </div>
          </header>
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard transactions={transactions} />} />
              <Route 
                path="/transactions" 
                element={
                  <Transactions 
                    transactions={transactions} 
                    onDelete={handleDeleteTransaction}
                  />
                } 
              />
              <Route 
                path="/add" 
                element={<AddTransaction onAdd={handleAddTransaction} />} 
              />
              <Route 
                path="/analytics" 
                element={<Analytics transactions={transactions} />} 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App

