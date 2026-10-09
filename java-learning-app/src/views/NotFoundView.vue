<script setup lang="ts">
/** NotFoundView.vue —— 未知路由兜底 */
import AppTopbar from '../components/AppTopbar.vue'
import EmptyState from '../components/EmptyState.vue'
</script>

<template>
  <AppTopbar title="页面不存在" back="/" />
  <div class="page">
    <div class="pad"><EmptyState title="走错站了" desc="回到首页，重新开始这段路线。" /></div>
  </div>
</template>
