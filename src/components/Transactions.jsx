import React, { useState } from 'react'

function Transactions({ transactions, onDelete }) {
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = ['Еда', 'Транспорт', 'Развлечения', 'Покупки', 'Здоровье', 'Зарплата', 'Подарки', 'Другое']

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType !== 'all' && transaction.type !== filterType) {
      return false
    }
    if (filterCategory !== 'all' && transaction.category !== filterCategory) {
      return false
    }
    if (searchQuery && !transaction.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )

  const totalIncome = sortedTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const totalExpenses = sortedTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

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

  const handleDelete = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
      onDelete(id)
    }
  }

  return (
    <div className="transactions-page">
      <h2>Транзакции</h2>

      {/* Фильтры */}
      <div className="filters">
        <div className="filter-group">
          <label>Тип:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Все</option>
            <option value="income">Доходы</option>
            <option value="expense">Расходы</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Категория:</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">Все категории</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-group search">
          <label>Поиск:</label>
          <input
            type="text"
            placeholder="Поиск по описанию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Сводка */}
      <div className="summary-cards">
        <div className="summary-card income">
          <div className="summary-label">Итого доходов</div>
          <div className="summary-value">+{totalIncome.toFixed(2)} ₽</div>
        </div>
        <div className="summary-card expense">
          <div className="summary-label">Итого расходов</div>
          <div className="summary-value">-{totalExpenses.toFixed(2)} ₽</div>
        </div>
        <div className="summary-card balance">
          <div className="summary-label">Баланс</div>
          <div className={`summary-value ${(totalIncome - totalExpenses) >= 0 ? 'positive' : 'negative'}`}>
            {(totalIncome - totalExpenses).toFixed(2)} ₽
          </div>
        </div>
      </div>

      {/* Список транзакций */}
      <div className="transactions-list-full">
        {sortedTransactions.length === 0 ? (
          <div className="empty-state">
            {transactions.length === 0 
              ? 'Нет транзакций. Добавьте первую транзакцию!' 
              : 'Транзакции не найдены по выбранным фильтрам'}
          </div>
        ) : (
          sortedTransactions.map(transaction => (
            <div key={transaction.id} className={`transaction-item-full ${transaction.type}`}>
              <div className="transaction-left">
                <span className="transaction-icon">{getCategoryIcon(transaction.category)}</span>
                <div className="transaction-info">
                  <div className="transaction-category">{transaction.category}</div>
                  <div className="transaction-description">{transaction.description || 'Без описания'}</div>
                  <div className="transaction-date">
                    {new Date(transaction.date).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              <div className="transaction-right">
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}{parseFloat(transaction.amount).toFixed(2)} ₽
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(transaction.id)}
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Transactions








