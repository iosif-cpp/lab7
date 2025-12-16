export const getTransactions = () => {
  const stored = localStorage.getItem('transactions')
  if (stored) {
    return JSON.parse(stored)
  }
  return []
}

export const saveTransactions = (transactions) => {
  localStorage.setItem('transactions', JSON.stringify(transactions))
}

export const getDefaultCurrency = () => {
  return localStorage.getItem('defaultCurrency') || 'RUB'
}

export const setDefaultCurrency = (currency) => {
  localStorage.setItem('defaultCurrency', currency)
}

export const getCategoryBudgets = () => {
  const stored = localStorage.getItem('categoryBudgets')
  if (!stored) return {}
  try {
    return JSON.parse(stored)
  } catch {
    return {}
  }
}

export const saveCategoryBudgets = (budgets) => {
  localStorage.setItem('categoryBudgets', JSON.stringify(budgets))
}








