<template>
  <div class="wrapper">
    {{ selection }}
    <DataTable
      :value="files"
      :paginator="true"
      :rows="10"
      :rowHover="false"
      v-model:filters="filters"
      filterDisplay="menu"
      :loading="loading"
      responsiveLayout="scroll"
    >
      <template v-slot:empty><center>No files found</center></template>
      <template v-slot:loading></template>
      <Column
        header="Name"
        sortable
        filterField="name"
        sortField="name"
        :showFilterMatchModes="false"
        :filterMenuStyle="{ width: '14rem' }"
      >
        <template v-slot:body="{ data }">
          {{ data.name }}
        </template>
        <template v-slot:filter="{ filterModel }">
          <MultiSelect v-model="filterModel.value" :options="names" placeholder="Any" class="p-column-filter" />
        </template>
      </Column>
      <Column
        header="Detector"
        sortable
        filterField="detector"
        sortField="detector"
        :showFilterMatchModes="false"
        :filterMenuStyle="{ width: '14rem' }"
      >
        <template v-slot:body="{ data }">
          {{ data.detector }}
        </template>
        <template v-slot:filter="{ filterModel }">
          <MultiSelect v-model="filterModel.value" :options="detectors" placeholder="Any" class="p-column-filter" />
        </template>
      </Column>
      <Column field="file" header="File" style="width: 30%">
        <template v-slot:body="slotProps">
          <img :src="'data:image/jpg;base64,' + slotProps.data.file.base64" style="width: 100%" />
          {{ slotProps.data.meta }}
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import MultiSelect from 'primevue/multiselect';
import { FilterMatchMode } from 'primevue/api';

import ApiService from '@/services/api.service';

export default {
  components: {
    DataTable,
    Column,
    MultiSelect,
  },
  data: () => ({
    loading: false,
    files: [],
    selection: null,
    filters: {
      name: { value: null, matchMode: FilterMatchMode.EQUALS },
      detector: { value: null, matchMode: FilterMatchMode.IN },
    },
  }),
  computed: {
    names() {
      const names = this.files.map((obj) => obj.name);
      return [...new Set(names)];
    },
    detectors() {
      const detectors = this.files.map((obj) => obj.detector);
      return [...new Set(detectors)];
    },
  },
  async mounted() {
    this.loading = true;
    const { data } = await ApiService.get('/train');
    this.files = data;
    this.loading = false;
  },
};
</script>

<style scoped lang="scss"></style>
