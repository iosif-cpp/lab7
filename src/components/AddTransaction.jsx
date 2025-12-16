import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { convertCurrency } from '../utils/currencyAPI'

function AddTransaction({ onAdd }) {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    currency: 'RUB',
    category: 'Другое',
    date: new Date().toISOString().split('T')[0],
    description: ''
  })

  const [convertedAmount, setConvertedAmount] = useState(null)
  const [defaultCurrency] = useState('RUB')

  const categories = {
    income: ['Зарплата', 'Подарки', 'Другое'],
    expense: ['Еда', 'Транспорт', 'Развлечения', 'Покупки', 'Здоровье', 'Другое']
  }

  useEffect(() => {
    const convertAmount = async () => {
      if (formData.amount && formData.currency !== defaultCurrency) {
        try {
          const converted = await convertCurrency(
            parseFloat(formData.amount),
            formData.currency,
            defaultCurrency
          )
          setConvertedAmount(converted.toFixed(2))
        } catch (error) {
          console.error('Ошибка конвертации:', error)
          setConvertedAmount(null)
        }
      } else {
        setConvertedAmount(null)
      }
    }

    convertAmount()
  }, [formData.amount, formData.currency, defaultCurrency])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Пожалуйста, введите корректную сумму')
      return
    }

    const saveTransaction = async () => {
      let finalAmount = parseFloat(formData.amount)
      
      if (formData.currency !== defaultCurrency && convertedAmount) {
        finalAmount = parseFloat(convertedAmount)
      }

      const newTransaction = {
        id: Date.now().toString(),
        type: formData.type,
        amount: finalAmount.toString(),
        category: formData.category,
        date: formData.date,
        description: formData.description,
        originalCurrency: formData.currency,
        originalAmount: formData.amount
      }

      onAdd(newTransaction)

      setFormData({
        type: 'expense',
        amount: '',
        currency: 'RUB',
        category: 'Другое',
        date: new Date().toISOString().split('T')[0],
        description: ''
      })
      setConvertedAmount(null)

      navigate('/transactions')
    }

    saveTransaction()
  }

  return (
    <div className="add-transaction-page">
      <h2>Добавить транзакцию</h2>

      <form onSubmit={handleSubmit} className="transaction-form">
        {/* Тип транзакции */}
        <div className="form-group">
          <label>Тип транзакции</label>
          <div className="type-toggle">
            <button
              type="button"
              className={`type-btn ${formData.type === 'expense' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: 'Другое' }))}
            >
              Расход
            </button>
            <button
              type="button"
              className={`type-btn ${formData.type === 'income' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: 'Зарплата' }))}
            >
              Доход
            </button>
          </div>
        </div>

        {/* Сумма */}
        <div className="form-group">
          <label>Сумма *</label>
          <div className="amount-input-group">
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
            />
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
            >
              <option value="RUB">₽ RUB</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
              <option value="GBP">£ GBP</option>
            </select>
          </div>
          {convertedAmount && formData.currency !== defaultCurrency && (
            <div className="converted-amount">
              ≈ {convertedAmount} {defaultCurrency}
            </div>
          )}
        </div>

        {/* Категория */}
        <div className="form-group">
          <label>Категория *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            {categories[formData.type].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Дата */}
        <div className="form-group">
          <label>Дата *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        {/* Описание */}
        <div className="form-group">
          <label>Описание</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Добавьте описание (необязательно)"
            rows="3"
          />
        </div>

        {/* Кнопка отправки */}
        <div className="form-actions">
          <button type="submit" className="submit-btn">
            Сохранить транзакцию
          </button>
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => navigate('/transactions')}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddTransaction








