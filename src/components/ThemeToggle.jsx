import React from 'react'

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button 
      className="theme-toggle"
      onClick={onToggle}
      aria-label="Переключить тему"
      title={isDark ? 'Светлая тема' : 'Темная тема'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}

export default ThemeToggle









