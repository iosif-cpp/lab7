import React, { useState, useMemo } from 'react'
import { getCategoryBudgets, saveCategoryBudgets } from '../utils/storage'

function Analytics({ transactions }) {
  const [period, setPeriod] = useState('month')
  const [categoryBudgets, setCategoryBudgets] = useState(() => getCategoryBudgets())

  const expenseCategoriesList = [
    'Еда',
    'Транспорт',
    'Развлечения',
    'Покупки',
    'Здоровье',
    'Другое'
  ]

  const periodData = useMemo(() => {
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate = new Date(0) // Все время
    }

    return transactions.filter(t => new Date(t.date) >= startDate)
  }, [transactions, period])

  const totalIncome = periodData
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const totalExpenses = periodData
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const avgIncome = periodData.filter(t => t.type === 'income').length > 0
    ? totalIncome / periodData.filter(t => t.type === 'income').length
    : 0

  const avgExpense = periodData.filter(t => t.type === 'expense').length > 0
    ? totalExpenses / periodData.filter(t => t.type === 'expense').length
    : 0

  const categoryExpenses = {}
  periodData
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + parseFloat(t.amount)
    })

  const categoryData = Object.entries(categoryExpenses)
    .sort((a, b) => b[1] - a[1])

  const maxCategoryExpense = categoryData.length > 0 ? categoryData[0][1] : 1

  // Доходы по категориям
  const categoryIncome = {}
  periodData
    .filter(t => t.type === 'income')
    .forEach(t => {
      categoryIncome[t.category] = (categoryIncome[t.category] || 0) + parseFloat(t.amount)
    })

  const incomeCategoryData = Object.entries(categoryIncome)
    .sort((a, b) => b[1] - a[1])

  const dailyData = {}
  periodData.forEach(t => {
    const date = new Date(t.date).toLocaleDateString('ru-RU')
    if (!dailyData[date]) {
      dailyData[date] = { income: 0, expense: 0 }
    }
    if (t.type === 'income') {
      dailyData[date].income += parseFloat(t.amount)
    } else {
      dailyData[date].expense += parseFloat(t.amount)
    }
  })

  const sortedDays = Object.entries(dailyData)
    .sort((a, b) => new Date(a[0].split('.').reverse().join('-')) - new Date(b[0].split('.').reverse().join('-')))
  const maxDaily = Math.max(...sortedDays.map(([_, data]) => Math.max(data.income, data.expense)), 1)

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthlyCategoryExpenses = {}
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const date = new Date(t.date)
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        monthlyCategoryExpenses[t.category] = (monthlyCategoryExpenses[t.category] || 0) + parseFloat(t.amount)
      }
    })

  const monthlyTotalExpenses = Object.values(monthlyCategoryExpenses).reduce((sum, val) => sum + val, 0)

  let forecastMonthExpenses = null
  if (period === 'month') {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysPassed = now.getDate()
    const dailyAvg = daysPassed > 0 ? monthlyTotalExpenses / daysPassed : 0
    forecastMonthExpenses = dailyAvg * daysInMonth
  }

  const prevStats = useMemo(() => {
    if (period === 'all') {
      return {
        prevIncome: 0,
        prevExpenses: 0,
        incomeChangePct: null,
        expenseChangePct: null
      }
    }

    const nowDate = new Date()
    let startCurrent = new Date(nowDate)

    switch (period) {
      case 'week':
        startCurrent.setDate(nowDate.getDate() - 7)
        break
      case 'month':
        startCurrent.setMonth(nowDate.getMonth() - 1)
        break
      case 'quarter':
        startCurrent.setMonth(nowDate.getMonth() - 3)
        break
      case 'year':
        startCurrent.setFullYear(nowDate.getFullYear() - 1)
        break
      default:
        startCurrent = new Date(0)
    }

    const lengthMs = nowDate - startCurrent
    if (lengthMs <= 0) {
      return {
        prevIncome: 0,
        prevExpenses: 0,
        incomeChangePct: null,
        expenseChangePct: null
      }
    }

    const endPrev = new Date(startCurrent.getTime() - 1)
    const startPrev = new Date(endPrev.getTime() - lengthMs)

    const prevPeriodData = transactions.filter(t => {
      const date = new Date(t.date)
      return date >= startPrev && date <= endPrev
    })

    const prevIncome = prevPeriodData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    const prevExpenses = prevPeriodData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    const incomeChangePct =
      prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : null

    const expenseChangePct =
      prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : null

    return {
      prevIncome,
      prevExpenses,
      incomeChangePct,
      expenseChangePct
    }
  }, [transactions, period, totalIncome, totalExpenses])

  const handleBudgetChange = (category, value) => {
    const numeric = value === '' ? '' : Number(value.replace(',', '.'))
    const safeValue = value === '' ? '' : (isNaN(numeric) ? 0 : numeric)

    setCategoryBudgets(prev => {
      const next = { ...prev, [category]: safeValue === '' ? undefined : safeValue }
      const cleaned = Object.fromEntries(
        Object.entries(next).filter(([, v]) => v !== undefined && v !== null && v !== '')
      )
      saveCategoryBudgets(cleaned)
      return cleaned
    })
  }

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
    <div className="analytics-page">
      <h2>Аналитика</h2>

      <div className="period-filter">
        <label>Период:</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="week">Неделя</option>
          <option value="month">Месяц</option>
          <option value="quarter">Квартал</option>
          <option value="year">Год</option>
          <option value="all">Все время</option>
        </select>
      </div>

      <div className="analytics-stats">
        <div className="stat-box">
          <div className="stat-label">Средний доход</div>
          <div className="stat-number income">+{avgIncome.toFixed(2)} ₽</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Средний расход</div>
          <div className="stat-number expense">-{avgExpense.toFixed(2)} ₽</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Итого доходов</div>
          <div className="stat-number income">+{totalIncome.toFixed(2)} ₽</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Итого расходов</div>
          <div className="stat-number expense">-{totalExpenses.toFixed(2)} ₽</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Прогноз расходов до конца месяца</div>
          <div className="stat-number expense">
            {forecastMonthExpenses !== null ? `-${forecastMonthExpenses.toFixed(2)} ₽` : '—'}
          </div>
          <div className="stat-sub">
            Текущие расходы за месяц: {monthlyTotalExpenses.toFixed(2)} ₽
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Сравнение с прошлым периодом</div>
          <div className="stat-sub">
            Доходы:{' '}
            {prevStats.incomeChangePct === null
              ? '—'
              : `${prevStats.incomeChangePct >= 0 ? '+' : ''}${prevStats.incomeChangePct.toFixed(1)}%`}
          </div>
          <div className="stat-sub">
            Расходы:{' '}
            {prevStats.expenseChangePct === null
              ? '—'
              : `${prevStats.expenseChangePct >= 0 ? '+' : ''}${prevStats.expenseChangePct.toFixed(1)}%`}
          </div>
        </div>
        {categoryData.length > 0 && (
          <div className="stat-box highlight">
            <div className="stat-label">Самая затратная категория</div>
            <div className="stat-number">
              {getCategoryIcon(categoryData[0][0])} {categoryData[0][0]}
            </div>
            <div className="stat-sub">{categoryData[0][1].toFixed(2)} ₽</div>
          </div>
        )}
      </div>

      {sortedDays.length > 0 && (
        <div className="chart-container">
          <h3>Динамика доходов и расходов</h3>
          <div className="chart">
            <svg
              className="chart-line"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <line x1="0" y1="100" x2="100" y2="100" className="chart-grid-line" />
              <line x1="0" y1="50" x2="100" y2="50" className="chart-grid-line" />
              <line x1="0" y1="0" x2="100" y2="0" className="chart-grid-line" />

              <polyline
                className="chart-polyline income"
                fill="none"
                strokeWidth="1.5"
                points={sortedDays
                  .map(([date, data], index) => {
                    const x = (sortedDays.length === 1 ? 50 : (index / (sortedDays.length - 1)) * 100)
                    const y =
                      maxDaily === 0
                        ? 100
                        : 100 - (Math.max(data.income, 0) / maxDaily) * 100
                    return `${x},${y}`
                  })
                  .join(' ')}
              />

              {sortedDays.map(([date, data], index) => {
                if (data.income <= 0) return null
                const x = sortedDays.length === 1 ? 50 : (index / (sortedDays.length - 1)) * 100
                const y = 100 - (data.income / maxDaily) * 100
                return (
                  <circle
                    key={`income-${date}`}
                    className="chart-point income"
                    cx={x}
                    cy={y}
                    r="1.4"
                  >
                    <title>{`Доход: ${data.income.toFixed(2)} ₽`}</title>
                  </circle>
                )
              })}

              <polyline
                className="chart-polyline expense"
                fill="none"
                strokeWidth="1.5"
                points={sortedDays
                  .map(([date, data], index) => {
                    const x = (sortedDays.length === 1 ? 50 : (index / (sortedDays.length - 1)) * 100)
                    const y =
                      maxDaily === 0
                        ? 100
                        : 100 - (Math.max(data.expense, 0) / maxDaily) * 100
                    return `${x},${y}`
                  })
                  .join(' ')}
              />

              {sortedDays.map(([date, data], index) => {
                if (data.expense <= 0) return null
                const x = sortedDays.length === 1 ? 50 : (index / (sortedDays.length - 1)) * 100
                const y = 100 - (data.expense / maxDaily) * 100
                return (
                  <circle
                    key={`expense-${date}`}
                    className="chart-point expense"
                    cx={x}
                    cy={y}
                    r="1.4"
                  >
                    <title>{`Расход: ${data.expense.toFixed(2)} ₽`}</title>
                  </circle>
                )
              })}
            </svg>
          </div>
          <div className="chart-x-labels">
            {sortedDays.map(([date]) => (
              <div key={date} className="chart-x-label">
                {date}
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color income"></div>
              <span>Доходы</span>
            </div>
            <div className="legend-item">
              <div className="legend-color expense"></div>
              <span>Расходы</span>
            </div>
          </div>
        </div>
      )}

      {categoryData.length > 0 && (
        <div className="category-chart">
          <h3>Расходы по категориям</h3>
          <div className="category-bars">
            {categoryData.map(([category, amount]) => (
              <div key={category} className="category-bar-item">
                <div className="category-bar-header">
                  <span className="category-icon">{getCategoryIcon(category)}</span>
                  <span className="category-name">{category}</span>
                  <span className="category-amount">{amount.toFixed(2)} ₽</span>
                </div>
                <div className="category-bar-track">
                  <div
                    className="category-bar-fill"
                    style={{ width: `${(amount / maxCategoryExpense) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {incomeCategoryData.length > 0 && (
        <div className="category-chart">
          <h3>Доходы по категориям</h3>
          <div className="category-bars">
            {incomeCategoryData.map(([category, amount]) => (
              <div key={category} className="category-bar-item">
                <div className="category-bar-header">
                  <span className="category-icon">{getCategoryIcon(category)}</span>
                  <span className="category-name">{category}</span>
                  <span className="category-amount income">{amount.toFixed(2)} ₽</span>
                </div>
                <div className="category-bar-track">
                  <div
                    className="category-bar-fill income"
                    style={{ width: `${(amount / (totalIncome || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="category-chart">
        <h3>Бюджеты по категориям (текущий месяц)</h3>
        <div className="category-bars">
          {expenseCategoriesList.map(category => {
            const spent = monthlyCategoryExpenses[category] || 0
            const budget = categoryBudgets[category] || 0
            const percent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0

            return (
              <div key={category} className="category-bar-item">
                <div className="category-bar-header">
                  <span className="category-icon">{getCategoryIcon(category)}</span>
                  <span className="category-name">{category}</span>
                  <span className="category-amount">
                    {budget > 0
                      ? `${spent.toFixed(2)} / ${budget.toFixed(2)} ₽`
                      : `${spent.toFixed(2)} ₽`}
                  </span>
                </div>
                <div className="category-bar-track">
                  <div
                    className="category-bar-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="category-bar-header">
                  <span className="category-name">Бюджет, ₽</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="budget-input"
                    value={categoryBudgets[category] ?? ''}
                    onChange={(e) => handleBudgetChange(category, e.target.value)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {periodData.length === 0 && (
        <div className="empty-state">
          Нет данных за выбранный период
        </div>
      )}
    </div>
  )
}

export default Analytics








