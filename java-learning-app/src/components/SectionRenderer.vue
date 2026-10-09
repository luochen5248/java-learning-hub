<script setup lang="ts">
/**
 * SectionRenderer.vue —— 内容块分发
 *
 * 严格按 section.type 渲染对应的块组件；未知类型静默忽略，
 * 保证后续新增内容类型时旧版本不报错、不白屏。
 */
import type { Section } from '../types/course'
import TextSection from './sections/TextSection.vue'
import StepsSection from './sections/StepsSection.vue'
import CodeSection from './sections/CodeSection.vue'
import TableSection from './sections/TableSection.vue'
import DiagramSection from './sections/DiagramSection.vue'
import ImgSection from './sections/ImgSection.vue'
import NoteSection from './sections/NoteSection.vue'

defineProps<{ section: Section }>()
</script>

<template>
  <TextSection v-if="section.type === 'text'" :html="section.html" />
  <StepsSection v-else-if="section.type === 'steps'" :title="section.title" :items="section.items" />
  <CodeSection
    v-else-if="section.type === 'code'"
    :lang="section.lang"
    :filename="section.filename"
    :code="section.code"
  />
  <TableSection
    v-else-if="section.type === 'table'"
    :title="section.title"
    :head="section.head"
    :rows="section.rows"
    variant="table"
  />
  <TableSection
    v-else-if="section.type === 'compare'"
    :title="section.title"
    :head="section.head"
    :rows="section.rows"
    variant="compare"
  />
  <DiagramSection v-else-if="section.type === 'diagram'" :caption="section.caption" :svg="section.svg" />
  <ImgSection v-else-if="section.type === 'img'" :caption="section.caption" :src="section.src" />
  <NoteSection
    v-else-if="section.type === 'tip' || section.type === 'warn' || section.type === 'fe'"
    :variant="section.type"
    :html="section.html"
  />
</template>
