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

// Generar 90 clientes de ejemplo
const generarClientes = (): Cliente[] => {
  const nombres = [
    'Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Luis Rodríguez',
    'Carmen Sánchez', 'José González', 'Isabel Fernández', 'Manuel Díaz', 'Rosa Torres',
    'Antonio Ruiz', 'Francisca Moreno', 'Francisco Jiménez', 'Teresa Álvarez', 'Rafael Romero',
    'Pilar Navarro', 'Miguel Ramos', 'Dolores Gil', 'Pedro Serrano', 'Concepción Blanco',
    'Jesús Vega', 'Josefa Molina', 'Ángel Castro', 'Mercedes Ortega', 'Daniel Delgado',
    'María José Herrera', 'David Peña', 'Antonia Guerrero', 'Alejandro Prieto', 'Encarnación Méndez',
    'Javier Cruz', 'Cristina Iglesias', 'Pablo Vargas', 'Amparo Calvo', 'Adrián Rubio',
    'Esperanza Santana', 'Iván Aguilar', 'Inmaculada Campos', 'Rubén Vázquez', 'Milagros León',
    'Sergio Cabrera', 'Remedios Ramírez', 'Fernando Garrido', 'Soledad Morales', 'Alberto Marín',
    'Araceli Domínguez', 'Roberto Santos', 'Manuela Soto', 'Eduardo Herrero', 'Concepción Lorenzo',
    'Víctor Hidalgo', 'Estrella Montero', 'Ricardo Ibáñez', 'Victoria Durán', 'Ignacio Moya',
    'Purificación Ferrer', 'Raúl Santiago', 'Begoña Caballero', 'Gabriel Carrasco', 'Natividad Nieto',
    'Emilio Cano', 'Rocío Reyes', 'Gonzalo Cortés', 'Virtudes Lozano', 'Marcos Gutiérrez',
    'Ascensión Benítez', 'Enrique Valdés', 'Angustias Moreno', 'Tomás Castillo', 'Sagrario Suárez',
    'Lorenzo Hernández', 'Guillermo Román', 'Nieves Velasco', 'César Medina', 'Amparo Sanz',
    'Salvador Silva', 'Luz Crespo', 'Joaquín Molina', 'Consolación Montoya', 'Andrés Galván',
    'Rosario Pascual', 'Hugo Carmona', 'Milagros Villanueva', 'Arturo Mesa', 'Guadalupe Herrera',
    'Nicolás Espinosa', 'Remedios López', 'Alfredo Rojas', 'Esperanza Aguilera', 'Jaime Flores',
    'Visitación Muñoz', 'Rodrigo Peña', 'Rosario Miranda', 'Félix Gallego', 'Nieves Contreras'
  ];

  const dominios = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'empresa.com', 'negocio.net'];
  
  return nombres.map((nombre, index) => {
    const id = (index + 1).toString();
    const nombreSinEspacios = nombre.toLowerCase().replace(/\s+/g, '').replace(/[áéíóú]/g, (m) => {
      const map = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
      return map[m] || m;
    });
    const dominio = dominios[index % dominios.length];
    const fechaBase = new Date('2024-01-01');
    
    return {
      id,
      nombre,
      email: `${nombreSinEspacios}${index}@${dominio}`,
      telefono: `+52 55 ${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      fechaCreacion: new Date(fechaBase.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000)
    };
  });
};

// Generar deudas para los clientes
const generarDeudas = (clientes: Cliente[]): Deuda[] => {
  const servicios = [
    'Hosting web mensual', 'Dominio anual', 'Desarrollo web', 'Mantenimiento web',
    'Diseño gráfico', 'Marketing digital', 'SEO mensual', 'Tienda online',
    'Aplicación móvil', 'Consultoría IT', 'Backup en la nube', 'SSL certificado',
    'Optimización web', 'Campaña publicitaria', 'Rediseño website', 'E-commerce',
    'Soporte técnico', 'Migración de datos', 'Integración API', 'Sistema CRM'
  ];

  const estados: Deuda['estado'][] = ['Pendiente', 'Vencida', 'Pagada', 'En Proceso'];
  const deudas: Deuda[] = [];
  let deudaId = 1;

  clientes.forEach((cliente, clienteIndex) => {
    // Cada cliente tendrá entre 1 y 4 deudas
    const numDeudas = Math.floor(Math.random() * 4) + 1;
    
    for (let i = 0; i < numDeudas; i++) {
      const servicio = servicios[Math.floor(Math.random() * servicios.length)];
      const costoBase = Math.floor(Math.random() * 8000) + 500; // Entre $500 y $8500
      const margen = 0.3 + Math.random() * 0.5; // Margen entre 30% y 80%
      const monto = Math.floor(costoBase * (1 + margen));
      
      // Fechas de vencimiento variadas
      const diasBase = Math.floor(Math.random() * 60) - 30; // Entre -30 y +30 días desde hoy
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + diasBase);
      
      // Estado basado en la fecha
      let estado: Deuda['estado'] = 'Pendiente';
      if (diasBase < -7) {
        estado = Math.random() > 0.3 ? 'Vencida' : 'En Proceso';
      } else if (diasBase < 0) {
        estado = Math.random() > 0.5 ? 'Vencida' : 'Pendiente';
      } else if (Math.random() > 0.8) {
        estado = 'Pagada';
      }

      deudas.push({
        id: deudaId.toString(),
        clienteId: cliente.id,
        cliente: cliente.nombre,
        fechaVencimiento,
        monto,
        costoProveedor: costoBase,
        estado,
        descripcion: servicio
      });

      deudaId++;
    }
  });

  return deudas;
};

// Generar algunos abonos de ejemplo
const generarAbonosIniciales = (clientes: Cliente[]): Abono[] => {
  const abonos: Abono[] = [];
  const frecuencias: Abono['frecuencia'][] = ['Diario', 'Semanal', 'Quincenal', 'Mensual'];
  
  // Solo algunos clientes tendrán abonos configurados (aproximadamente 20%)
  const clientesConAbonos = clientes.slice(0, 18); // Primeros 18 clientes
  
  clientesConAbonos.forEach((cliente, index) => {
    const frecuencia = frecuencias[Math.floor(Math.random() * frecuencias.length)];
    const montoTotal = Math.floor(Math.random() * 5000) + 1000; // Entre $1000 y $6000
    
    // Fecha de próximo pago
    const diasHastaProximo = Math.floor(Math.random() * 15) - 5; // Entre -5 y +10 días
    const fechaProximoPago = new Date();
    fechaProximoPago.setDate(fechaProximoPago.getDate() + diasHastaProximo);
    
    const estado: Abono['estado'] = diasHastaProximo < -2 ? 'Pendiente' : 'Pendiente';
    
    abonos.push({
      id: (index + 1).toString(),
      clienteId: cliente.id,
      cliente: cliente.nombre,
      frecuencia,
      deudasIncluidas: ['1', '2'], // IDs de ejemplo
      montoTotal,
      fechaCreacion: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      fechaProximoPago,
      estado,
      notas: `Abono ${frecuencia.toLowerCase()} configurado automáticamente`
    });
  });

  return abonos;
};

// Datos de ejemplo con 90 clientes
const clientesIniciales = generarClientes();
const deudasIniciales = generarDeudas(clientesIniciales);
const abonosIniciales = generarAbonosIniciales(clientesIniciales);

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