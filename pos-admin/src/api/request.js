/**
 * 統一的 API 請求封裝
 * 支持 Mock API 和真實 API 切換
 *
 * 部署環境：
 *   本地開發 → https://api.wecocafe.com/api（跨域）
 *   生產部署 → /api（同域名 www.wecocafe.com）
 */

// 優先使用環境變量，生產環境默認同域 /api
const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' // 嚴格匹配，由 .env 控制

// 根據環境切換
const API_BASE = USE_MOCK ? '' : BASE_URL

// 默認請求超時 20 秒
const DEFAULT_TIMEOUT = 20000

/**
 * 帶超時的 fetch
 */
function fetchWithTimeout(url, options, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId))
}

/**
 * 發送 API 請求
 */
async function request(options) {
  const { url, method = 'GET', data = {}, headers = {}, timeout = DEFAULT_TIMEOUT } = options

  // 如果是本地 Mock，直接使用相對路徑
  const fullUrl = USE_MOCK ? url : `${API_BASE}${url}`

  try {
    const response = await fetchWithTimeout(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getToken(),
        ...headers
      },
      body: method !== 'GET' ? JSON.stringify(data) : undefined
    }, timeout)

    // 401 未授權 — token 過期或無效
    if (response.status === 401) {
      // 清除本地登入狀態，提示用戶重新登入
      localStorage.removeItem('pos_token')
      localStorage.removeItem('pos_user')
      // 觸發全局事件，讓 App.vue 跳轉到登入頁
      window.dispatchEvent(new CustomEvent('auth-expired'))
      throw new Error('登入已過期，請重新登入')
    }

    // 429 限速
    if (response.status === 429) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || '請求過於頻繁，請稍後再試')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `請求失敗: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('API 請求超時:', url)
      throw new Error('請求超時，請檢查網絡')
    }
    console.error('API 請求錯誤:', error)
    throw error
  }
}

function getToken() {
  const token = localStorage.getItem('pos_token')
  return token ? `Bearer ${token}` : ''
}

export default request
