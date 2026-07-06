/**
 * 登錄 API
 * ⚠️ 改為完全使用後端 API 驗證，移除前端硬編碼帳號
 */
import request from './request'

/**
 * 登入 — 使用後端 /api/admin/login
 */
export async function login(username, password) {
  const result = await request({
    url: '/admin/login',
    method: 'POST',
    data: { username, password }
  })

  if (!result.success) {
    throw new Error(result.message || '登入失敗')
  }

  return {
    token: result.token,
    user: result.adminInfo || result.user,
    mustChangePassword: result.adminInfo?.mustChangePassword || false
  }
}

/**
 * 登出 — 清除本地 token
 */
export async function logout() {
  // 前端只需要清除本地存儲，後端 token 是無狀態的
  return { success: true }
}

/**
 * 驗證 token 是否仍然有效
 */
export async function verifyToken() {
  try {
    const result = await request({
      url: '/admin/verify',
      method: 'GET'
    })
    return result.success === true
  } catch {
    return false
  }
}
