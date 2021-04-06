<template>
  <div class="container pt-5">
    <Manage />
  </div>
</template>

<script>
import '@/assets/css/bootstrap.min.css';
import Manage from '@/views/Manage.vue';

export default {
  name: 'App',
  components: {
    Manage,
  },
  data() {
    return {
      info: null,
    };
  },
};
</script>

<style lang="scss">
html,
body {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background: #eaeaea;
  flex: 1;
}

.container {
  max-width: 1000px;
  background: #fff;
}
</style>
