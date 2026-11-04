<template>
  <div class="profilePage">
    <div v-if="!logined" class="loginPrompt">
      <i class="pi pi-user"></i>
      <h1>请先登录</h1>
      <p>登录后即可管理个人资料与绑定账号</p>
      <router-link to="/">回到首页</router-link>
    </div>

    <template v-else>
      <h1 class="pageTitle">个人资料</h1>

      <section class="card">
        <div class="avatarRow">
          <button type="button" class="avatarBtn" :disabled="uploading" title="点击更换头像"
            @click="$refs.avatarInput.click()">
            <img v-if="form.avatarUrl" class="avatar" :src="form.avatarUrl" alt="avatar" referrerpolicy="no-referrer" />
            <div v-else class="avatar placeholder"><i class="pi pi-user"></i></div>
            <span class="avatarMask">
              <i :class="uploading ? 'pi pi-spin pi-spinner' : 'pi pi-camera'"></i>
            </span>
          </button>
          <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden
            @change="uploadAvatar" />
          <div class="avatarMeta">
            <div class="nick">{{ form.nickname || '未设置昵称' }}</div>
            <div class="sub">{{ profile.email }}
              <Tag v-if="profile.email_verified" value="已验证" severity="success" />
            </div>
          </div>
        </div>

        <div class="infoGrid">
          <template v-if="profile.uuid">
            <span class="chipLabel">UUID：</span><span class="chip">{{ profile.uuid }}</span>
          </template>
          <template v-if="profile.registered_at">
            <span class="chipLabel">注册时间：</span><span class="chip">{{ formatDateTime(profile.registered_at) }}</span>
          </template>
          <template v-if="profile.last_login_at">
            <span class="chipLabel">上次登录：</span><span class="chip">{{ formatDateTime(profile.last_login_at) }}</span>
          </template>
          <template v-if="profile.last_login_ip">
            <span class="chipLabel">登录 IP：</span>
            <span class="ipRow">
              <span v-if="showIp" class="chip">{{ profile.last_login_ip }}</span>
              <button type="button" class="chip chipBtn" @click="showIp = !showIp">
                <i :class="showIp ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                {{ showIp ? '隐藏' : '点击显示' }}
              </button>
            </span>
          </template>
        </div>

        <form class="formGrid" @submit.prevent="saveProfile">
          <label class="field full">
            <span>昵称</span>
            <InputText v-model="form.nickname" maxlength="100" required />
          </label>
          <label class="field full">
            <span>个人简介</span>
            <Textarea v-model="form.bio" rows="3" maxlength="500" autoResize />
          </label>
          <div class="field full">
            <span>邮箱</span>
            <div class="withVisibility withVerify">
              <InputText :modelValue="profile.email" disabled />
              <Select v-model="form.emailVisibility" :options="visibilityOptions" optionLabel="label"
                optionValue="value" />
              <div class="inlineRow verifyCell">
                <Tag v-if="profile.email_verified" value="已验证" severity="success" />
                <template v-else>
                  <Tag value="未验证" severity="warn" />
                  <Button type="button" label="发送验证邮件" size="small" outlined :loading="sendingVerify"
                    @click="sendVerifyEmail" />
                </template>
              </div>
            </div>
          </div>
          <div class="field full">
            <span>性别</span>
            <div class="withVisibility">
              <Select v-model="form.gender" :options="genderOptions" optionLabel="label" optionValue="value" />
              <Select v-model="form.genderVisibility" :options="visibilityOptions" optionLabel="label"
                optionValue="value" />
            </div>
          </div>
          <div class="field full">
            <span>生日</span>
            <div class="withVisibility">
              <DatePicker v-model="form.birthday" dateFormat="yy-mm-dd" :maxDate="today" showIcon
                :manualInput="false" showButtonBar />
              <Select v-model="form.birthdayVisibility" :options="visibilityOptions" optionLabel="label"
                optionValue="value" />
            </div>
          </div>
          <div class="field full">
            <span>国家 / 地区</span>
            <div class="withVisibility">
              <Select v-model="form.country" :options="countryOptions" optionLabel="label" optionValue="value"
                filter showClear placeholder="未设置" />
              <Select v-model="form.countryVisibility" :options="visibilityOptions" optionLabel="label"
                optionValue="value" />
            </div>
          </div>
          <label class="field full">
            <span>语言</span>
            <Select v-model="form.language" :options="languageOptions" optionLabel="label" optionValue="value" />
          </label>
          <div class="actions full">
            <Button type="submit" label="保存资料" icon="pi pi-check" :loading="saving" />
          </div>
        </form>
      </section>

      <section class="card">
        <h2 class="cardTitle"><i class="pi pi-lock"></i> 修改密码</h2>
        <p v-if="!hasPassword" class="hint">当前账号通过第三方登录，没有设置密码。</p>
        <form v-else class="formGrid" @submit.prevent="changePassword">
          <label class="field">
            <span>当前密码</span>
            <Password v-model="pwd.old" :feedback="false" toggleMask fluid autocomplete="current-password" />
          </label>
          <label class="field">
            <span>新密码（至少 6 位）</span>
            <Password v-model="pwd.next" :feedback="false" toggleMask fluid autocomplete="new-password" />
          </label>
          <div class="actions full">
            <Button type="submit" label="修改密码" icon="pi pi-check" :loading="changingPwd"
              :disabled="!pwd.old || pwd.next.length < 6" />
          </div>
        </form>
      </section>

      <section class="card">
        <h2 class="cardTitle"><i class="pi pi-link"></i> 第三方账号绑定</h2>
        <p class="hint">绑定后可使用对应平台直接登录；每个平台只能绑定一个账号。</p>
        <ul class="providerList">
          <li v-for="p in providers" :key="p.key" class="providerItem">
            <i :class="p.icon" class="providerIcon"></i>
            <div class="providerInfo">
              <div class="providerName">{{ p.label }}</div>
              <div class="sub">
                <template v-if="linked(p.key)">
                  {{ linked(p.key).email || linked(p.key).name || '已绑定' }}
                  · {{ formatDate(linked(p.key).linked_at) }}
                </template>
                <template v-else>未绑定</template>
              </div>
            </div>
            <Button v-if="linked(p.key)" label="解绑" severity="danger" outlined size="small"
              :disabled="!canUnlink" :loading="busyProvider === p.key" @click="unlink(p)" />
            <Button v-else label="绑定" size="small" :loading="busyProvider === p.key" @click="startLink(p)" />
          </li>
        </ul>
        <p v-if="!canUnlink && identities.length" class="hint warn">
          这是你唯一的登录方式，请先绑定其他账号后再解绑。
        </p>
      </section>
    </template>
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { GetApi, GetToken } from '@/utils'

const PROVIDERS = [
  { key: 'google', label: 'Google', icon: 'pi pi-google' },
  { key: 'github', label: 'GitHub', icon: 'pi pi-github' },
]

const COUNTRIES = {
  CN: '中国', TW: '中国台湾', HK: '中国香港', MO: '中国澳门', JP: '日本', KR: '韩国',
  US: '美国', CA: '加拿大', GB: '英国', DE: '德国', FR: '法国', AU: '澳大利亚',
  SG: '新加坡', MY: '马来西亚', TH: '泰国', VN: '越南', ID: '印度尼西亚',
  PH: '菲律宾', IN: '印度', RU: '俄罗斯', BR: '巴西',
}

const LANGUAGES = { 'zh-CN': '简体中文', 'zh-TW': '繁體中文', 'en-US': 'English', 'ja-JP': '日本語' }

const GENDERS = [
  { value: 'unknown', label: '不公开' },
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
]

const VISIBILITIES = [
  { value: 'private', label: '仅自己可见' },
  { value: 'public', label: '公开' },
]

const pad = (n) => String(n).padStart(2, '0')
const toDateString = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export default {
  name: 'ProfilePage',
  components: { Button, DatePicker, InputText, Password, Select, Tag, Textarea },
  setup() {
    return { toast: useToast() }
  },
  data() {
    return {
      logined: !!GetToken(),
      saving: false,
      busyProvider: '',
      sendingVerify: false,
      changingPwd: false,
      uploading: false,
      showIp: false,
      pwd: { old: '', next: '' },
      visibilityOptions: VISIBILITIES,
      profile: {},
      identities: [],
      hasPassword: false,
      today: new Date(),
      providers: PROVIDERS,
      genderOptions: GENDERS,
      form: {
        nickname: '',
        avatarUrl: '',
        bio: '',
        gender: 'unknown',
        birthday: null,
        country: null,
        language: 'zh-CN',
        emailVisibility: 'private',
        genderVisibility: 'private',
        birthdayVisibility: 'private',
        countryVisibility: 'private',
      },
    }
  },
  computed: {
    countryOptions() {
      const options = Object.entries(COUNTRIES).map(([value, label]) => ({ value, label: `${label} (${value})` }))
      const current = this.form.country
      if (current && !COUNTRIES[current]) options.push({ value: current, label: current })
      return options
    },
    languageOptions() {
      const options = Object.entries(LANGUAGES).map(([value, label]) => ({ value, label }))
      const current = this.form.language
      if (current && !LANGUAGES[current]) options.push({ value: current, label: current })
      return options
    },
    canUnlink() {
      return this.identities.length + (this.hasPassword ? 1 : 0) > 1
    },
  },
  async mounted() {
    if (!this.logined) return
    await this.consumeLinkCallback()
    await Promise.all([this.loadProfile(), this.loadIdentities()])
  },
  methods: {
    headers() {
      return { Authorization: `Bearer ${GetToken()}` }
    },
    notify(severity, summary, detail) {
      this.toast.add({ severity, summary, detail, life: 3500 })
    },
    errorText(err, fallback) {
      return err.response?.data?.error || fallback
    },
    formatDate(value) {
      if (!value) return ''
      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? '' : toDateString(d)
    },
    formatDateTime(value) {
      if (!value) return ''
      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? '' : `${toDateString(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    },
    linked(provider) {
      return this.identities.find((i) => i.provider === provider)
    },
    async loadProfile() {
      try {
        const res = await axios.get(GetApi('/user/profile'), { headers: this.headers() })
        const p = res.data.profile || {}
        this.profile = p
        this.form = {
          nickname: p.nickname || '',
          avatarUrl: p.avatar_url || '',
          bio: p.bio || '',
          gender: p.gender || 'unknown',
          birthday: p.birthday ? new Date(`${p.birthday.slice(0, 10)}T00:00:00`) : null,
          country: p.country || null,
          language: p.language || 'zh-CN',
          emailVisibility: p.email_visibility || 'private',
          genderVisibility: p.gender_visibility || 'private',
          birthdayVisibility: p.birthday_visibility || 'private',
          countryVisibility: p.country_visibility || 'private',
        }
      } catch (err) {
        if (err.response?.status === 401) this.logined = false
        else this.notify('error', '加载失败', this.errorText(err, '个人资料加载失败'))
      }
    },
    async uploadAvatar(event) {
      const file = event.target.files && event.target.files[0]
      event.target.value = ''
      if (!file) return
      if (file.size > 2 * 1024 * 1024) {
        this.notify('warn', '文件过大', '头像不能超过 2MB')
        return
      }
      this.uploading = true
      try {
        const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
        const base = isLocal ? 'http://localhost:8000' : 'https://api.moelink.site'
        const data = new FormData()
        data.append('avatar', file)
        const res = await axios.post(`${base}/auth/avatar`, data, { headers: this.headers() })
        this.form.avatarUrl = res.data.avatar_url
        this.notify('success', '已更新', '头像已更新')
        window.dispatchEvent(new Event('moelink:profile-updated'))
      } catch (err) {
        this.notify('error', '上传失败', this.errorText(err, '头像上传失败'))
      } finally {
        this.uploading = false
      }
    },
    async saveProfile() {
      this.saving = true
      try {
        const payload = {
          nickname: this.form.nickname,
          bio: this.form.bio,
          gender: this.form.gender,
          language: this.form.language,
          emailVisibility: this.form.emailVisibility,
          genderVisibility: this.form.genderVisibility,
          birthdayVisibility: this.form.birthdayVisibility,
          countryVisibility: this.form.countryVisibility,
        }
        if (this.form.country) payload.country = this.form.country
        if (this.form.birthday) payload.birthday = toDateString(this.form.birthday)
        await axios.post(GetApi('/user/profile'), payload, { headers: this.headers() })
        this.notify('success', '已保存', '个人资料已更新')
        window.dispatchEvent(new Event('moelink:profile-updated'))
        await this.loadProfile()
      } catch (err) {
        this.notify('error', '保存失败', this.errorText(err, '个人资料保存失败'))
      } finally {
        this.saving = false
      }
    },
    async sendVerifyEmail() {
      this.sendingVerify = true
      try {
        await axios.post(GetApi('/user/verify-email'), {}, { headers: this.headers() })
        this.notify('success', '已发送', '验证邮件已发送至你的邮箱')
      } catch (err) {
        this.notify('error', '发送失败', this.errorText(err, '验证邮件发送失败'))
      } finally {
        this.sendingVerify = false
      }
    },
    async changePassword() {
      this.changingPwd = true
      try {
        await axios.post(
          GetApi('/user/password'),
          { oldPassword: this.pwd.old, newPassword: this.pwd.next },
          { headers: this.headers() },
        )
        this.pwd = { old: '', next: '' }
        this.notify('success', '已修改', '密码修改成功')
      } catch (err) {
        this.notify('error', '修改失败', this.errorText(err, '密码修改失败，请检查当前密码'))
      } finally {
        this.changingPwd = false
      }
    },
    async loadIdentities() {
      try {
        const res = await axios.get(GetApi('/user/identities'), { headers: this.headers() })
        this.identities = res.data.identities || []
        this.hasPassword = !!res.data.has_password
      } catch (err) {
        this.notify('error', '加载失败', this.errorText(err, '绑定信息加载失败'))
      }
    },
    startLink(provider) {
      const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
      const base = isLocal ? 'http://localhost:8000' : 'https://api.moelink.site'
      const returnTo = window.location.origin + '/profile'
      this.busyProvider = provider.key
      window.location.assign(
        `${base}/auth/oauth/${provider.key}?mode=link&return_to=${encodeURIComponent(returnTo)}`,
      )
    },
    // 第三方授权完成后，后端把一次性的 link_token 放在 URL hash 中带回
    async consumeLinkCallback() {
      const params = new URLSearchParams(window.location.hash.slice(1))
      const linkToken = params.get('oauth_link_token')
      if (!linkToken) return
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search)
      try {
        await axios.post(GetApi('/user/identities/link'), { link_token: linkToken }, { headers: this.headers() })
        this.notify('success', '绑定成功', `已绑定 ${params.get('oauth_provider') || '第三方'} 账号`)
      } catch (err) {
        this.notify('error', '绑定失败', this.errorText(err, '绑定失败，请重试'))
      }
    },
    async unlink(provider) {
      if (!window.confirm(`确定解绑 ${provider.label} 账号吗？`)) return
      this.busyProvider = provider.key
      try {
        await axios.delete(GetApi(`/user/identities/${provider.key}`), { headers: this.headers() })
        this.notify('success', '已解绑', `${provider.label} 账号已解绑`)
        await this.loadIdentities()
      } catch (err) {
        this.notify('error', '解绑失败', this.errorText(err, '解绑失败'))
      } finally {
        this.busyProvider = ''
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.profilePage {
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 20px 60px;
}

.pageTitle {
  margin: 0 0 16px;
  font-size: 26px;
  color: #2c3e77;
}

.loginPrompt {
  text-align: center;
  padding: 60px 0;
  color: #667;

  i {
    font-size: 40px;
    color: #7b8cc7;
  }
}

.card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(44, 62, 119, 0.08);
}

.cardTitle {
  margin: 0 0 6px;
  font-size: 18px;
  color: #2c3e77;
}

.hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #889;

  &.warn {
    margin: 10px 0 0;
    color: #c0392b;
  }
}

.avatarRow {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.avatarBtn {
  position: relative;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  overflow: hidden;

  &:disabled {
    cursor: progress;
  }

  &:hover .avatarMask,
  &:focus-visible .avatarMask,
  &:disabled .avatarMask {
    opacity: 1;
  }
}

.avatarMask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(20, 30, 70, 0.5);
  color: #fff;
  font-size: 22px;
  opacity: 0;
  transition: opacity 0.15s;
}

.infoGrid {
  display: grid;
  grid-template-columns: max-content max-content;
  align-items: center;
  justify-content: start;
  gap: 6px 4px;
  margin-bottom: 20px;
}

.ipRow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chipBtn {
  border: 0;
  font-family: inherit;
  cursor: pointer;

  &:hover {
    background: #dfe5f8;
  }
}

.chipLabel {
  font-size: 12px;
  color: #889;
  justify-self: end;
}

.chip {
  padding: 2px 10px;
  border-radius: 3px;
  background: #eef1fb;
  color: #4a5a99;
  font-size: 12px;
  line-height: 20px;
  word-break: break-all;
  justify-self: start;
}

.avatar {
  display: block;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  background: #eef1fb;

  &.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    color: #7b8cc7;
  }
}

.nick {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e77;
}

.sub {
  font-size: 13px;
  color: #889;
  margin-top: 2px;
}

.formGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #556;

  &.full {
    grid-column: 1 / -1;
  }
}

.actions.full {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
}

.withVisibility {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 130px;
  align-items: center;
  gap: 8px;

  &.withVerify {
    grid-template-columns: minmax(0, 1fr) 130px auto;
  }

  .verifyCell {
    white-space: nowrap;
  }
}

.inlineRow {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
}

.providerList {
  list-style: none;
  margin: 0;
  padding: 0;
}

.providerItem {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-top: 1px solid #eef0f7;

  &:first-child {
    border-top: 0;
  }
}

.providerIcon {
  font-size: 24px;
  color: #2c3e77;
}

.providerInfo {
  flex: 1;
  min-width: 0;
}

.providerName {
  font-weight: 600;
  color: #2c3e77;
}

@media (max-width: 640px) {
  .formGrid {
    grid-template-columns: 1fr;
  }
}
</style>
