<template><CapturaPage :id="id" /></template>
<script setup lang="ts">
import CapturaPage from './CapturaPage.vue';
defineProps<{ id: string }>();
</script>
