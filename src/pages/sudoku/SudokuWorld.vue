<template>
    <div class="sudokuPage">
        <div class="sudokuBar">
            <div class="titleBlock">
                <h1>数独世界</h1>
                <span>所有玩家共享同一张巨大谱面 · 完成后永久锁定</span>
            </div>
            <div class="barStats">
                <span class="live" :class="{ on: streamOnline }"></span>
                <span>在线 {{ online }}</span>
                <span class="coord">区块 {{ centerCx }}, {{ centerCy }}</span>
                <button class="barBtn jumpBtn" @click="openJump">
                    <i class="pi pi-map-marker"></i>
                    跳转区块
                </button>
                <div class="zoomControls">
                    <button class="zoomBtn" title="缩小" @click="zoomBy(-0.2)">−</button>
                    <span class="zoomValue">{{ zoomPercent }}%</span>
                    <button class="zoomBtn" title="放大" @click="zoomBy(0.2)">+</button>
                    <button class="barBtn" @click="resetView">重置视角</button>
                </div>
                <button class="barBtn" @click="goHome">回到原点</button>
            </div>

            <div v-if="jumpOpen" class="jumpPanel" @keyup.esc="jumpOpen = false">
                <div class="jumpTitle">跳转到区块</div>
                <div class="jumpRow">
                    <label>
                        X
                        <input
                            ref="jumpXInput"
                            v-model="jumpX"
                            type="number"
                            :min="-RADIUS"
                            :max="RADIUS"
                            @keyup.enter="doJump"
                        />
                    </label>
                    <label>
                        Y
                        <input
                            v-model="jumpY"
                            type="number"
                            :min="-RADIUS"
                            :max="RADIUS"
                            @keyup.enter="doJump"
                        />
                    </label>
                </div>
                <div class="jumpHint">坐标范围 -{{ RADIUS }} ~ {{ RADIUS }}</div>
                <div class="jumpActions">
                    <button class="jumpConfirm" @click="doJump">跳转</button>
                    <button class="jumpCancel" @click="jumpOpen = false">取消</button>
                </div>
            </div>
        </div>

        <div class="hint">
            点击空格后用键盘 1-9 或右下角键盘填写，0 / Backspace 清除。
            滚轮缩放；中键或空格 + 左键拖拽地图，直接拖拽棋盘/空白也可以平移（移动超过 5px 才会进入拖拽）。
            区块左上角显示正在做的玩家；绿色题目已被完成，悬停可看解题者和时间。
        </div>

        <div
            ref="viewport"
            class="viewport"
            :class="{ panning: isPanning, panMode: spaceHeld }"
            @scroll="onScroll"
            @wheel="onWheel"
            @mousedown.middle.prevent
            @pointerdown="onPointerDown"
            @click.capture="onClickCapture"
        >
            <div
                class="world"
                :style="{ width: WORLD_W * zoom + 'px', height: WORLD_H * zoom + 'px' }"
            >
                <div
                    class="worldInner"
                    :style="{
                        width: WORLD_W + 'px',
                        height: WORLD_H + 'px',
                        transform: `scale(${zoom})`,
                    }"
                >
                    <section
                        v-for="chunk in loadedChunks"
                        :key="chunk.cx + ',' + chunk.cy"
                        class="chunk"
                        :style="chunkStyle(chunk)"
                    >
                        <div
                            v-if="chunkUsers(chunk).length"
                            class="chunkPresence"
                            :title="chunkUsers(chunk).join('、')"
                        >
                            <i class="pi pi-user"></i>
                            <span>{{ chunkUsers(chunk).slice(0, 2).join('、') }}</span>
                            <span v-if="chunkUsers(chunk).length > 2">
                                +{{ chunkUsers(chunk).length - 2 }}
                            </span>
                        </div>
                        <div class="chunkGrid">
                            <SudokuPuzzle
                                v-for="p in chunk.puzzles"
                                :key="p.id"
                                :puzzle="p"
                                :selected-cell="selectedCellFor(p)"
                                :show-digits="showDigits"
                                @select="selectCell(p, $event)"
                            />
                        </div>
                    </section>
                </div>
            </div>
        </div>

        <div v-if="selectedPuzzle" class="numberPad">
            <div class="padHead">
                <b>#{{ selectedPuzzle.id }}</b>
                <span v-if="selectedPuzzle.status === 1" class="padSolved">
                    <i class="pi pi-check-circle"></i>
                    已由 {{ selectedPuzzle.solvedByName || '玩家' }} 完成
                    <template v-if="selectedPuzzle.solvedAt">
                        · {{ formatTime(selectedPuzzle.solvedAt) }}
                    </template>
                </span>
                <span v-else-if="selectedPuzzle.puzzle[selected.cell] !== '0'" class="padMuted">
                    题目给定数字不可修改
                </span>
                <span v-else-if="!canWrite" class="padMuted">登录后可填写</span>
                <span v-else class="padMuted">选择数字</span>
                <button class="padClose" @click="selected = null" aria-label="关闭">×</button>
            </div>
            <div class="padRow">
                <button
                    v-for="n in 9"
                    :key="n"
                    :disabled="!writableSelected"
                    @click="fill(n)"
                >
                    {{ n }}
                </button>
                <button class="erase" :disabled="!writableSelected" @click="fill(0)">清除</button>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import SudokuPuzzle from '@/components/sudoku/SudokuPuzzle.vue';
import { GetApi, GetToken } from '@/utils';

const CHUNK_SIZE = 4;
const RADIUS = 12;
const CARD_W = 356;
const CARD_H = 356;
// 棋盘之间完全无间隙：chunk 直接由 4x4 个棋盘拼成，chunk 之间也不留空。
const CHUNK_W = CHUNK_SIZE * CARD_W;
const CHUNK_H = CHUNK_SIZE * CARD_H;
const STRIDE_X = CHUNK_W;
const STRIDE_Y = CHUNK_H;
const WORLD_W = STRIDE_X * (RADIUS * 2 + 1);
const WORLD_H = STRIDE_Y * (RADIUS * 2 + 1);

export default {
    name: 'SudokuWorld',
    components: { SudokuPuzzle },
    props: {
        user: { type: Object, default: () => ({ logined: false, userinfo: {} }) },
    },
    setup() {
        return { toast: useToast() };
    },
    data() {
        return {
            RADIUS,
            CHUNK_W,
            CHUNK_H,
            STRIDE_X,
            STRIDE_Y,
            WORLD_W,
            WORLD_H,
            jumpOpen: false,
            jumpX: 0,
            jumpY: 0,
            chunks: {},
            loading: {},
            selected: null,
            online: 0,
            presenceUsers: [],
            lastPresenceKey: '',
            lastPresenceAt: 0,
            presenceTimer: null,
            streamOnline: false,
            centerCx: 0,
            centerCy: 0,
            stream: null,
            pollTimer: null,
            scrollRaf: 0,
            zoomRaf: 0,
            pendingZoom: null,
            pendingAnchor: null,
            zoom: 1,
            MIN_ZOOM: 0.35,
            MAX_ZOOM: 2.5,
            pan: null,
            isPanning: false,
            spaceHeld: false,
            suppressClick: false,
            localProgress: {},
            submitting: {},
            lastFocus: null,
        };
    },
    computed: {
        loadedChunks() {
            return Object.values(this.chunks);
        },
        zoomPercent() {
            return Math.round(this.zoom * 100);
        },
        showDigits() {
            return this.zoom >= 0.6;
        },
        presenceByChunk() {
            const map = {};
            for (const user of this.presenceUsers) {
                const key = `${user.cx},${user.cy}`;
                (map[key] ||= []).push(user.name);
            }
            return map;
        },
        selectedPuzzle() {
            if (!this.selected) return null;
            return this.findPuzzle(this.selected.puzzleId);
        },
        canWrite() {
            return !!(this.user && this.user.logined);
        },
        userKey() {
            const info = (this.user && this.user.userinfo) || {};
            if (!info.uid && !info.email) return null;
            return String(info.uid || info.email);
        },
        writableSelected() {
            const p = this.selectedPuzzle;
            if (!p || !this.selected || !this.canWrite) return false;
            return p.status !== 1 && p.puzzle[this.selected.cell] === '0';
        },
    },
    watch: {
        canWrite(value) {
            if (value) {
                this.loadLocalProgress();
                this.loadFocus();
                this.sendPresence(true);
            } else {
                this.localProgress = {};
                this.loadFocus();
                this.leavePresence();
            }
            // 登录/登出后重新拉取区块，切换“我的进度”和公共题面。
            for (const chunk of Object.values(this.chunks)) {
                this.refreshChunk(chunk.cx, chunk.cy);
            }
        },
    },
    mounted() {
        this.$nextTick(() => {
            this.loadLocalProgress();
            this.loadFocus();
            this.goHome();
            this.loadVisible();
            this.sendPresence(true);
        });
        this.connectStream();
        this.fetchPresence();
        this.pollTimer = setInterval(() => this.refreshCenter(), 30000);
        this.presenceTimer = setInterval(() => this.sendPresence(true), 20000);
        window.addEventListener('keydown', this.onKeydown);
        window.addEventListener('keyup', this.onKeyup);
        window.addEventListener('blur', this.onWindowBlur);
        window.addEventListener('resize', this.onResize);
    },
    beforeUnmount() {
        if (this.stream) this.stream.close();
        if (this.pollTimer) clearInterval(this.pollTimer);
        if (this.presenceTimer) clearInterval(this.presenceTimer);
        cancelAnimationFrame(this.scrollRaf);
        cancelAnimationFrame(this.zoomRaf);
        this.leavePresence();
        this.saveLocalProgress();
        this.removePointerListeners();
        window.removeEventListener('keydown', this.onKeydown);
        window.removeEventListener('keyup', this.onKeyup);
        window.removeEventListener('blur', this.onWindowBlur);
        window.removeEventListener('resize', this.onResize);
    },
    methods: {
        key(cx, cy) {
            return `${cx},${cy}`;
        },
        chunkStyle(chunk) {
            return {
                width: `${CHUNK_W}px`,
                height: `${CHUNK_H}px`,
                left: `${(chunk.cx + RADIUS) * STRIDE_X}px`,
                top: `${(chunk.cy + RADIUS) * STRIDE_Y}px`,
            };
        },
        selectedCellFor(puzzle) {
            if (!this.selected || this.selected.puzzleId !== puzzle.id) return null;
            return this.selected.cell;
        },
        chunkUsers(chunk) {
            return this.presenceByChunk[`${chunk.cx},${chunk.cy}`] || [];
        },
        fetchPresence() {
            axios
                .get(GetApi('/sudoku/presence'))
                .then((res) => {
                    this.presenceUsers = (res.data && res.data.users) || [];
                })
                .catch(() => {});
        },
        sendPresence(force = false) {
            if (!this.canWrite) return;
            const token = GetToken();
            if (!token) return;

            const p = this.selectedPuzzle;
            const cx = p ? p.cx : this.centerCx;
            const cy = p ? p.cy : this.centerCy;
            const puzzleId = p ? p.id : null;
            const key = `${cx},${cy},${puzzleId}`;
            const now = Date.now();
            if (!force && key === this.lastPresenceKey && now - this.lastPresenceAt < 5000) {
                return;
            }
            this.lastPresenceKey = key;
            this.lastPresenceAt = now;

            axios
                .post(
                    GetApi('/sudoku/presence'),
                    { cx, cy, puzzleId },
                    { headers: { Authorization: `Bearer ${token}` } },
                )
                .catch(() => {});
        },
        leavePresence() {
            const token = GetToken();
            if (!token) return;
            fetch(GetApi('/sudoku/presence'), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
                keepalive: true,
            }).catch(() => {});
        },
        findPuzzle(id) {
            for (const chunk of Object.values(this.chunks)) {
                const found = chunk.puzzles.find((p) => p.id === id);
                if (found) return found;
            }
            return null;
        },
        loadChunk(cx, cy) {
            const k = this.key(cx, cy);
            if (this.chunks[k] || this.loading[k]) return;
            this.loading[k] = true;
            axios
                .get(GetApi(`/sudoku/chunk?cx=${cx}&cy=${cy}`))
                .then((res) => {
                    this.chunks[k] = {
                        cx: res.data.cx,
                        cy: res.data.cy,
                        puzzles: res.data.puzzles,
                    };
                    this.applyLocalProgress(this.chunks[k].puzzles);
                })
                .catch((err) => {
                    console.error('[sudoku] 加载区块失败', cx, cy, err.message);
                })
                .finally(() => {
                    delete this.loading[k];
                });
        },
        loadVisible() {
            const vp = this.$refs.viewport;
            if (!vp) return;
            const z = this.zoom;
            const left = vp.scrollLeft / z;
            const top = vp.scrollTop / z;
            const width = vp.clientWidth / z;
            const height = vp.clientHeight / z;

            const x0 = Math.floor(left / STRIDE_X) - RADIUS;
            const x1 = Math.floor((left + width) / STRIDE_X) - RADIUS;
            const y0 = Math.floor(top / STRIDE_Y) - RADIUS;
            const y1 = Math.floor((top + height) / STRIDE_Y) - RADIUS;

            for (let cx = x0; cx <= x1; cx++) {
                for (let cy = y0; cy <= y1; cy++) {
                    this.loadChunk(cx, cy);
                }
            }
            this.prune(x0, x1, y0, y1);
        },
        prune(x0, x1, y0, y1) {
            for (const [k, chunk] of Object.entries(this.chunks)) {
                if (
                    chunk.cx < x0 - 3 ||
                    chunk.cx > x1 + 3 ||
                    chunk.cy < y0 - 3 ||
                    chunk.cy > y1 + 3
                ) {
                    delete this.chunks[k];
                    if (this.selected && this.selected.puzzleId) {
                        const p = this.findPuzzle(this.selected.puzzleId);
                        if (!p) this.selected = null;
                    }
                }
            }
        },
        updateCenter() {
            const vp = this.$refs.viewport;
            if (!vp) return;
            const z = this.zoom;
            this.centerCx =
                Math.floor((vp.scrollLeft / z + vp.clientWidth / z / 2) / STRIDE_X) - RADIUS;
            this.centerCy =
                Math.floor((vp.scrollTop / z + vp.clientHeight / z / 2) / STRIDE_Y) - RADIUS;
            this.sendPresence();
        },
        onScroll() {
            cancelAnimationFrame(this.scrollRaf);
            this.scrollRaf = requestAnimationFrame(() => {
                this.updateCenter();
                this.loadVisible();
            });
        },
        onResize() {
            this.updateCenter();
            this.loadVisible();
        },
        goHome() {
            const vp = this.$refs.viewport;
            if (!vp) return;
            const z = this.zoom;
            const visibleW = vp.clientWidth / z;
            const visibleH = vp.clientHeight / z;
            vp.scrollLeft = Math.max(0, (RADIUS * STRIDE_X - (visibleW - CHUNK_W) / 2) * z);
            vp.scrollTop = Math.max(0, (RADIUS * STRIDE_Y - (visibleH - CHUNK_H) / 2) * z);
            this.updateCenter();
            this.loadVisible();
        },
        setZoomAt(nextZoom, clientX, clientY) {
            const vp = this.$refs.viewport;
            if (!vp) return;
            const z = Math.min(this.MAX_ZOOM, Math.max(this.MIN_ZOOM, nextZoom));
            if (Math.abs(z - this.zoom) < 0.001) return;

            const rect = vp.getBoundingClientRect();
            const offsetX = clientX == null ? vp.clientWidth / 2 : clientX - rect.left;
            const offsetY = clientY == null ? vp.clientHeight / 2 : clientY - rect.top;
            const worldX = (vp.scrollLeft + offsetX) / this.zoom;
            const worldY = (vp.scrollTop + offsetY) / this.zoom;

            this.zoom = z;
            this.$nextTick(() => {
                vp.scrollLeft = worldX * z - offsetX;
                vp.scrollTop = worldY * z - offsetY;
                this.updateCenter();
                this.loadVisible();
            });
        },
        zoomBy(delta) {
            this.setZoomAt(this.zoom + delta);
        },
        resetView() {
            const vp = this.$refs.viewport;
            if (!vp) return;
            const oldZoom = this.zoom;
            const centerWorldX = (vp.scrollLeft + vp.clientWidth / 2) / oldZoom;
            const centerWorldY = (vp.scrollTop + vp.clientHeight / 2) / oldZoom;
            const target =
                this.selectedPuzzle ||
                (this.lastFocus ? this.findPuzzle(this.lastFocus.id) : null) ||
                this.lastFocus;

            if (this.zoomRaf) {
                cancelAnimationFrame(this.zoomRaf);
                this.zoomRaf = 0;
            }
            this.pendingZoom = null;
            this.pendingAnchor = null;
            this.zoom = 1;
            this.$nextTick(() => {
                if (target) {
                    // 回到当前正在做/最近做过的题，而不是 0,0 区块。
                    this.centerOnPuzzle(target);
                } else {
                    vp.scrollLeft = centerWorldX - vp.clientWidth / 2;
                    vp.scrollTop = centerWorldY - vp.clientHeight / 2;
                    this.updateCenter();
                    this.loadVisible();
                }
            });
        },
        onWheel(event) {
            event.preventDefault();
            const factor = Math.exp(-event.deltaY * 0.0015);
            const base = this.pendingZoom == null ? this.zoom : this.pendingZoom;
            this.pendingZoom = Math.min(
                this.MAX_ZOOM,
                Math.max(this.MIN_ZOOM, base * factor),
            );
            this.pendingAnchor = { x: event.clientX, y: event.clientY };

            if (!this.zoomRaf) {
                this.zoomRaf = requestAnimationFrame(() => {
                    this.zoomRaf = 0;
                    const target = this.pendingZoom;
                    const anchor = this.pendingAnchor;
                    this.pendingZoom = null;
                    this.pendingAnchor = null;
                    if (target != null && anchor) {
                        this.setZoomAt(target, anchor.x, anchor.y);
                    }
                });
            }
        },
        onPointerDown(event) {
            if (event.pointerType !== 'mouse') return;
            const isMiddle = event.button === 1;
            const isLeft = event.button === 0;
            if (!isMiddle && !isLeft) return;

            const vp = this.$refs.viewport;
            if (!vp) return;
            const onCell = !!(event.target && event.target.closest && event.target.closest('.cell'));
            const immediate = isMiddle || this.spaceHeld || !onCell;

            this.pan = {
                startX: event.clientX,
                startY: event.clientY,
                left: vp.scrollLeft,
                top: vp.scrollTop,
                moved: false,
                pending: isLeft && onCell && !this.spaceHeld,
            };
            this.isPanning = false;
            if (immediate) event.preventDefault();

            window.addEventListener('pointermove', this.onPointerMove);
            window.addEventListener('pointerup', this.onPointerUp);
            window.addEventListener('pointercancel', this.onPointerUp);
        },
        onPointerMove(event) {
            if (!this.pan) return;
            const dx = event.clientX - this.pan.startX;
            const dy = event.clientY - this.pan.startY;

            if (this.pan.pending && Math.hypot(dx, dy) < 5) return;
            if (!this.pan.moved) {
                this.pan.moved = true;
                this.pan.pending = false;
                this.isPanning = true;
                this.suppressClick = true;
            }

            event.preventDefault();
            const vp = this.$refs.viewport;
            if (!vp) return;
            vp.scrollLeft = this.pan.left - dx;
            vp.scrollTop = this.pan.top - dy;
        },
        onPointerUp() {
            if (!this.pan) return;
            const moved = this.pan.moved;
            this.pan = null;
            this.isPanning = false;
            this.removePointerListeners();
            if (moved) {
                // 让紧随 pointerup 的 click 被 viewport 捕获并吞掉
                setTimeout(() => {
                    this.suppressClick = false;
                }, 0);
            }
        },
        removePointerListeners() {
            window.removeEventListener('pointermove', this.onPointerMove);
            window.removeEventListener('pointerup', this.onPointerUp);
            window.removeEventListener('pointercancel', this.onPointerUp);
        },
        onClickCapture(event) {
            if (!this.suppressClick) return;
            event.preventDefault();
            event.stopPropagation();
            this.suppressClick = false;
        },
        onKeyup(event) {
            if (event.code === 'Space') this.spaceHeld = false;
        },
        onWindowBlur() {
            this.spaceHeld = false;
            this.onPointerUp();
        },
        refreshCenter() {
            this.refreshChunk(this.centerCx, this.centerCy);
        },
        refreshChunk(cx, cy) {
            axios
                .get(GetApi(`/sudoku/chunk?cx=${cx}&cy=${cy}`))
                .then((res) => {
                    this.chunks[this.key(cx, cy)] = {
                        cx: res.data.cx,
                        cy: res.data.cy,
                        puzzles: res.data.puzzles,
                    };
                    this.applyLocalProgress(this.chunks[this.key(cx, cy)].puzzles);
                })
                .catch(() => {});
        },
        focusStorageKey() {
            return `sudoku:focus:${this.userKey || 'anon'}`;
        },
        loadFocus() {
            try {
                const raw = localStorage.getItem(this.focusStorageKey());
                if (!raw) {
                    this.lastFocus = null;
                    return;
                }
                const focus = JSON.parse(raw);
                if (
                    Number.isInteger(focus.cx) &&
                    Number.isInteger(focus.cy) &&
                    Number.isInteger(focus.x) &&
                    Number.isInteger(focus.y)
                ) {
                    this.lastFocus = focus;
                }
            } catch {
                this.lastFocus = null;
            }
        },
        rememberFocus(puzzle) {
            this.lastFocus = {
                cx: puzzle.cx,
                cy: puzzle.cy,
                x: puzzle.x,
                y: puzzle.y,
                id: puzzle.id,
            };
            try {
                localStorage.setItem(this.focusStorageKey(), JSON.stringify(this.lastFocus));
            } catch {
                // ignore
            }
        },
        centerOnPuzzle(puzzle) {
            const vp = this.$refs.viewport;
            if (!vp) return;
            const worldX = (puzzle.cx + RADIUS) * STRIDE_X + (puzzle.x + 0.5) * CARD_W;
            const worldY = (puzzle.cy + RADIUS) * STRIDE_Y + (puzzle.y + 0.5) * CARD_H;
            vp.scrollLeft = worldX * this.zoom - vp.clientWidth / 2;
            vp.scrollTop = worldY * this.zoom - vp.clientHeight / 2;
            this.updateCenter();
            this.loadVisible();
        },
        centerOnChunk(cx, cy) {
            const vp = this.$refs.viewport;
            if (!vp) return;
            const worldX = (cx + RADIUS) * STRIDE_X + CHUNK_W / 2;
            const worldY = (cy + RADIUS) * STRIDE_Y + CHUNK_H / 2;
            vp.scrollLeft = worldX * this.zoom - vp.clientWidth / 2;
            vp.scrollTop = worldY * this.zoom - vp.clientHeight / 2;
            this.updateCenter();
            this.loadVisible();
        },
        openJump() {
            this.jumpX = this.centerCx;
            this.jumpY = this.centerCy;
            this.jumpOpen = true;
            this.$nextTick(() => {
                if (this.$refs.jumpXInput) this.$refs.jumpXInput.focus();
            });
        },
        doJump() {
            const x = Number(this.jumpX);
            const y = Number(this.jumpY);
            if (
                !Number.isInteger(x) ||
                !Number.isInteger(y) ||
                Math.abs(x) > RADIUS ||
                Math.abs(y) > RADIUS
            ) {
                this.toast.add({
                    severity: 'warn',
                    summary: '区块坐标无效',
                    detail: `请输入 -${RADIUS} ~ ${RADIUS} 之间的整数`,
                    life: 2400,
                });
                return;
            }
            this.jumpOpen = false;
            this.centerOnChunk(x, y);
        },
        progressStorageKey() {
            return this.userKey ? `sudoku:progress:${this.userKey}` : null;
        },
        loadLocalProgress() {
            const key = this.progressStorageKey();
            if (!key) {
                this.localProgress = {};
                return;
            }
            try {
                const raw = localStorage.getItem(key);
                this.localProgress = raw ? JSON.parse(raw) : {};
            } catch {
                this.localProgress = {};
            }
        },
        saveLocalProgress() {
            const key = this.progressStorageKey();
            if (!key) return;
            try {
                localStorage.setItem(key, JSON.stringify(this.localProgress));
            } catch {
                // localStorage 不可用时忽略，当前会话仍然可用。
            }
        },
        clearPuzzleProgress(puzzleId) {
            if (this.localProgress[puzzleId]) {
                delete this.localProgress[puzzleId];
                this.saveLocalProgress();
            }
        },
        applyLocalProgress(puzzles) {
            for (const puzzle of puzzles) {
                if (puzzle.status === 1) {
                    this.clearPuzzleProgress(puzzle.id);
                    continue;
                }
                const stored = this.localProgress[puzzle.id];
                if (stored) puzzle.cells = stored;
            }
        },
        isCompleteAndValid(cells) {
            if (typeof cells !== 'string' || cells.length !== 81 || cells.includes('0')) return false;
            const hasDuplicate = (values) => new Set(values).size !== values.length;

            for (let i = 0; i < 9; i++) {
                const row = [];
                const col = [];
                for (let j = 0; j < 9; j++) {
                    row.push(cells[i * 9 + j]);
                    col.push(cells[j * 9 + i]);
                }
                if (hasDuplicate(row) || hasDuplicate(col)) return false;
            }
            for (let br = 0; br < 3; br++) {
                for (let bc = 0; bc < 3; bc++) {
                    const box = [];
                    for (let r = 0; r < 3; r++) {
                        for (let c = 0; c < 3; c++) {
                            box.push(cells[(br * 3 + r) * 9 + bc * 3 + c]);
                        }
                    }
                    if (hasDuplicate(box)) return false;
                }
            }
            return true;
        },
        submitSolve(puzzle) {
            if (this.submitting[puzzle.id]) return;
            const token = GetToken();
            if (!token) return;
            this.submitting[puzzle.id] = true;
            axios
                .post(
                    GetApi(`/sudoku/${puzzle.id}/solve`),
                    { cells: puzzle.cells },
                    { headers: { Authorization: `Bearer ${token}` } },
                )
                .then((res) => {
                    this.applyPuzzle(res.data.puzzle);
                    this.clearPuzzleProgress(puzzle.id);
                    this.toast.add({
                        severity: 'success',
                        summary: '完成！',
                        detail: `题目 #${puzzle.id} 已被锁定`,
                        life: 2600,
                    });
                })
                .catch((err) => {
                    const data = (err.response && err.response.data) || {};
                    if (data.error === 'solved') {
                        this.clearPuzzleProgress(puzzle.id);
                        this.refreshChunk(puzzle.cx, puzzle.cy);
                        this.toast.add({
                            severity: 'info',
                            summary: '这道题刚被其他玩家完成',
                            life: 2400,
                        });
                    } else if (data.error === 'not_solved') {
                        this.toast.add({
                            severity: 'info',
                            summary: '盘面还有错误',
                            detail: '检查红色冲突数字后再试',
                            life: 2400,
                        });
                    } else {
                        this.toast.add({
                            severity: 'error',
                            summary: '提交失败',
                            detail: data.error || err.message,
                            life: 2400,
                        });
                    }
                })
                .finally(() => {
                    delete this.submitting[puzzle.id];
                });
        },
        applyPuzzle(puzzle) {
            const chunk = this.chunks[this.key(puzzle.cx, puzzle.cy)];
            if (!chunk) return;
            const idx = chunk.puzzles.findIndex((p) => p.id === puzzle.id);
            if (idx >= 0) chunk.puzzles[idx] = { ...puzzle };
            if (puzzle.status === 1) this.clearPuzzleProgress(puzzle.id);
        },
        formatTime(value) {
            if (!value) return '';
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return '';
            return d.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        },
        selectCell(puzzle, cell) {
            // 题面固定数字不可选中
            if (puzzle.puzzle[cell] !== '0') return;
            this.selected = { puzzleId: puzzle.id, cell };
            this.rememberFocus(puzzle);
            this.sendPresence();
        },
        fill(value) {
            const p = this.selectedPuzzle;
            if (!p || !this.selected) return;
            if (!this.canWrite) {
                this.toast.add({ severity: 'warn', summary: '请先登录', life: 2200 });
                return;
            }
            if (p.status === 1) return;
            if (p.puzzle[this.selected.cell] !== '0') return;

            const cell = this.selected.cell;
            const nextCells = p.cells.split('');
            nextCells[cell] = value === 0 ? '0' : String(value);
            const cells = nextCells.join('');

            // 中间过程完全本地保存，不请求服务器。
            this.applyPuzzle({ ...p, cells });
            this.localProgress[p.id] = cells;
            this.saveLocalProgress();

            // 只有“全满且没有行/列/宫冲突”时才一次性提交校验。
            if (this.isCompleteAndValid(cells)) {
                this.submitSolve({ ...p, cells });
            }
        },
        connectStream() {
            if (typeof EventSource === 'undefined') return;
            const stream = new EventSource(GetApi('/sudoku/stream'));
            stream.onopen = () => {
                this.streamOnline = true;
            };
            stream.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'online') {
                        this.online = msg.count;
                        this.streamOnline = true;
                    } else if (msg.type === 'presence') {
                        this.presenceUsers = msg.users || [];
                    } else if (msg.puzzle) {
                        this.applyPuzzle(msg.puzzle);
                    }
                } catch {
                    // ignore malformed events
                }
            };
            stream.onerror = () => {
                this.streamOnline = false;
            };
            this.stream = stream;
        },
        onKeydown(event) {
            const tag = (event.target && event.target.tagName) || '';
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || event.target?.isContentEditable) {
                return;
            }

            if (event.code === 'Space' && tag !== 'BUTTON') {
                event.preventDefault();
                this.spaceHeld = true;
                return;
            }

            if (event.ctrlKey || event.metaKey) {
                if (event.key === '=' || event.key === '+') {
                    event.preventDefault();
                    this.zoomBy(0.2);
                    return;
                }
                if (event.key === '-' || event.key === '_') {
                    event.preventDefault();
                    this.zoomBy(-0.2);
                    return;
                }
                if (event.key === '0') {
                    event.preventDefault();
                    this.resetView();
                    return;
                }
            }

            if (event.key === 'Escape') {
                this.selected = null;
                return;
            }
            if (!this.selected) return;

            const arrows = {
                ArrowLeft: [0, -1],
                ArrowRight: [0, 1],
                ArrowUp: [-1, 0],
                ArrowDown: [1, 0],
            };
            if (arrows[event.key]) {
                const p = this.selectedPuzzle;
                if (!p) return;
                event.preventDefault();
                const [dr, dc] = arrows[event.key];
                let row = Math.floor(this.selected.cell / 9);
                let col = this.selected.cell % 9;

                // 跳过题面固定数字，只停在可填写的格子上。
                for (let step = 0; step < 9; step++) {
                    row += dr;
                    col += dc;
                    if (row < 0 || row > 8 || col < 0 || col > 8) return;
                    if (p.puzzle[row * 9 + col] === '0') {
                        this.selected = { puzzleId: p.id, cell: row * 9 + col };
                        this.rememberFocus(p);
                        this.sendPresence();
                        return;
                    }
                }
                return;
            }

            if (/^[1-9]$/.test(event.key)) {
                event.preventDefault();
                this.fill(Number(event.key));
            } else if (['0', 'Backspace', 'Delete'].includes(event.key)) {
                event.preventDefault();
                this.fill(0);
            }
        },
    },
};
</script>

<style lang="scss" scoped>
.sudokuPage {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
}

.sudokuBar {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 22px;
    background: rgba(255, 255, 255, 0.86);
    border-bottom: 1px solid rgba(120, 150, 200, 0.22);
    backdrop-filter: blur(8px);
    flex-wrap: wrap;
}

.jumpBtn {
    display: inline-flex;
    align-items: center;
    gap: 5px;

    i {
        font-size: 12px;
    }
}

.jumpPanel {
    position: absolute;
    top: calc(100% + 6px);
    right: 22px;
    z-index: 60;
    width: 270px;
    padding: 14px;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #d7e1f0;
    border-radius: 12px;
    box-shadow: 0 14px 36px rgba(40, 70, 120, 0.2);
}

.jumpTitle {
    margin-bottom: 10px;
    color: #2c3e50;
    font-size: 14px;
    font-weight: 700;
}

.jumpRow {
    display: flex;
    gap: 10px;

    label {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 5px;
        color: #7a879c;
        font-size: 12px;
    }

    input {
        width: 100%;
        height: 36px;
        box-sizing: border-box;
        padding: 0 9px;
        border: 1px solid #d7e1f0;
        border-radius: 7px;
        color: #2c3e50;
        font-size: 15px;
        outline: none;

        &:focus {
            border-color: #4a6fe3;
            box-shadow: 0 0 0 3px rgba(74, 111, 227, 0.12);
        }
    }
}

.jumpHint {
    margin-top: 7px;
    color: #9aa8bd;
    font-size: 11px;
}

.jumpActions {
    display: flex;
    gap: 8px;
    margin-top: 12px;

    button {
        flex: 1;
        height: 34px;
        border-radius: 7px;
        cursor: pointer;
        font-size: 13px;
    }

    .jumpConfirm {
        border: 1px solid #4a6fe3;
        background: #4a6fe3;
        color: #fff;
    }

    .jumpCancel {
        border: 1px solid #d7e1f0;
        background: #fff;
        color: #5b6b84;
    }
}

.titleBlock {
    display: flex;
    align-items: baseline;
    gap: 12px;

    h1 {
        margin: 0;
        font-size: 22px;
        color: #2c3e50;
    }

    span {
        color: #7a879c;
        font-size: 12px;
    }
}

.barStats {
    display: flex;
    align-items: center;
    gap: 14px;
    color: #5b6b84;
    font-size: 13px;
}

.live {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #c5ccd8;

    &.on {
        background: #32c48d;
        box-shadow: 0 0 0 4px rgba(50, 196, 141, 0.16);
    }
}

.coord {
    font-variant-numeric: tabular-nums;
    color: #8b97aa;
}

.zoomControls {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px;
    border: 1px solid #d7e1f0;
    border-radius: 8px;
    background: #fff;
}

.zoomBtn {
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 6px;
    background: #f6f9ff;
    color: #4a6fe3;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;

    &:hover {
        background: #e8f0ff;
    }
}

.zoomValue {
    min-width: 44px;
    text-align: center;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: #5b6b84;
}

.barBtn {
    padding: 6px 12px;
    border: 1px solid #cfdaea;
    border-radius: 6px;
    background: #fff;
    color: #4a6fe3;
    cursor: pointer;
    font-size: 13px;

    &:hover {
        background: #f2f6ff;
    }
}

.hint {
    padding: 7px 22px;
    color: #7a879c;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.55);
    border-bottom: 1px solid rgba(120, 150, 200, 0.12);
}

.viewport {
    flex: 1;
    min-height: 0;
    overflow: auto;
    position: relative;
    background-color: #f4f8ff;
    background-image:
        linear-gradient(rgba(120, 150, 200, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(120, 150, 200, 0.08) 1px, transparent 1px);
    background-size: 40px 40px;
    overscroll-behavior: contain;
    cursor: grab;

    &.panning {
        cursor: grabbing;
        user-select: none;
    }

    &.panMode {
        cursor: grab;
    }
}

.viewport.panMode :deep(.cell) {
    cursor: grab;
}

.viewport.panning :deep(.cell) {
    cursor: grabbing;
}

.world {
    position: relative;
}

.worldInner {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    will-change: transform;
}

.chunk {
    position: absolute;
    box-sizing: border-box;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
}

.chunkPresence {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 6;
    display: flex;
    align-items: center;
    gap: 6px;
    max-width: 360px;
    padding: 4px 12px;
    background: rgba(74, 111, 227, 0.9);
    color: #fff;
    font-size: 15px;
    line-height: 1.4;
    border-radius: 0 0 10px 0;
    box-shadow: 0 3px 10px rgba(40, 70, 120, 0.18);
    pointer-events: none;

    span {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    i {
        font-size: 13px;
        opacity: 0.9;
    }
}

.chunkGrid {
    display: grid;
    grid-template-columns: repeat(4, 356px);
    gap: 0;
}

.numberPad {
    position: fixed;
    right: 26px;
    bottom: 26px;
    z-index: 40;
    width: 300px;
    padding: 12px;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.97);
    border: 1px solid #d7e1f0;
    border-radius: 12px;
    box-shadow: 0 12px 32px rgba(40, 70, 120, 0.2);
}

.padHead {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    color: #5b6b84;
    font-size: 12px;

    b {
        color: #4a6fe3;
    }
}

.padSolved {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #1f9d55;
}

.padMuted {
    color: #8b97aa;
}

.padClose {
    margin-left: auto;
    border: none;
    background: transparent;
    font-size: 18px;
    line-height: 1;
    color: #8b97aa;
    cursor: pointer;
}

.padRow {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;

    button {
        height: 40px;
        border: 1px solid #d7e1f0;
        border-radius: 7px;
        background: #f6f9ff;
        color: #2c3e50;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;

        &:hover:not(:disabled) {
            background: #e8f0ff;
            border-color: #9db7e8;
        }

        &:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

        &.erase {
            grid-column: span 2;
            font-size: 13px;
            font-weight: 500;
        }
    }
}

@media (max-width: 760px) {
    .sudokuBar {
        padding: 10px 14px;
    }

    .titleBlock span,
    .coord {
        display: none;
    }

    .numberPad {
        left: 12px;
        right: 12px;
        bottom: 12px;
        width: auto;
    }

    .jumpPanel {
        left: 12px;
        right: 12px;
        width: auto;
    }
}
</style>
