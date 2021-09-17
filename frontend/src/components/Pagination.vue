<template>
  <div class="pagination-wrapper" :class="location">
    <Pagination
      v-model="page"
      :records="pagination.total || 0"
      :per-page="pagination.limit"
      @paginate="paginate"
      class="p-pt-3"
      :options="{
        chunk: 5,
        texts: { count: '' },
      }"
    />
  </div>
</template>

<script>
import Pagination from 'v-pagination-3';

export default {
  components: {
    Pagination,
  },
  data: () => ({
    page: 1,
  }),
  props: {
    pagination: Object,
    location: String,
  },
  created() {},
  mounted() {
    this.page = this.pagination.page;
  },
  methods: {
    paginate(value) {
      if (this.page === this.pagination.page) return;
      this.emitter.emit('paginate', value);
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';

::v-deep(.VuePagination__count) {
  display: none;
}

.pagination-wrapper.top ::v-deep(ul.VuePagination__pagination) {
  padding-top: 1rem;
}

.pagination-wrapper.bottom ::v-deep(ul.VuePagination__pagination) {
  padding-bottom: 1rem;
}

::v-deep(ul.VuePagination__pagination) {
  list-style: none !important;
  padding: 0;
  margin: 0;

  li {
    display: inline-block;
    margin: 0px 5px;
  }
  li > button {
    background: #2a323d;
    padding: 5px 10px;
    color: #fff;
    font-size: 1rem;
  }
  li.active > button {
    background: #fff;
    color: #2a323d;
  }
  li.disabled {
    opacity: 0.3;
    button {
      cursor: not-allowed;
    }
  }
  li > button {
    border: none;
    outline: none;
    font-family: inherit;
    cursor: pointer;
  }
  li.VuePagination__pagination-item-prev-page,
  li.VuePagination__pagination-item-prev-page-chunk,
  li.VuePagination__pagination-item-next-page,
  li.VuePagination__pagination-item-next-chunk {
    button {
      font-size: 0;
      padding: 7px;
      font-family: primeicons;
    }
    button:after {
      font-size: 1rem;
    }
  }
  li.VuePagination__pagination-item-prev-page > button:after {
    content: '\e931';
  }
  li.VuePagination__pagination-item-prev-chunk > button:after {
    content: '\e92d';
  }
  li.VuePagination__pagination-item-next-page > button:after {
    content: '\e932';
  }
  li.VuePagination__pagination-item-next-chunk > button:after {
    content: '\e92e';
  }
}
</style>
