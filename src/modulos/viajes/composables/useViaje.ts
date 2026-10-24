import { ref, reactive, watch } from 'vue';
import { useTransporte } from '@/composables/useTransporte';
import { fechaLima, fechaVisible } from '@/domain/model';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import {
  listMovimientosFromDexie,
  addMovimientoToDexie,
  deleteMovimientoFromDexie,
  getTripSummaryFromDexie,
  updateFleteFromDexie,
} from '../api';
import type {
  Movimiento,
  ViajeResumen,
  CompraFormData,
  VentaFormData,
  FleteFormData,
  EditarFleteData,
} from '../types';

export function useViaje() {
  const router = useRouter();
  const $q = useQuasar();

  const loading = ref(false);
  const movimientos = ref<Movimiento[]>([]);
  const resumen = reactive<ViajeResumen>({
    fecha: fechaVisible(fechaLima()),
    origen: 'Chincha',
    destino: 'Lima',
    estado: 'En curso',
    compradoKg: 0,
    compradoPaq: 0,
    vendidoKg: 0,
    vendidoPaq: 0,
    enCamionKg: 0,
    enCamionPaq: 0,
    totalMovimientos: 0,
  });

  async function loadData() {
    try {
      const items = await listMovimientosFromDexie();
      movimientos.value = items;
      const summary = await getTripSummaryFromDexie();
      Object.assign(resumen, summary);
    } catch (err) {
      console.error('Error al cargar datos del viaje en Dexie:', err);
    }
  }

  async function registrarCompra(formData: CompraFormData): Promise<boolean> {
    if (loading.value) return false;
    if (!formData.granja.trim()) {
      $q.notify({
        type: 'warning',
        message: 'Por favor, ingresa o selecciona el nombre de la granja.',
        position: 'top',
      });
      return false;
    }

    loading.value = true;
    try {
      const kilos = formData.kilosTotal && formData.kilosTotal > 0 ? formData.kilosTotal : 0;
      const paq = formData.paquetesTotal && formData.paquetesTotal > 0 ? formData.paquetesTotal : 0;
      const montoTotal =
        kilos > 0 && (formData.rosadoPrecio ?? 0) > 0 ? kilos * (formData.rosadoPrecio ?? 0) : 0;

      const movimiento = await addMovimientoToDexie({
        tipo: 'compra',
        fecha: formData.fecha || fechaVisible(fechaLima()),
        entidad: formData.granja.trim(),
        rosadoPrecio: formData.rosadoPrecio,
        pardoPrecio: formData.pardoPrecio,
        jumboPrecio: formData.jumboPrecio,
        kilosTotal: kilos,
        paquetesTotal: paq,
        montoTotal,
      });

      if (movimiento.id === undefined) {
        throw new Error('La compra se guardó sin recibir un ID de movimiento.');
      }

      $q.notify({
        type: 'positive',
        message: `Compra en ${formData.granja} guardada en este dispositivo`,
        icon: 'check_circle',
        position: 'top',
      });

      await loadData();
      await router.push(`/viaje/compra/${movimiento.id}`);
      return true;
    } catch (err) {
      console.error('Error al guardar compra:', err);
      $q.notify({
        type: 'negative',
        message: err instanceof Error ? err.message : 'No se pudo guardar la compra.',
        position: 'top',
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function registrarVenta(formData: VentaFormData): Promise<boolean> {
    if (loading.value) return false;
    if (!formData.cliente.trim()) {
      $q.notify({
        type: 'warning',
        message: 'Por favor, ingresa o selecciona el nombre del cliente.',
        position: 'top',
      });
      return false;
    }

    loading.value = true;
    try {
      const kilos = formData.kilosTotal && formData.kilosTotal > 0 ? formData.kilosTotal : 0;
      const paq = formData.paquetesTotal && formData.paquetesTotal > 0 ? formData.paquetesTotal : 0;
      const montoTotal =
        kilos > 0 && (formData.rosadoPrecio ?? 0) > 0 ? kilos * (formData.rosadoPrecio ?? 0) : 0;

      const movimiento = await addMovimientoToDexie({
        tipo: 'venta',
        fecha: formData.fecha || fechaVisible(fechaLima()),
        entidad: formData.cliente.trim(),
        rosadoPrecio: formData.rosadoPrecio,
        pardoPrecio: formData.pardoPrecio,
        jumboPrecio: formData.jumboPrecio,
        kilosTotal: kilos,
        paquetesTotal: paq,
        montoTotal,
        tienePesosCompra: formData.tienePesosCompra,
      });

      if (movimiento.id === undefined) {
        throw new Error('La venta se guardó sin recibir un ID de movimiento.');
      }

      $q.notify({
        type: 'positive',
        message: `Venta a ${formData.cliente} guardada en este dispositivo`,
        icon: 'check_circle',
        position: 'top',
      });

      await loadData();
      await router.push(`/viaje/venta/${movimiento.id}`);
      return true;
    } catch (err) {
      console.error('Error al guardar venta:', err);
      $q.notify({
        type: 'negative',
        message: err instanceof Error ? err.message : 'No se pudo guardar la venta.',
        position: 'top',
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function registrarFlete(formData: FleteFormData): Promise<boolean> {
    if (loading.value) return false;
    if (!formData.granja.trim()) {
      $q.notify({
        type: 'warning',
        message: 'Por favor, ingresa el nombre de la granja.',
        position: 'top',
      });
      return false;
    }

    const paquetesRosados = formData.paquetesRosados === '' ? 0 : Number(formData.paquetesRosados);
    const paquetesPardos = formData.paquetesPardos === '' ? 0 : Number(formData.paquetesPardos);
    const paquetesJumbos = formData.paquetesJumbos === '' ? 0 : Number(formData.paquetesJumbos);
    const paquetes = [paquetesRosados, paquetesPardos, paquetesJumbos];

    if (paquetes.some((cantidad) => !Number.isSafeInteger(cantidad) || cantidad < 0)) {
      $q.notify({
        type: 'warning',
        message: 'Las cantidades de paquetes deben ser números enteros iguales o mayores a cero.',
        position: 'top',
      });
      return false;
    }

    if (paquetesRosados + paquetesPardos + paquetesJumbos === 0) {
      $q.notify({
        type: 'warning',
        message: 'Ingresa al menos una cantidad de paquetes para registrar el flete.',
        position: 'top',
      });
      return false;
    }

    loading.value = true;
    try {
      await addMovimientoToDexie({
        tipo: 'flete',
        fecha: fechaVisible(fechaLima()),
        entidad: formData.granja.trim(),
        rosadoPrecio: 0,
        pardoPrecio: 0,
        jumboPrecio: 0,
        kilosTotal: 0,
        paquetesTotal: paquetesRosados + paquetesPardos + paquetesJumbos,
        paquetesRosados,
        paquetesPardos,
        paquetesJumbos,
        montoTotal: 0,
      });

      $q.notify({
        type: 'positive',
        message: `Flete de ${formData.granja} guardado en este dispositivo`,
        icon: 'check_circle',
        position: 'top',
      });

      await loadData();
      void router.push('/viaje');
      return true;
    } catch (err) {
      console.error('Error al guardar flete:', err);
      $q.notify({
        type: 'negative',
        message: err instanceof Error ? err.message : 'No se pudo guardar el flete.',
        position: 'top',
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function eliminarMovimiento(id: string) {
    await deleteMovimientoFromDexie(id);
    await loadData();
    $q.notify({
      type: 'info',
      message: 'Movimiento eliminado',
      position: 'top',
    });
  }

  async function actualizarFlete(id: string, data: EditarFleteData): Promise<boolean> {
    const granja = data.granja.trim();
    const paquetes = [data.paquetesRosados, data.paquetesPardos, data.paquetesJumbos];

    if (!granja) {
      $q.notify({
        type: 'warning',
        message: 'Ingresa el nombre de la granja.',
        position: 'top',
      });
      return false;
    }

    if (paquetes.some((cantidad) => !Number.isSafeInteger(cantidad) || cantidad < 0)) {
      $q.notify({
        type: 'warning',
        message: 'Las cantidades deben ser números enteros iguales o mayores a cero.',
        position: 'top',
      });
      return false;
    }

    if (paquetes.every((cantidad) => cantidad === 0)) {
      $q.notify({
        type: 'warning',
        message: 'El flete debe tener al menos un paquete.',
        position: 'top',
      });
      return false;
    }

    loading.value = true;
    try {
      await updateFleteFromDexie(id, {
        entidad: granja,
        paquetesRosados: data.paquetesRosados,
        paquetesPardos: data.paquetesPardos,
        paquetesJumbos: data.paquetesJumbos,
      });
      await loadData();
      $q.notify({
        type: 'positive',
        message: 'Flete actualizado correctamente.',
        position: 'top',
      });
      return true;
    } catch (err) {
      console.error('Error al actualizar flete:', err);
      $q.notify({
        type: 'negative',
        message: 'Ocurrió un error al actualizar el flete.',
        position: 'top',
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  function cerrarViaje() {
    void router.push('/viaje/cierre');
  }

  const { data } = useTransporte();
  watch(data, () => {
    void loadData();
  });

  return {
    loading,
    movimientos,
    resumen,
    loadData,
    registrarCompra,
    registrarVenta,
    registrarFlete,
    eliminarMovimiento,
    actualizarFlete,
    cerrarViaje,
  };
}
