<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo">
        <img :src="`${BASE_URL}icons/logo.png`" alt="WECO CAFE" @error="handleLogoError" />
        <h1>WECO CAFE</h1>
        <p>門店管理系統</p>
      </div>

      <van-form @submit="handleLogin">
        <van-cell-group inset>
          <van-field
            v-model="username"
            label="帳號"
            placeholder="請輸入帳號"
            :rules="[{ required: true, message: '請填寫帳號' }]"
          />
          <van-field
            v-model="password"
            type="password"
            label="密碼"
            placeholder="請輸入密碼"
            :rules="[{ required: true, message: '請填寫密碼' }]"
          />
        </van-cell-group>

        <div style="margin: 16px;">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
            loading-text="登入中..."
          >
            登入
          </van-button>
        </div>
      </van-form>

      <!-- 登入提示：僅在開發環境顯示 -->
      <div v-if="isDev" class="login-hint">
        <p>測試環境，請聯絡管理員獲取帳號</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showNotify } from 'vant'
import { useAuthStore } from '../stores/auth'
import { login } from '../api/auth'

const router = useRouter()
const authStore = useAuthStore()
const BASE_URL = import.meta.env.BASE_URL

// 僅在開發環境顯示測試提示
const isDev = import.meta.env.DEV

const username = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    const result = await login(username.value, password.value)
    authStore.setLogin(result.token, result.user)
    showNotify({ type: 'success', message: `歡迎回來，${result.user.name}！` })
    router.replace('/')
  } catch (error) {
    showToast(error.message || '登入失敗')
  } finally {
    loading.value = false
  }
}

function handleLogoError(e) {
  // Logo 加載失敗時使用文字
  e.target.style.display = 'none'
  e.target.nextElementSibling.style.display = 'block'
}
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  min-height: calc(var(--vh, 100vh) * 1);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
  padding: 20px;
}

.login-card {
  width: 92%;
  max-width: 400px;
  padding: 36px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.logo {
  text-align: center;
  margin-bottom: 32px;
}

.logo img {
  width: 72px;
  height: 72px;
  margin-bottom: 14px;
  object-fit: contain;
}

.logo h1 {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 6px;
}

.logo p {
  font-size: 13px;
  color: #888;
}

.login-hint {
  text-align: center;
  margin-top: 18px;
  padding: 10px 12px;
  background: #f7f8fa;
  border-radius: 8px;
}

.login-hint p {
  font-size: 11px;
  color: #999;
  margin: 3px 0;
  line-height: 1.5;
}

/* ===== 平板（>= 768px） ===== */
@media screen and (min-width: 768px) {
  .login-card {
    max-width: 440px;
    padding: 44px 32px;
  }
  .logo { margin-bottom: 38px; }
  .logo img { width: 84px; height: 84px; }
  .logo h1 { font-size: 30px; }
  .logo p { font-size: 15px; }
  .login-hint p { font-size: 13px; }
}

/* ===== 橫屏 / 寬屏幕 ===== */
@media screen and (min-width: 1024px) {
  .login-card {
    max-width: 480px;
    padding: 52px 40px;
  }
  .logo img { width: 96px; height: 96px; }
  .logo h1 { font-size: 34px; }
}

/* ===== 小手機（<= 380px） ===== */
@media screen and (max-width: 380px) {
  .login-card { width: 96%; padding: 28px 18px; }
  .logo { margin-bottom: 24px; }
  .logo img { width: 60px; height: 60px; }
  .logo h1 { font-size: 22px; }
}
</style>
