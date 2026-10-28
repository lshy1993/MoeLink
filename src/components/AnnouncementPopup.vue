<template>
  <transition name="annFade">
    <div v-if="visible && announcement" class="annOverlay" @click.self="close">
      <div class="annBox" :class="announcement.kind" role="dialog" aria-modal="true">
        <button class="annClose" aria-label="关闭" @click="close">
          <i class="pi pi-times"></i>
        </button>
        <img
          v-if="announcement.kind === 'image'"
          class="annImg"
          :src="imageUrl"
          :alt="announcement.title || '公告'"
          draggable="false"
        />
        <div v-else class="annText">
          <h3 v-if="announcement.title" class="annTitle">{{ announcement.title }}</h3>
          <div v-if="announcement.content" class="annBody">{{ announcement.content }}</div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { GetApi } from '@/utils'

export default {
  name: 'AnnouncementPopup',
  props: {
    announcement: { type: Object, default: null },
    visible: { type: Boolean, default: false },
    // 后台预览时传入本地 blob/data URL，覆盖公开图片地址
    imageSrc: { type: String, default: '' },
  },
  emits: ['close'],
  computed: {
    imageUrl() {
      return this.imageSrc || GetApi(`/announcement/${this.announcement.id}/image`)
    },
  },
  watch: {
    visible(v) {
      if (v) document.addEventListener('keydown', this.onKey)
      else document.removeEventListener('keydown', this.onKey)
    },
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKey)
  },
  methods: {
    close() {
      this.$emit('close')
    },
    onKey(e) {
      if (e.key === 'Escape') this.close()
    },
  },
}
</script>

<style lang="scss" scoped>
.annOverlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(10, 14, 30, 0.6);
}

.annBox {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  display: flex;
}

.annClose {
  position: absolute;
  top: -12px;
  right: -12px;
  z-index: 1;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #fff;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

// 图片按视口等比缩放：既不超宽也不超高，小图保持原尺寸
.annImg {
  display: block;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.45);
  user-select: none;
}

.annText {
  width: min(520px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 24px 26px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
}

.annTitle {
  margin: 0 0 12px;
  font-size: 18px;
  color: #222;
  word-break: break-word;
}

.annBody {
  font-size: 14px;
  line-height: 1.8;
  color: #444;
  white-space: pre-wrap;
  word-break: break-word;
}

.annFade-enter-active,
.annFade-leave-active {
  transition: opacity 0.2s;
}

.annFade-enter-from,
.annFade-leave-to {
  opacity: 0;
}
</style>
