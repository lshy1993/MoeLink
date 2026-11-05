<template>
    <article
        class="puzzleCard"
        :class="{ solved: puzzle.status === 1, hideDigits: !showDigits }"
        :title="puzzle.status === 1 ? solvedText : `#${puzzle.id}`"
    >
        <div v-if="showDigits" class="grid">
            <div v-for="box in 9" :key="box" class="box">
                <div
                    v-for="k in 9"
                    :key="k"
                    class="cell"
                    :class="cellClass(index(box - 1, k - 1))"
                    @click="onCell(index(box - 1, k - 1))"
                >
                    {{ value(index(box - 1, k - 1)) }}
                </div>
            </div>
        </div>
        <div v-else class="miniGrid" :class="{ solved: puzzle.status === 1 }" title="放大后可填写"></div>

        <div v-if="puzzle.status === 1" class="solvedBadge">
            <i class="pi pi-check"></i>
        </div>
        <div v-if="puzzle.status === 1" class="solvedTip">
            <span class="solvedName">{{ puzzle.solvedByName || '玩家' }}</span>
            <span class="solvedTime">{{ formatSolvedAt(puzzle.solvedAt) }}</span>
        </div>
    </article>
</template>

<script>
export default {
    name: 'SudokuPuzzle',
    props: {
        puzzle: { type: Object, required: true },
        selectedCell: { type: Number, default: null },
        showDigits: { type: Boolean, default: true },
    },
    emits: ['select'],
    computed: {
        solvedText() {
            const name = this.puzzle.solvedByName || '玩家';
            return `已由 ${name} 完成 · ${this.formatSolvedAt(this.puzzle.solvedAt)}`;
        },
    },
    methods: {
        index(box, k) {
            const boxRow = Math.floor(box / 3);
            const boxCol = box % 3;
            return (boxRow * 3 + Math.floor(k / 3)) * 9 + boxCol * 3 + (k % 3);
        },
        value(index) {
            const v = this.puzzle.cells[index];
            return v === '0' ? '' : v;
        },
        cellClass(index) {
            return {
                given: this.puzzle.puzzle[index] !== '0',
                filled: this.puzzle.cells[index] !== '0',
                selected: this.selectedCell === index,
                locked: this.puzzle.status === 1,
                conflict: this.isConflict(index),
            };
        },
        isConflict(index) {
            if (this.puzzle.status === 1) return false;
            if (this.puzzle.puzzle[index] !== '0') return false;
            const value = this.puzzle.cells[index];
            if (value === '0') return false;

            const row = Math.floor(index / 9);
            const col = index % 9;
            for (let i = 0; i < 9; i++) {
                if (i !== col && this.puzzle.cells[row * 9 + i] === value) return true;
                if (i !== row && this.puzzle.cells[i * 9 + col] === value) return true;
            }
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const peer = (boxRow + r) * 9 + boxCol + c;
                    if (peer !== index && this.puzzle.cells[peer] === value) return true;
                }
            }
            return false;
        },
        formatSolvedAt(value) {
            if (!value) return '';
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return '';
            return d.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        },
        onCell(index) {
            // 题面固定数字不可选中，避免误以为可以修改。
            if (this.puzzle.puzzle[index] !== '0') return;
            this.$emit('select', index);
        },
    },
};
</script>

<style lang="scss" scoped>
.puzzleCard {
    position: relative;
    width: 356px;
    height: 356px;
    padding: 0;
    background: transparent;
    border: 0;
    box-shadow: none;
}

.grid {
    display: grid;
    grid-template-columns: repeat(3, 112px);
    grid-template-rows: repeat(3, 112px);
    gap: 6px;
    padding: 4px;
    width: 356px;
    height: 356px;
    box-sizing: border-box;
    background: #2c3e50;
    border-radius: 0;
    transition: box-shadow 0.15s;
}

.puzzleCard:hover .grid {
    box-shadow: inset 0 0 0 4px #4a6fe3;
}

.puzzleCard.solved .grid {
    background: #2d7a52;
}

.box {
    display: grid;
    grid-template-columns: repeat(3, 36px);
    grid-template-rows: repeat(3, 36px);
    gap: 2px;
    background: #9aa8bd;
}

.cell {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    box-sizing: border-box;
    background: #fff;
    color: #2d8cf0;
    font-size: 26px;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    transition: background 0.12s, color 0.12s;

    &.given {
        color: #2c3e50;
        font-weight: 700;
        background: #f7f9fd;
        cursor: default;
    }

    &.selected {
        background: #ffe9a8;
        color: #b45309;
        box-shadow: inset 0 0 0 4px #f0b429;
    }

    &.conflict {
        background: #ffe1e1;
        color: #d93025;
        font-weight: 700;
    }

    &.locked {
        cursor: default;
        color: #1f9d55;
        background: #f2fbf5;

        &.given {
            color: #16794a;
            background: #e8f7ee;
        }
    }

    &:hover:not(.locked):not(.given):not(.conflict) {
        background: #e8f0ff;
    }
}

.solvedBadge {
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #1f9d55;
    color: #fff;
    font-size: 14px;
    pointer-events: none;
}

.solvedTip {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 4px 8px;
    background: rgba(31, 157, 85, 0.94);
    color: #fff;
    font-size: 15px;
    line-height: 1.35;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s;
}

.puzzleCard:hover .solvedTip {
    opacity: 1;
}

.solvedName {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-weight: 600;
}

.solvedTime {
    flex: none;
    opacity: 0.9;
    font-variant-numeric: tabular-nums;
}

// 缩得很小时只保留一个轻量网格，避免同时渲染几十万个小格子。
.miniGrid {
    width: 356px;
    height: 356px;
    box-sizing: border-box;
    background-color: #fff;
    background-image:
        repeating-linear-gradient(to right, #d8e0ec 0 2px, transparent 2px 39.5556px),
        repeating-linear-gradient(to bottom, #d8e0ec 0 2px, transparent 2px 39.5556px);
    box-shadow: inset 0 0 0 4px #2c3e50;

    &.solved {
        background-color: #dff5e8;
        background-image:
            repeating-linear-gradient(to right, #9fd9b8 0 2px, transparent 2px 39.5556px),
            repeating-linear-gradient(to bottom, #9fd9b8 0 2px, transparent 2px 39.5556px);
        box-shadow: inset 0 0 0 4px #1f9d55;
    }
}

.puzzleCard.hideDigits .solvedTip {
    display: none;
}

</style>
