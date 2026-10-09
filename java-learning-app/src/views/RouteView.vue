<script setup lang="ts">
/**
 * RouteView.vue —— 学习路线全览
 * 放大的地铁图 + 全阶段模块列表；点站点可直接进入模块。
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { PHASES } from '../data'
import AppTopbar from '../components/AppTopbar.vue'
import SubwayMap from '../components/SubwayMap.vue'
import ModuleRow from '../components/ModuleRow.vue'
import { useCourseStore } from '../stores/course'

const router = useRouter()
const course = useCourseStore()

const stages = computed(() =>
  PHASES.map((ph) => ({
    ...ph,
    mods: course.catalog.filter((m) => m.phase === ph.id),
  })).filter((s) => s.mods.length > 0)
)

function onMapClick(e: MouseEvent): void {
  const el = (e.target as HTMLElement).closest('[data-station]')
  const id = el && el.getAttribute('data-station')
  if (id) router.push('/module/' + encodeURIComponent(id))
}
</script>

<template>
  <AppTopbar title="学习路线" back="/" />
  <div class="page">
    <div class="pad">
      <section class="route">
        <div class="route-map is-full" @click="onMapClick">
          <SubwayMap variant="full" />
        </div>
        <div class="legend">
          <span v-for="p in PHASES" :key="p.id" class="legend-i">
            <i :style="{ background: p.color }"></i>{{ p.name }}
          </span>
        </div>
      </section>

      <div class="route-note">
        一条线走到底：先把「待办清单 API」跑起来，再回头补原理。点站点可直接进入模块。
      </div>

      <section v-for="s in stages" :key="s.id" class="stage">
        <div class="stage-head" :style="{ '--pc': s.color }">
          <span class="stage-dot"></span>
          <span class="stage-name">{{ s.name }}</span>
          <span class="stage-count">{{ s.mods.length }} 模块</span>
        </div>
        <div class="stage-list">
          <ModuleRow v-for="m in s.mods" :key="m.id" :mod="m" :color="s.color" />
        </div>
      </section>
    </div>
  </div>
</template>
