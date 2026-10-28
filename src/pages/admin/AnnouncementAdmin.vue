<template>
  <div class="annAdminPage">
    <h2>全局公告</h2>
    <p class="hint">
      用户进入前台时会自动弹出当前生效的公告（每位用户每条仅弹一次），通知铃铛第一行始终置顶该公告。
      多条公告同时生效时，只展示最新发布的一条，其余归入历史。
    </p>

    <section class="editor">
      <h3>{{ form.id ? `编辑公告 #${form.id}` : '新建公告' }}</h3>
      <div class="formGrid">
        <label>类型</label>
        <div class="radios">
          <label><input v-model="form.kind" type="radio" value="text" :disabled="!!form.id" /> 纯文字</label>
          <label><input v-model="form.kind" type="radio" value="image" :disabled="!!form.id" /> 纯图片</label>
        </div>

        <label>{{ form.kind === 'image' ? '备注名（仅后台可见）' : '标题' }}</label>
        <InputText v-model="form.title" maxlength="200" fluid />

        <template v-if="form.kind === 'text'">
          <label>正文</label>
          <Textarea v-model="form.content" rows="6" maxlength="5000" fluid />
        </template>
        <template v-else>
          <label>图片</label>
          <div>
            <input ref="file" type="file" accept="image/png,image/jpeg,image/gif,image/webp" @change="onFile" />
            <div class="dim">PNG / JPEG / GIF / WebP，不超过 3MB{{ form.id ? '；不选择则保留原图' : '' }}</div>
            <img v-if="form.imagePreview" :src="form.imagePreview" class="thumb" alt="预览" />
          </div>
        </template>

        <label>发布方式</label>
        <div class="radios">
          <template v-if="!form.id || form.status === 'scheduled'">
            <label><input v-model="form.mode" type="radio" value="now" /> 立即发布</label>
            <label><input v-model="form.mode" type="radio" value="schedule" /> 定时发布</label>
            <input v-if="form.mode === 'schedule'" v-model="form.publishAt" type="datetime-local" class="dt" />
          </template>
          <span v-else class="dim">已发布，发布时间不可修改</span>
        </div>
      </div>
      <div class="actions">
        <Button :label="form.id ? '保存修改' : (form.mode === 'now' ? '立即发布' : '创建定时公告')" icon="pi pi-check" :loading="saving" @click="save" />
        <Button label="预览" icon="pi pi-eye" severity="secondary" outlined @click="previewForm" />
        <Button v-if="form.id" label="取消编辑" severity="secondary" text @click="resetForm" />
      </div>
    </section>

    <div class="toolbar">
      <button
        v-for="t in tabs"
        :key="t.value"
        class="tab"
        :class="{ active: filter === t.value }"
        @click="setFilter(t.value)"
      >
        {{ t.label }}<span v-if="count(t.value) !== null" class="cnt">{{ count(t.value) }}</span>
      </button>
      <span class="spacer"></span>
      <Button label="刷新" icon="pi pi-refresh" size="small" severity="secondary" outlined @click="load" />
    </div>

    <DataTable :value="rows" :loading="loading" dataKey="id" class="annTable">
      <Column field="id" header="ID" style="width: 56px" />
      <Column header="类型" style="width: 70px">
        <template #body="{ data }">{{ data.kind === 'image' ? '图片' : '文字' }}</template>
      </Column>
      <Column header="内容" style="min-width: 240px">
        <template #body="{ data }">
          <div class="cellTitle">{{ data.title || (data.kind === 'image' ? '（图片）' : '') }}</div>
          <div v-if="data.content" class="cellBody">{{ data.content }}</div>
        </template>
      </Column>
      <Column header="状态" style="width: 90px">
        <template #body="{ data }">
          <Tag :value="statusMeta(data.status).label" :severity="statusMeta(data.status).severity" />
        </template>
      </Column>
      <Column header="发布时间" style="width: 160px">
        <template #body="{ data }">{{ fmt(data.publish_at) }}</template>
      </Column>
      <Column header="操作" style="width: 300px">
        <template #body="{ data }">
          <div class="rowActions">
            <Button label="预览" icon="pi pi-eye" size="small" severity="secondary" text @click="previewRow(data)" />
            <Button v-if="data.status !== 'withdrawn'" label="编辑" icon="pi pi-pencil" size="small" severity="secondary" text @click="edit(data)" />
            <Button v-if="data.status === 'published' || data.status === 'scheduled'" :label="data.status === 'scheduled' ? '取消发布' : '撤回'" icon="pi pi-ban" size="small" severity="warn" text @click="withdraw(data)" />
            <Button label="删除" icon="pi pi-trash" size="small" severity="danger" text @click="remove(data)" />
          </div>
        </template>
      </Column>
      <template #empty>暂无公告</template>
    </DataTable>

    <announcement-popup :announcement="preview" :visible="!!preview" :image-src="previewImage" @close="closePreview" />
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import AnnouncementPopup from '@/components/AnnouncementPopup.vue'
import { GetApi, GetToken } from '@/utils'

const MAX_IMAGE = 3 * 1024 * 1024
const STATUS = {
  published: { label: '已发布', severity: 'success' },
  scheduled: { label: '定时中', severity: 'info' },
  history: { label: '历史', severity: 'secondary' },
  withdrawn: { label: '已撤回', severity: 'warn' },
}

const emptyForm = () => ({
  id: null,
  status: null,
  kind: 'text',
  title: '',
  content: '',
  mode: 'now',
  publishAt: '',
  imageData: '',
  imagePreview: '',
})

export default {
  name: 'AdminAnnouncements',
  components: { Button, Column, DataTable, InputText, Tag, Textarea, AnnouncementPopup },
  setup() {
    return { toast: useToast(), confirmService: useConfirm() }
  },
  data() {
    return {
      rows: [],
      counts: {},
      filter: '',
      loading: false,
      saving: false,
      form: emptyForm(),
      preview: null,
      previewImage: '',
      tabs: [
        { label: '全部', value: '' },
        { label: '已发布', value: 'published' },
        { label: '定时中', value: 'scheduled' },
        { label: '历史', value: 'history' },
        { label: '已撤回', value: 'withdrawn' },
      ],
    }
  },
  mounted() {
    this.load()
  },
  beforeUnmount() {
    this.revoke()
  },
  methods: {
    headers() {
      return { Authorization: `Bearer ${GetToken()}` }
    },
    statusMeta(s) {
      return STATUS[s] || { label: s, severity: 'secondary' }
    },
    fmt(d) {
      return d ? new Date(d).toLocaleString('zh-CN', { hour12: false }) : '—'
    },
    count(v) {
      if (v === '') return Object.values(this.counts).reduce((a, b) => a + b, 0)
      return this.counts[v] ?? 0
    },
    errMsg(err, fallback) {
      return err.response?.data?.error || fallback
    },
    setFilter(v) {
      this.filter = v
      this.load()
    },
    async load() {
      this.loading = true
      try {
        const res = await axios.get(GetApi('/announcement/admin/list'), {
          headers: this.headers(),
          params: { status: this.filter || undefined, limit: 200 },
        })
        this.rows = res.data.announcements || []
        this.counts = res.data.counts || {}
      } catch (err) {
        this.toast.add({ severity: 'error', summary: '加载失败', detail: this.errMsg(err, '公告列表加载失败'), life: 3000 })
      }
      this.loading = false
    },
    onFile(e) {
      const f = e.target.files?.[0]
      if (!f) return
      if (f.size > MAX_IMAGE) {
        this.toast.add({ severity: 'warn', summary: '图片过大', detail: '图片不能超过 3MB', life: 3000 })
        e.target.value = ''
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        this.form.imageData = reader.result
        this.form.imagePreview = reader.result
      }
      reader.readAsDataURL(f)
    },
    // datetime-local 取值是本地时间，转成 ISO 以免时区错位
    publishAtISO() {
      if (this.form.mode !== 'schedule') return null
      const d = new Date(this.form.publishAt)
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
    },
    async save() {
      const f = this.form
      const publish_at = this.publishAtISO()
      if (publish_at === undefined) {
        this.toast.add({ severity: 'warn', summary: '请选择发布时间', life: 2500 })
        return
      }
      if (f.mode === 'schedule' && new Date(publish_at) <= new Date()) {
        this.toast.add({ severity: 'warn', summary: '定时发布时间必须在未来', life: 2500 })
        return
      }
      if (!f.id && f.kind === 'image' && !f.imageData) {
        this.toast.add({ severity: 'warn', summary: '请选择图片', life: 2500 })
        return
      }
      const payload = { title: f.title }
      if (f.kind === 'text') payload.content = f.content
      if (f.imageData) payload.image_base64 = f.imageData
      if (!f.id || f.status === 'scheduled') payload.publish_at = publish_at
      this.saving = true
      try {
        if (f.id) {
          await axios.put(GetApi(`/announcement/admin/${f.id}`), payload, { headers: this.headers() })
        } else {
          await axios.post(GetApi('/announcement/admin'), { ...payload, kind: f.kind }, { headers: this.headers() })
        }
        this.toast.add({ severity: 'success', summary: f.id ? '已保存' : '已创建', life: 2000 })
        this.resetForm()
        this.load()
      } catch (err) {
        this.toast.add({ severity: 'error', summary: '保存失败', detail: this.errMsg(err, '保存失败'), life: 3500 })
      }
      this.saving = false
    },
    async edit(row) {
      this.form = {
        ...emptyForm(),
        id: row.id,
        status: row.status,
        kind: row.kind,
        title: row.title,
        content: row.content || '',
        mode: row.status === 'scheduled' ? 'schedule' : 'now',
        publishAt: row.status === 'scheduled' ? this.toLocalInput(row.publish_at) : '',
      }
      if (row.kind === 'image') this.form.imagePreview = await this.fetchImage(row.id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    toLocalInput(iso) {
      const d = new Date(iso)
      const p = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
    },
    resetForm() {
      this.form = emptyForm()
      if (this.$refs.file) this.$refs.file.value = ''
    },
    // 后台图片需要鉴权，不能直接当 <img src>，改为取 blob
    async fetchImage(id) {
      try {
        const res = await axios.get(GetApi(`/announcement/admin/${id}/image`), { headers: this.headers(), responseType: 'blob' })
        return URL.createObjectURL(res.data)
      } catch (_err) {
        return ''
      }
    },
    async previewRow(row) {
      this.revoke()
      this.previewImage = row.kind === 'image' ? await this.fetchImage(row.id) : ''
      this.preview = { id: row.id, kind: row.kind, title: row.title, content: row.content }
    },
    previewForm() {
      const f = this.form
      if (f.kind === 'image' && !f.imagePreview) {
        this.toast.add({ severity: 'warn', summary: '请先选择图片', life: 2000 })
        return
      }
      this.revoke()
      this.previewImage = f.kind === 'image' ? f.imagePreview : ''
      this.preview = { id: f.id || 0, kind: f.kind, title: f.title, content: f.content }
    },
    closePreview() {
      this.preview = null
      this.revoke()
    },
    revoke() {
      if (this.previewImage.startsWith('blob:')) URL.revokeObjectURL(this.previewImage)
      this.previewImage = ''
    },
    withdraw(row) {
      this.confirmService.require({
        message: row.status === 'scheduled' ? `确认取消定时公告 #${row.id}？` : `确认撤回公告 #${row.id}？撤回后前台立即不再展示。`,
        header: row.status === 'scheduled' ? '取消发布' : '撤回公告',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: '确认',
        rejectLabel: '取消',
        accept: async () => {
          try {
            await axios.post(GetApi(`/announcement/admin/${row.id}/withdraw`), {}, { headers: this.headers() })
            this.toast.add({ severity: 'success', summary: '已撤回', life: 2000 })
            this.load()
          } catch (err) {
            this.toast.add({ severity: 'error', summary: '操作失败', detail: this.errMsg(err, '操作失败'), life: 3000 })
          }
        },
      })
    },
    remove(row) {
      this.confirmService.require({
        message: `确认永久删除公告 #${row.id}？`,
        header: '删除公告',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: '删除',
        rejectLabel: '取消',
        accept: async () => {
          try {
            await axios.delete(GetApi(`/announcement/admin/${row.id}`), { headers: this.headers() })
            if (this.form.id === row.id) this.resetForm()
            this.toast.add({ severity: 'success', summary: '已删除', life: 2000 })
            this.load()
          } catch (err) {
            this.toast.add({ severity: 'error', summary: '删除失败', detail: this.errMsg(err, '删除失败'), life: 3000 })
          }
        },
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.annAdminPage {
  max-width: 1100px;

  h2 { margin: 0 0 6px; }
  .hint { margin: 0 0 18px; color: #8892b8; font-size: 13px; }
}

.editor {
  background: #fff;
  border: 1px solid #e6e9f5;
  border-radius: 10px;
  padding: 16px 18px;
  margin-bottom: 20px;

  h3 { margin: 0 0 12px; font-size: 15px; }
}

.formGrid {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 12px 14px;
  align-items: start;

  > label { padding-top: 8px; color: #555; font-size: 13px; }
}

.radios {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding-top: 6px;

  label { font-size: 13px; }
}

.dt { padding: 4px 8px; border: 1px solid #ccd3ea; border-radius: 6px; }
.dim { color: #9aa2c5; font-size: 12px; margin-top: 4px; }
.thumb { display: block; max-width: 240px; max-height: 160px; margin-top: 8px; border-radius: 6px; border: 1px solid #e6e9f5; }
.actions { display: flex; gap: 8px; margin-top: 16px; }

.toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;

  .spacer { flex: 1; }
}

.tab {
  padding: 5px 12px;
  border: 1px solid #e6e9f5;
  border-radius: 16px;
  background: #fff;
  color: #555;
  cursor: pointer;
  font-size: 13px;

  &.active { background: #2c53c9; border-color: #2c53c9; color: #fff; }
  .cnt { margin-left: 6px; opacity: 0.7; }
}

.cellTitle { font-weight: 600; word-break: break-word; }
.cellBody { color: #8892b8; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 360px; }
.rowActions { display: flex; flex-wrap: wrap; gap: 2px; }

@media (max-width: 720px) {
  .formGrid { grid-template-columns: 1fr; }
}
</style>
