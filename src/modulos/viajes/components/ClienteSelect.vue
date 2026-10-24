<template>
  <q-select
    v-model="selectedCliente"
    :options="filteredOptions"
    :label="label"
    :loading="loading"
    use-input
    fill-input
    hide-selected
    input-debounce="0"
    option-label="label"
    options-dense
    outlined
    @filter="filterOptions"
    @update:model-value="handleSelection"
  >
    <template #no-option>
      <q-item>
        <q-item-section class="text-grey-6">
          Escribe un nombre para crear una opción.
        </q-item-section>
      </q-item>
    </template>

    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <q-icon :name="scope.opt.crear ? 'person_add' : 'business'" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { getOrCreateCliente, listClientes } from '../api';
import type { ClienteOptionRecord as ClienteRecord, ClienteTipo } from '../api/clientes.api';
import { normalizarNombre } from '@/domain/model';

interface ClienteOption {
  id?: string;
  nombre: string;
  label: string;
  tipo: ClienteTipo;
  crear?: boolean;
}

const props = defineProps<{
  modelValue: string;
  tipo: ClienteTipo;
  label: string;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();

const $q = useQuasar();
const selectedCliente = ref<ClienteOption | null>(null);
const clientes = ref<ClienteOption[]>([]);
const filteredOptions = ref<ClienteOption[]>([]);
const searchText = ref('');
const loading = ref(false);

function toOption(cliente: ClienteRecord): ClienteOption {
  return {
    ...(cliente.id !== undefined ? { id: cliente.id } : {}),
    nombre: cliente.nombre,
    label: cliente.nombre,
    tipo: cliente.tipo,
  };
}

async function loadClientes() {
  loading.value = true;
  try {
    clientes.value = (await listClientes(props.tipo)).map(toOption);
    filteredOptions.value = clientes.value;
    syncSelectedCliente();
  } catch (error) {
    console.error('Error al cargar clientes locales:', error);
    $q.notify({
      type: 'negative',
      message: 'No se pudieron cargar las granjas o vendedores guardados.',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
}

function syncSelectedCliente() {
  selectedCliente.value =
    clientes.value.find((cliente) => cliente.nombre === props.modelValue) ?? null;
}

function filterOptions(value: string, update: (callback: () => void) => void) {
  searchText.value = value.trim();
  update(() => {
    const query = normalizarNombre(searchText.value);
    const matches = clientes.value.filter((cliente) =>
      normalizarNombre(cliente.nombre).includes(query),
    );
    const exactMatch = clientes.value.some((cliente) => normalizarNombre(cliente.nombre) === query);

    filteredOptions.value =
      query && !exactMatch
        ? [
            ...matches,
            {
              nombre: searchText.value,
              label: `Crear "${searchText.value}"`,
              tipo: props.tipo,
              crear: true,
            },
          ]
        : matches;
  });
}

async function handleSelection(option: ClienteOption | null) {
  if (!option) {
    emit('update:modelValue', '');
    return;
  }

  if (!option.crear) {
    emit('update:modelValue', option.nombre);
    return;
  }

  loading.value = true;
  try {
    const cliente = await getOrCreateCliente(props.tipo, option.nombre);
    const savedOption = toOption(cliente);
    clientes.value = [...clientes.value.filter((item) => item.id !== cliente.id), savedOption].sort(
      (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
    );
    filteredOptions.value = clientes.value;
    selectedCliente.value = savedOption;
    emit('update:modelValue', cliente.nombre);
  } catch (error) {
    console.error('Error al guardar el cliente localmente:', error);
    selectedCliente.value = null;
    $q.notify({
      type: 'negative',
      message: 'No se pudo guardar el nombre. Inténtalo de nuevo.',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.modelValue,
  () => syncSelectedCliente(),
);

onMounted(() => {
  void loadClientes();
});
</script>
