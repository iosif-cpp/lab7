import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { fetchExchangeRates } from '../utils/currencyAPI'

function Dashboard({ transactions }) {
  const [exchangeRates, setExchangeRates] = useState({})
  const [displayRates, setDisplayRates] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [changedCurrencies, setChangedCurrencies] = useState({})
  const animationIntervalRef = useRef(null)

  useEffect(() => {
    let intervalId

    const loadRates = async (withLoading = false) => {
      try {
        if (withLoading) {
          setLoading(true)
        }
        setError(null)
        const rates = await fetchExchangeRates('USD')

        const tracked = ['EUR', 'RUB', 'GBP', 'JPY', 'CNY']

        setExchangeRates(prevRates => {
          const prev = prevRates || {}
          const changed = {}

          tracked.forEach(code => {
            const prevVal = prev[code]
            const nextVal = rates ? rates[code] : undefined
            if (prevVal !== undefined && nextVal !== undefined && prevVal !== nextVal) {
              changed[code] = true
            }
          })

          if (Object.keys(changed).length > 0) {
            setChangedCurrencies(changed)
            setTimeout(() => {
              setChangedCurrencies({})
            }, 700)
          }

          if (animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current)
          }
          const steps = 15 // ~15 секунд плавного изменения
          let step = 0
          const fromRates = prev
          const toRates = rates || {}

          animationIntervalRef.current = setInterval(() => {
            step += 1
            const t = Math.min(step / steps, 1)

            setDisplayRates(prevDisplay => {
              const nextDisplay = { ...prevDisplay }
              tracked.forEach(code => {
                const start = fromRates[code] !== undefined ? fromRates[code] : toRates[code]
                const end = toRates[code]
                if (start !== undefined && end !== undefined) {
                  nextDisplay[code] = start + (end - start) * t
                } else if (end !== undefined) {
                  nextDisplay[code] = end
                }
              })
              return nextDisplay
            })

            if (t === 1) {
              clearInterval(animationIntervalRef.current)
              animationIntervalRef.current = null
            }
          }, 1000)

          return rates
        })
        setLastUpdated(new Date())
      } catch (err) {
        console.error('Ошибка загрузки курсов:', err)
        setError('Не удалось загрузить курсы валют')
        // Устанавливаем пустой объект, чтобы не показывать ошибку бесконечно
        setDisplayRates({})
      } finally {
        if (withLoading) {
          setLoading(false)
        }
      }
    }

    loadRates(true)

    intervalId = setInterval(() => {
      loadRates(false)
    }, 30000)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }
    }
  }, [])

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })

  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const expenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const balance = income - expenses

  const categoryExpenses = {}
  monthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + parseFloat(t.amount)
    })

  const topCategories = Object.entries(categoryExpenses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  const getCategoryIcon = (category) => {
    const icons = {
      'Еда': '🍔',
      'Транспорт': '🚗',
      'Развлечения': '🎬',
      'Покупки': '🛍️',
      'Здоровье': '💊',
      'Зарплата': '💰',
      'Подарки': '🎁',
      'Другое': '📌'
    }
    return icons[category] || '📌'
  }

  return (
    <div className="dashboard">
      <h2>Главная страница</h2>

      <div className="balance-card">
        <h3>Текущий баланс</h3>
        <div className={`balance-amount ${balance >= 0 ? 'positive' : 'negative'}`}>
          {balance >= 0 ? '+' : ''}{balance.toFixed(2)} ₽
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-label">Доходы за месяц</div>
          <div className="stat-value">{income.toFixed(2)} ₽</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-label">Расходы за месяц</div>
          <div className="stat-value">{expenses.toFixed(2)} ₽</div>
        </div>
      </div>

      <div className="currency-widget">
        <h3>Курсы валют (к USD)</h3>
        {lastUpdated && (
          <div className="currency-updated-time">
            Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
          </div>
        )}
        {loading ? (
          <div className="loading">Загрузка курсов...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="currency-list">
            <div className="currency-item">
              <span className="currency-name">EUR</span>
              <span className={`currency-rate ${changedCurrencies.EUR ? 'currency-rate-changed' : ''}`}>
                {displayRates.EUR ? displayRates.EUR.toFixed(4) : '—'}
              </span>
            </div>
            <div className="currency-item">
              <span className="currency-name">RUB</span>
              <span className={`currency-rate ${changedCurrencies.RUB ? 'currency-rate-changed' : ''}`}>
                {displayRates.RUB ? displayRates.RUB.toFixed(4) : '—'}
              </span>
            </div>
            <div className="currency-item">
              <span className="currency-name">GBP</span>
              <span className={`currency-rate ${changedCurrencies.GBP ? 'currency-rate-changed' : ''}`}>
                {displayRates.GBP ? displayRates.GBP.toFixed(4) : '—'}
              </span>
            </div>
            <div className="currency-item">
              <span className="currency-name">JPY</span>
              <span className={`currency-rate ${changedCurrencies.JPY ? 'currency-rate-changed' : ''}`}>
                {displayRates.JPY ? displayRates.JPY.toFixed(4) : '—'}
              </span>
            </div>
            <div className="currency-item">
              <span className="currency-name">CNY</span>
              <span className={`currency-rate ${changedCurrencies.CNY ? 'currency-rate-changed' : ''}`}>
                {displayRates.CNY ? displayRates.CNY.toFixed(4) : '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {topCategories.length > 0 && (
        <div className="top-categories">
          <h3>Топ-3 категории расходов</h3>
          <div className="categories-list">
            {topCategories.map(([category, amount], index) => (
              <div key={category} className="category-item">
                <span className="category-icon">{getCategoryIcon(category)}</span>
                <span className="category-name">{category}</span>
                <span className="category-amount">{amount.toFixed(2)} ₽</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="recent-transactions">
        <div className="section-header">
          <h3>Последние транзакции</h3>
          <Link to="/transactions" className="view-all-link">Все транзакции →</Link>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="empty-state">
            Нет транзакций. <Link to="/add">Добавьте первую транзакцию</Link>
          </div>
        ) : (
          <div className="transactions-list">
            {recentTransactions.map(transaction => (
              <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                <div className="transaction-left">
                  <span className="transaction-icon">{getCategoryIcon(transaction.category)}</span>
                  <div className="transaction-info">
                    <div className="transaction-category">{transaction.category}</div>
                    <div className="transaction-description">{transaction.description || 'Без описания'}</div>
                    <div className="transaction-date">
                      {new Date(transaction.date).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}{parseFloat(transaction.amount).toFixed(2)} ₽
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

