import { useState, useEffect, useMemo } from 'react';

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fechaCreacion: Date;
}

export interface Deuda {
  id: string;
  clienteId: string;
  cliente: string;
  fechaVencimiento: Date;
  monto: number;
  costoProveedor: number;
  estado: 'Pendiente' | 'Vencida' | 'Pagada' | 'En Proceso';
  descripcion?: string;
}

export interface Abono {
  id: string;
  clienteId: string;
  cliente: string;
  frecuencia: 'Diario' | 'Semanal' | 'Quincenal' | 'Mensual';
  deudasIncluidas: string[]; // IDs de las deudas
  montoTotal: number;
  fechaCreacion: Date;
  fechaProximoPago: Date;
  estado: 'Pendiente' | 'Pagado';
  notas?: string;
}

export interface ConfiguracionCorreoData {
  servidorSMTP: string;
  puerto: number;
  usuario: string;
  contraseña: string;
  correoRemitente: string;
  correosDestino: string[];
  horaEnvioReporte: string;
  habilitarNotificaciones: boolean;
}

// Datos de ejemplo
const clientesIniciales: Cliente[] = [
  {
    id: '1',
    nombre: 'Juan Pérez',
    email: 'juan.perez@email.com',
    telefono: '+1234567890',
    fechaCreacion: new Date('2024-01-15')
  },
  {
    id: '2',
    nombre: 'María García',
    email: 'maria.garcia@email.com',
    telefono: '+1234567891',
    fechaCreacion: new Date('2024-02-10')
  },
  {
    id: '3',
    nombre: 'Carlos López',
    email: 'carlos.lopez@email.com',
    telefono: '+1234567892',
    fechaCreacion: new Date('2024-03-05')
  }
];

const deudasIniciales: Deuda[] = [
  {
    id: '1',
    clienteId: '1',
    cliente: 'Juan Pérez',
    fechaVencimiento: new Date(),
    monto: 1500,
    costoProveedor: 1000,
    estado: 'Vencida',
    descripcion: 'Servicio de hosting mensual'
  },
  {
    id: '2',
    clienteId: '2',
    cliente: 'María García',
    fechaVencimiento: new Date(Date.now() + 24 * 60 * 60 * 1000),
    monto: 2500,
    costoProveedor: 1800,
    estado: 'Pendiente',
    descripcion: 'Desarrollo web personalizado'
  },
  {
    id: '3',
    clienteId: '3',
    cliente: 'Carlos López',
    fechaVencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    monto: 800,
    costoProveedor: 500,
    estado: 'Pendiente',
    descripcion: 'Mantenimiento mensual'
  },
  {
    id: '4',
    clienteId: '1',
    cliente: 'Juan Pérez',
    fechaVencimiento: new Date(Date.now() - 24 * 60 * 60 * 1000),
    monto: 1200,
    costoProveedor: 800,
    estado: 'Vencida',
    descripcion: 'Dominio anual'
  }
];

const abonosIniciales: Abono[] = [];

export const useCobranzas = () => {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciales);
  const [deudas, setDeudas] = useState<Deuda[]>(deudasIniciales);
  const [abonos, setAbonos] = useState<Abono[]>(abonosIniciales);
  const [configuracionCorreo, setConfiguracionCorreo] = useState<ConfiguracionCorreoData>({
    servidorSMTP: '',
    puerto: 587,
    usuario: '',
    contraseña: '',
    correoRemitente: '',
    correosDestino: [],
    horaEnvioReporte: '08:00',
    habilitarNotificaciones: true
  });

  // Calcular datos del dashboard
  const resumen = useMemo(() => {
    const deudasPendientes = deudas.filter(d => d.estado !== 'Pagada');
    const totalACobrar = deudasPendientes.reduce((total, deuda) => total + deuda.monto, 0);
    const totalCostos = deudasPendientes.reduce((total, deuda) => total + deuda.costoProveedor, 0);
    const gananciaToral = totalACobrar - totalCostos;

    return {
      totalACobrar,
      totalCostos,
      gananciaToral,
      totalDeudas: deudasPendientes.length
    };
  }, [deudas]);

  // Clientes con deudas activas
  const clientesConDeudas = useMemo(() => {
    return clientes.map(cliente => {
      const deudasCliente = deudas.filter(d => d.clienteId === cliente.id && d.estado !== 'Pagada');
      const totalDeuda = deudasCliente.reduce((total, deuda) => total + deuda.monto, 0);
      
      return {
        ...cliente,
        deudasActivas: deudasCliente.length,
        totalDeuda
      };
    }).filter(cliente => cliente.deudasActivas > 0);
  }, [clientes, deudas]);

  // Deudas que vencen hoy
  const deudasVencenHoy = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    return deudas.filter(deuda => {
      const fechaVencimiento = new Date(deuda.fechaVencimiento);
      fechaVencimiento.setHours(0, 0, 0, 0);
      return fechaVencimiento >= hoy && fechaVencimiento < mañana && deuda.estado !== 'Pagada';
    });
  }, [deudas]);

  // Deudas que vencen mañana
  const deudasVencenMañana = useMemo(() => {
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    mañana.setHours(0, 0, 0, 0);
    const pasadoMañana = new Date(mañana);
    pasadoMañana.setDate(pasadoMañana.getDate() + 1);

    return deudas.filter(deuda => {
      const fechaVencimiento = new Date(deuda.fechaVencimiento);
      fechaVencimiento.setHours(0, 0, 0, 0);
      return fechaVencimiento >= mañana && fechaVencimiento < pasadoMañana && deuda.estado !== 'Pagada';
    });
  }, [deudas]);

  // Funciones CRUD
  const agregarCliente = (cliente: Omit<Cliente, 'id' | 'fechaCreacion'>) => {
    const nuevoCliente: Cliente = {
      ...cliente,
      id: Date.now().toString(),
      fechaCreacion: new Date()
    };
    setClientes(prev => [...prev, nuevoCliente]);
    return nuevoCliente;
  };

  const actualizarCliente = (id: string, datosActualizados: Partial<Cliente>) => {
    setClientes(prev => prev.map(cliente => 
      cliente.id === id ? { ...cliente, ...datosActualizados } : cliente
    ));
  };

  const eliminarCliente = (id: string) => {
    setClientes(prev => prev.filter(cliente => cliente.id !== id));
    setDeudas(prev => prev.filter(deuda => deuda.clienteId !== id));
  };

  const agregarDeuda = (deuda: Omit<Deuda, 'id'>) => {
    const nuevaDeuda: Deuda = {
      ...deuda,
      id: Date.now().toString()
    };
    setDeudas(prev => [...prev, nuevaDeuda]);
    return nuevaDeuda;
  };

  const actualizarDeuda = (id: string, datosActualizados: Partial<Deuda>) => {
    setDeudas(prev => prev.map(deuda => 
      deuda.id === id ? { ...deuda, ...datosActualizados } : deuda
    ));
  };

  const eliminarDeuda = (id: string) => {
    setDeudas(prev => prev.filter(deuda => deuda.id !== id));
  };

  const agregarAbono = (abono: Omit<Abono, 'id'>) => {
    const nuevoAbono: Abono = {
      ...abono,
      id: Date.now().toString()
    };
    setAbonos(prev => [...prev, nuevoAbono]);
    return nuevoAbono;
  };

  const actualizarAbono = (id: string, datosActualizados: Partial<Abono>) => {
    setAbonos(prev => prev.map(abono => 
      abono.id === id ? { ...abono, ...datosActualizados } : abono
    ));
  };

  const eliminarAbono = (id: string) => {
    setAbonos(prev => prev.filter(abono => abono.id !== id));
  };

  const marcarAbonoPagado = (id: string) => {
    setAbonos(prev => prev.map(abono => 
      abono.id === id ? { ...abono, estado: 'Pagado' as const } : abono
    ));
  };

  const actualizarConfiguracionCorreo = (config: ConfiguracionCorreoData) => {
    setConfiguracionCorreo(config);
  };

  return {
    // Datos
    clientes,
    deudas,
    abonos,
    configuracionCorreo,
    resumen,
    clientesConDeudas,
    deudasVencenHoy,
    deudasVencenMañana,
    
    // Funciones
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    agregarDeuda,
    actualizarDeuda,
    eliminarDeuda,
    agregarAbono,
    actualizarAbono,
    eliminarAbono,
    marcarAbonoPagado,
    actualizarConfiguracionCorreo
  };
};
