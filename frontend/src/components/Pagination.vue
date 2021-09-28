<template>
  <div class="pagination-wrapper">
    <Pagination
      v-model="page"
      :records="pagination.total || 0"
      :per-page="pagination.limit"
      @paginate="paginate"
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
    loading: Object,
  },
  created() {},
  mounted() {
    this.page = this.pagination.temp;
  },
  methods: {
    paginate(value) {
      if (this.loading.files || this.loading.status) {
        this.page = this.pagination.temp;
        return;
      }
      if (this.page === this.pagination.temp) return;
      this.emitter.emit('paginate', value);
    },
  },
  watch: {
    // eslint-disable-next-line object-shorthand
    'pagination.page'(value) {
      this.page = value;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';

::v-deep(.VuePagination__count) {
  display: none;
}

::v-deep(ul.VuePagination__pagination) {
  list-style: none !important;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;

  li {
    display: inline-block;
    margin: 0px 5px;
    @media only screen and (max-width: 576px) {
      margin: 0px 3px;
    }
  }
  li > button {
    margin: 0;
    background: var(--surface-a);
    padding: 5px 10px;
    color: var(--text-color);
    font-size: 1rem;
    @media only screen and (max-width: 576px) {
      font-size: 0.9rem;
    }
  }
  li.active > button {
    background: var(--surface-d);
    color: var(--text-color);
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
      @media only screen and (max-width: 576px) {
        font-size: 0.825rem;
      }
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
