<template>
  <div class="auth-header row items-center q-px-lg q-py-lg">
    <div class="logo-box flex flex-center shadow-2">
      <q-icon name="local_shipping" size="26px" color="white" />
    </div>
    <span class="brand-title q-ml-md text-weight-bold">Transportes K.S.M</span>
  </div>
</template>

<script setup lang="ts">
// Header con isotipo corporativo de Transportes K.S.M
</script>

<style scoped>
.auth-header {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.logo-box {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  box-shadow: 0 4px 14px rgba(21, 101, 192, 0.4);
}

.brand-title {
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}
</style>
