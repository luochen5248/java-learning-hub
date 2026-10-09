<script setup lang="ts">
/**
 * ModuleRow.vue —— 模块行（首页三阶段列表 / 路线全览页共用）
 * 排版用「分隔线 + 编号」，不做卡片套卡片。
 */
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { CourseModule } from '../types/course'
import AppIcon from './AppIcon.vue'
import PctBar from './PctBar.vue'
import { ICON_CHEV } from './icons'
import { useProgressStore } from '../stores/progress'

const props = defineProps<{
  mod: CourseModule
  /** 阶段色 */
  color: string
}>()

const progress = useProgressStore()
const p = computed(() => progress.moduleProgress(props.mod.id))
const sub = computed(() => props.mod.subtitle || props.mod.summary || '')

// 封面缺失时收起 <img>，露出 .mod-thumb 的占位底色
const coverMissing = ref(false)
</script>

<template>
  <RouterLink class="mod-row" :to="'/module/' + mod.id">
    <span class="mod-thumb">
      <img v-if="!coverMissing" :src="mod.cover" alt="" loading="lazy" @error="coverMissing = true" />
      <span v-if="mod.missing" class="mod-soon">建设中</span>
    </span>
    <span class="mod-body">
      <span class="mod-meta">{{ mod.id.toUpperCase() }} · {{ mod.minutes }} 分钟</span>
      <span class="mod-title">{{ mod.title }}</span>
      <span class="mod-sub">{{ sub }}</span>
      <span class="mod-bar">
        <PctBar :done="p.done" :total="p.total" :color="color" />
        <em class="mod-pct">{{ p.done }}/{{ p.total }}</em>
      </span>
    </span>
    <span class="mod-go"><AppIcon :path="ICON_CHEV" :size="16" /></span>
  </RouterLink>
</template>
