const CACHE_DURATION = 30 * 1000
let exchangeRatesCache = null
let cacheTimestamp = null

export const fetchExchangeRates = async (baseCurrency = 'USD') => {
  if (exchangeRatesCache && cacheTimestamp) {
    const now = Date.now()
    if (now - cacheTimestamp < CACHE_DURATION) {
      return exchangeRatesCache
    }
  }

  const apis = [
    async () => {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (!data.rates) throw new Error('Invalid response format')
      return data.rates
    },
    async () => {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (!data.rates) throw new Error('Invalid response format')
      return data.rates
    }
  ]

  for (let i = 0; i < apis.length; i++) {
    try {
      const rates = await Promise.race([
        apis[i](),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ])

      if (rates && typeof rates === 'object' && Object.keys(rates).length > 0) {
        exchangeRatesCache = rates
        cacheTimestamp = Date.now()
        console.log('Курсы валют успешно загружены')
        return rates
      }
    } catch (error) {
      console.warn(`API источник ${i + 1} не сработал:`, error.message)
      continue
    }
  }

  if (exchangeRatesCache) {
    console.warn('Используются кешированные курсы валют')
    return exchangeRatesCache
  }

  console.warn('Используются дефолтные курсы валют (API недоступен)')
  return {
    EUR: baseCurrency === 'USD' ? 0.92 : 1,
    RUB: baseCurrency === 'USD' ? 92.5 : 1,
    GBP: baseCurrency === 'USD' ? 0.79 : 1,
    JPY: baseCurrency === 'USD' ? 150.0 : 1,
    CNY: baseCurrency === 'USD' ? 7.2 : 1,
    USD: baseCurrency === 'USD' ? 1 : 1
  }
}

export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const rates = await fetchExchangeRates(fromCurrency)
  const rate = rates[toCurrency]
  
  if (!rate) {
    return amount // Если курс не найден, возвращаем исходную сумму
  }

  return amount * rate
}

export const getPopularCurrencies = async () => {
  const rates = await fetchExchangeRates('USD')
  
  return {
    'USD': rates.USD || 1,
    'EUR': rates.EUR || 1,
    'RUB': rates.RUB || 1,
    'GBP': rates.GBP || 1,
  }
}

