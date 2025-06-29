import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, DollarSign, Check, Clock, Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import { useCobranzas, Abono } from '@/hooks/useCobranzas';
import { useToast } from "@/hooks/use-toast";

export const AbonosForm = () => {
  const { clientes, deudas, abonos, agregarAbono, marcarAbonoPagado } = useCobranzas();
  const { toast } = useToast();
  
  // Estados del componente
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [montoDisponible, setMontoDisponible] = useState('');
  const [clientesSeleccionados, setClientesSeleccionados] = useState<string[]>([]);
  const [clientesPendientesSeleccionados, setClientesPendientesSeleccionados] = useState<string[]>([]);
  const [modalLoteOpen, setModalLoteOpen] = useState(false);
  const [observacionesLote, setObservacionesLote] = useState('');
  const [imagenTransferencia, setImagenTransferencia] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    frecuencia: 'Mensual' as Abono['frecuencia'],
    deudasSeleccionadas: [] as string[],
    notas: ''
  });

  // Función para resetear formulario
  const resetForm = () => {
    setFormData({
      frecuencia: 'Mensual',
      deudasSeleccionadas: [],
      notas: ''
    });
    setClienteSeleccionado('');
  };

  // Calcular fecha próximo pago
  const calcularFechaProximoPago = (frecuencia: Abono['frecuencia']) => {
    const hoy = new Date();
    switch (frecuencia) {
      case 'Diario': return new Date(hoy.getTime() + 1 * 24 * 60 * 60 * 1000);
      case 'Semanal': return new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'Quincenal': return new Date(hoy.getTime() + 15 * 24 * 60 * 60 * 1000);
      case 'Mensual': return new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
      default: return new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  };

  // Calcular total de clientes pendientes seleccionados
  const calcularTotalClientesPendientes = () => {
    return clientesPendientesSeleccionados.reduce((total, clienteId) => {
      const deudasCliente = deudas.filter(d => d.clienteId === clienteId && d.estado !== 'Pagada');
      const totalCliente = deudasCliente.reduce((sum, deuda) => sum + deuda.costoProveedor, 0);
      return total + totalCliente;
    }, 0);
  };

  // Calcular qué abonos se pueden cubrir con el monto disponible
  const calcularAbonosPosibles = () => {
    const monto = parseFloat(montoDisponible) || 0;
    if (monto <= 0) return { abonosPosibles: [], totalCubierto: 0, sobrante: 0, clientesCubiertos: 0 };

    // OPCIÓN 1: Calcular basado en abonos ya configurados (pendientes)
    const abonosPendientes = abonos
      .filter(abono => abono.estado === 'Pendiente')
      .sort((a, b) => a.fechaProximoPago.getTime() - b.fechaProximoPago.getTime());

    // OPCIÓN 2: Calcular basado en clientes que necesitan abonos (SIN abonos configurados)
    const clientesSinAbonos = clientes.filter(cliente => {
      const tieneDeudas = deudas.some(d => d.clienteId === cliente.id && d.estado !== 'Pagada');
      const tieneAbonosActivos = abonos.some(a => a.clienteId === cliente.id && a.estado === 'Pendiente');
      return tieneDeudas && !tieneAbonosActivos;
    }).map(cliente => {
      const deudasCliente = deudas.filter(d => d.clienteId === cliente.id && d.estado !== 'Pagada');
      const totalCostoProveedor = deudasCliente.reduce((total, deuda) => total + deuda.costoProveedor, 0);
      const deudaMasAntigua = deudasCliente.reduce((antigua, actual) => 
        actual.fechaVencimiento < antigua.fechaVencimiento ? actual : antigua
      );
      
      return {
        id: `temp-${cliente.id}`,
        clienteId: cliente.id,
        cliente: cliente.nombre,
        montoTotal: totalCostoProveedor,
        fechaProximoPago: deudaMasAntigua.fechaVencimiento,
        cantidadDeudas: deudasCliente.length,
        tipo: 'sin_abono' as const
      };
    }).sort((a, b) => a.fechaProximoPago.getTime() - b.fechaProximoPago.getTime());

    // Combinar ambas listas: abonos configurados + clientes sin abonos
    const todosPosiblesAbonos = [
      ...abonosPendientes.map(a => ({ ...a, tipo: 'configurado' as const })),
      ...clientesSinAbonos
    ].sort((a, b) => a.fechaProximoPago.getTime() - b.fechaProximoPago.getTime());

    const abonosPosibles = [];
    let montoRestante = monto;
    let totalCubierto = 0;

    for (const abono of todosPosiblesAbonos) {
      if (montoRestante >= abono.montoTotal) {
        abonosPosibles.push({
          ...abono,
          prioridad: abonosPosibles.length + 1
        });
        montoRestante -= abono.montoTotal;
        totalCubierto += abono.montoTotal;
      }
    }

    return {
      abonosPosibles,
      totalCubierto,
      sobrante: montoRestante,
      clientesCubiertos: abonosPosibles.length
    };
  };

  const resultadoCalculo = calcularAbonosPosibles();

  // Calcular totales solo de los seleccionados
  const calculoSeleccionados = {
    abonosSeleccionados: resultadoCalculo.abonosPosibles.filter(item => clientesSeleccionados.includes(item.id)),
    totalSeleccionado: resultadoCalculo.abonosPosibles
      .filter(item => clientesSeleccionados.includes(item.id))
      .reduce((total, item) => total + item.montoTotal, 0),
    clientesSeleccionados: clientesSeleccionados.length
  };

  // Funciones para manejar selección calculadora
  const toggleSeleccionCliente = (itemId: string) => {
    setClientesSeleccionados(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const seleccionarTodos = () => {
    setClientesSeleccionados(resultadoCalculo.abonosPosibles.map(item => item.id));
  };

  const deseleccionarTodos = () => {
    setClientesSeleccionados([]);
  };

  // Funciones para clientes pendientes
  const toggleSeleccionClientePendiente = (clienteId: string) => {
    setClientesPendientesSeleccionados(prev => 
      prev.includes(clienteId) 
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    );
  };

  const seleccionarTodosClientesPendientes = () => {
    const clientesConDeudasSinAbonos = clientes.filter(cliente => {
      const tieneDeudas = deudas.some(d => d.clienteId === cliente.id && d.estado !== 'Pagada');
      const tieneAbonosActivos = abonos.some(a => a.clienteId === cliente.id && a.estado === 'Pendiente');
      return tieneDeudas && !tieneAbonosActivos;
    });
    setClientesPendientesSeleccionados(clientesConDeudasSinAbonos.map(c => c.id));
  };

  const deseleccionarTodosClientesPendientes = () => {
    setClientesPendientesSeleccionados([]);
  };

  // Resetear selección cuando cambie el monto
  const handleMontoChange = (valor: string) => {
    setMontoDisponible(valor);
    setClientesSeleccionados([]);
  };

  // Obtener deudas pendientes del cliente seleccionado
  const deudasDelCliente = clienteSeleccionado 
    ? deudas.filter(d => d.clienteId === clienteSeleccionado && d.estado !== 'Pagada')
    : [];

  // Calcular total de las deudas seleccionadas
  const montoTotal = formData.deudasSeleccionadas.reduce((total, deudaId) => {
    const deuda = deudas.find(d => d.id === deudaId);
    return total + (deuda?.costoProveedor || 0);
  }, 0);

  // Función para procesar lote de clientes pendientes
  const procesarLoteClientesPendientes = () => {
    if (clientesPendientesSeleccionados.length === 0) {
      toast({
        title: "⚠️ Sin selección",
        description: "Selecciona al menos un cliente para abonar",
        variant: "destructive"
      });
      return;
    }

    let abonos_creados = 0;
    const totalProcesado = calcularTotalClientesPendientes();
    
    clientesPendientesSeleccionados.forEach(clienteId => {
      const cliente = clientes.find(c => c.id === clienteId);
      const deudasCliente = deudas.filter(d => d.clienteId === clienteId && d.estado !== 'Pagada');
      
      if (cliente && deudasCliente.length > 0) {
        const totalCostoProveedor = deudasCliente.reduce((total, deuda) => total + deuda.costoProveedor, 0);
        
        const nuevoAbono = {
          clienteId: clienteId,
          cliente: cliente.nombre,
          frecuencia: 'Mensual' as const,
          deudasIncluidas: deudasCliente.map(d => d.id),
          montoTotal: totalCostoProveedor,
          fechaCreacion: new Date(),
          fechaProximoPago: calcularFechaProximoPago('Mensual'),
          estado: 'Pagado' as const,
          notas: `Abono procesado en lote - ${observacionesLote || 'Sin observaciones'}`
        };
        
        agregarAbono(nuevoAbono);
        abonos_creados++;
      }
    });

    toast({
      title: "✅ Lote procesado exitosamente",
      description: `Se crearon ${abonos_creados} abonos por un total de $${totalProcesado.toLocaleString()}${imagenTransferencia ? ' con comprobante adjunto' : ''}`
    });

    // Limpiar estados
    setClientesPendientesSeleccionados([]);
    setModalLoteOpen(false);
    setObservacionesLote('');
    setImagenTransferencia(null);
  };

  const ejecutarAbonosCalculados = () => {
    const abonosAEjecutar = calculoSeleccionados.abonosSeleccionados;
    
    if (abonosAEjecutar.length === 0) {
      toast({
        title: "⚠️ Sin selección",
        description: "Selecciona al menos un cliente/abono para ejecutar",
        variant: "destructive"
      });
      return;
    }

    let abonos_pagados = 0;
    let abonos_creados = 0;
    
    abonosAEjecutar.forEach(item => {
      if (item.tipo === 'configurado') {
        marcarAbonoPagado(item.id);
        abonos_pagados++;
      } else if (item.tipo === 'sin_abono') {
        const cliente = clientes.find(c => c.id === item.clienteId);
        const deudasCliente = deudas.filter(d => d.clienteId === item.clienteId && d.estado !== 'Pagada');
        
        if (cliente && deudasCliente.length > 0) {
          const nuevoAbono = {
            clienteId: item.clienteId,
            cliente: cliente.nombre,
            frecuencia: 'Mensual' as const,
            deudasIncluidas: deudasCliente.map(d => d.id),
            montoTotal: item.montoTotal,
            fechaCreacion: new Date(),
            fechaProximoPago: calcularFechaProximoPago('Mensual'),
            estado: 'Pagado' as const,
            notas: `Abono creado y pagado automáticamente desde calculadora`
          };
          
          agregarAbono(nuevoAbono);
          abonos_creados++;
        }
      }
    });

    toast({
      title: "✅ Abonos ejecutados exitosamente",
      description: `${abonos_pagados} abonos marcados como pagados y ${abonos_creados} abonos nuevos creados por un total de $${calculoSeleccionados.totalSeleccionado.toLocaleString()}`
    });

    setMontoDisponible('');
    setClientesSeleccionados([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteSeleccionado || formData.deudasSeleccionadas.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona un cliente y al menos una deuda",
        variant: "destructive"
      });
      return;
    }

    const cliente = clientes.find(c => c.id === clienteSeleccionado);
    if (!cliente) return;

    try {
      const abonoData = {
        clienteId: clienteSeleccionado,
        cliente: cliente.nombre,
        frecuencia: formData.frecuencia,
        deudasIncluidas: formData.deudasSeleccionadas,
        montoTotal,
        fechaCreacion: new Date(),
        fechaProximoPago: calcularFechaProximoPago(formData.frecuencia),
        estado: 'Pendiente' as const,
        notas: formData.notas || undefined
      };

      agregarAbono(abonoData);
      toast({
        title: "Abono creado",
        description: `Se creó el abono ${formData.frecuencia.toLowerCase()} para ${cliente.nombre}`
      });
      
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el abono",
        variant: "destructive"
      });
    }
  };

  const handleMarcarPagado = (abono: Abono) => {
    marcarAbonoPagado(abono.id);
    toast({
      title: "Abono marcado como pagado",
      description: `El abono de ${abono.cliente} ha sido marcado como pagado`
    });
  };

  const toggleDeudaSeleccionada = (deudaId: string) => {
    setFormData(prev => ({
      ...prev,
      deudasSeleccionadas: prev.deudasSeleccionadas.includes(deudaId)
        ? prev.deudasSeleccionadas.filter(id => id !== deudaId)
        : [...prev.deudasSeleccionadas, deudaId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Calculadora de Abonos */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-green-800 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Calculadora de Abonos
              </CardTitle>
              <CardDescription>Calcula cuántos clientes/abonos puedes cubrir con tu presupuesto disponible</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input de Monto */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="montoDisponible" className="text-green-800 font-semibold">
                  💰 Monto disponible para abonos/pagos
                </Label>
                <Input
                  id="montoDisponible"
                  type="number"
                  step="0.01"
                  value={montoDisponible}
                  onChange={(e) => handleMontoChange(e.target.value)}
                  placeholder="Ej: 5000.00"
                  className="text-lg font-semibold border-green-300 focus:border-green-500"
                />
              </div>
              
              {montoDisponible && (
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Resumen del Cálculo
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Abonos/Clientes disponibles:</span>
                      <span className="font-bold text-blue-700">{resultadoCalculo.clientesCubiertos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Abonos/Clientes seleccionados:</span>
                      <span className="font-bold text-green-700">{calculoSeleccionados.clientesSeleccionados}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total seleccionado:</span>
                      <span className="font-bold text-green-700">${calculoSeleccionados.totalSeleccionado.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sobrante:</span>
                      <span className="font-bold text-blue-700">${(parseFloat(montoDisponible) - calculoSeleccionados.totalSeleccionado).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {calculoSeleccionados.clientesSeleccionados > 0 && (
                    <Button 
                      className="w-full mt-3 bg-green-600 hover:bg-green-700"
                      onClick={ejecutarAbonosCalculados}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Ejecutar Pagos Seleccionados ({calculoSeleccionados.clientesSeleccionados})
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Lista de Abonos Posibles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-green-800 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Abonos/Clientes que puedes cubrir (orden de prioridad)
                </h4>
                {resultadoCalculo.abonosPosibles.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={seleccionarTodos}
                      className="text-xs text-green-600 border-green-200"
                    >
                      Seleccionar Todos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deseleccionarTodos}
                      className="text-xs text-gray-600 border-gray-200"
                    >
                      Limpiar
                    </Button>
                  </div>
                )}
              </div>
              
              {resultadoCalculo.abonosPosibles.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {resultadoCalculo.abonosPosibles.map((item, index) => {
                    const diasVencimiento = Math.ceil((item.fechaProximoPago.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const esClienteSinAbono = item.tipo === 'sin_abono';
                    
                    return (
                      <div key={item.id} className={`bg-white p-3 rounded border-l-4 shadow-sm transition-all ${
                        clientesSeleccionados.includes(item.id) 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 hover:border-green-300'
                      }`}>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`checkbox-${item.id}`}
                            checked={clientesSeleccionados.includes(item.id)}
                            onCheckedChange={() => toggleSeleccionCliente(item.id)}
                            className="mt-1"
                          />
                          <div className="flex justify-between items-start flex-1">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-green-700 border-green-300">
                                  #{index + 1}
                                </Badge>
                                <span className="font-medium text-green-900">{item.cliente}</span>
                                {esClienteSinAbono ? (
                                  <Badge className="text-xs bg-blue-500">Crear Abono</Badge>
                                ) : (
                                  <Badge className="text-xs bg-gray-500">Ya Configurado</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {esClienteSinAbono ? (
                                  `${item.cantidadDeudas} deuda(s) • Nuevo abono mensual`
                                ) : (
                                  `${item.frecuencia} • ${item.deudasIncluidas?.length || 0} deuda(s)`
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {esClienteSinAbono ? 'Basado en deudas pendientes' : `Vence: ${item.fechaProximoPago.toLocaleDateString()}`}
                                {diasVencimiento <= 0 && <span className="text-red-600 ml-1">(Vencido)</span>}
                                {diasVencimiento === 1 && <span className="text-orange-600 ml-1">(Vence mañana)</span>}
                              </div>
                            </div>
                            <div className="text-right ml-3">
                              <div className="font-bold text-green-800">${item.montoTotal.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {montoDisponible ? 
                    "No hay abonos pendientes ni clientes que puedas cubrir con este monto" : 
                    "Ingresa un monto para ver qué abonos/clientes puedes cubrir"
                  }
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clientes Pendientes de Abonar */}
      <Card className="border-orange-200">
        <CardHeader className="bg-orange-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-orange-800 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Clientes Pendientes de Abonar
              </CardTitle>
              <CardDescription>Clientes con deudas que aún no tienen abonos configurados</CardDescription>
            </div>
            {(() => {
              const totalSeleccionado = calcularTotalClientesPendientes();
              return clientesPendientesSeleccionados.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-orange-800">
                      {clientesPendientesSeleccionados.length} cliente(s) seleccionado(s)
                    </div>
                    <div className="text-lg font-bold text-orange-900">
                      Total: ${totalSeleccionado.toLocaleString()}
                    </div>
                  </div>
                  <Button
                    onClick={() => setModalLoteOpen(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Abonar Lote Clientes
                  </Button>
                </div>
              );
            })()}
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            // Obtener clientes que tienen deudas pendientes pero no tienen abonos activos
            const clientesConDeudasSinAbonos = clientes.filter(cliente => {
              const tieneDeudas = deudas.some(d => d.clienteId === cliente.id && d.estado !== 'Pagada');
              const tieneAbonosActivos = abonos.some(a => a.clienteId === cliente.id && a.estado === 'Pendiente');
              return tieneDeudas && !tieneAbonosActivos;
            }).map(cliente => {
              const deudasCliente = deudas.filter(d => d.clienteId === cliente.id && d.estado !== 'Pagada');
              const totalDeuda = deudasCliente.reduce((total, deuda) => total + deuda.costoProveedor, 0);
              
              let deudaMasAntigua = null;
              let diasVencida = 0;
              
              if (deudasCliente.length > 0) {
                deudaMasAntigua = deudasCliente.reduce((antigua, actual) => 
                  actual.fechaVencimiento < antigua.fechaVencimiento ? actual : antigua
                );
                diasVencida = Math.floor((Date.now() - deudaMasAntigua.fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));
                diasVencida = Math.max(0, diasVencida);
              }
              
              return {
                ...cliente,
                totalDeuda,
                cantidadDeudas: deudasCliente.length,
                diasVencida,
                deudaMasAntigua
              };
            }).sort((a, b) => b.diasVencida - a.diasVencida);

            return clientesConDeudasSinAbonos.length > 0 ? (
              <div className="space-y-3">
                {/* Controles de selección */}
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded border">
                  <span className="text-sm text-orange-800 font-medium">
                    Seleccionar clientes para abonar en lote:
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={seleccionarTodosClientesPendientes}
                      className="text-xs text-orange-600 border-orange-200"
                    >
                      Seleccionar Todos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deseleccionarTodosClientesPendientes}
                      className="text-xs text-gray-600 border-gray-200"
                    >
                      Limpiar
                    </Button>
                  </div>
                </div>

                {/* Lista de clientes */}
                {clientesConDeudasSinAbonos.map((cliente) => (
                  <div key={cliente.id} className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                    clientesPendientesSeleccionados.includes(cliente.id) 
                      ? 'bg-orange-100 border-orange-300' 
                      : 'bg-orange-50 border-orange-200 hover:border-orange-300'
                  }`}>
                    <Checkbox
                      id={`cliente-${cliente.id}`}
                      checked={clientesPendientesSeleccionados.includes(cliente.id)}
                      onCheckedChange={() => toggleSeleccionClientePendiente(cliente.id)}
                    />
                    <div className="flex justify-between items-center flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-orange-900">{cliente.nombre}</h4>
                          {cliente.diasVencida > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {cliente.diasVencida} días vencido
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-orange-700">{cliente.email}</p>
                        <p className="text-sm text-orange-600">
                          {cliente.cantidadDeudas} deuda(s) • Total: ${cliente.totalDeuda.toLocaleString()}
                        </p>
                        {cliente.deudaMasAntigua && (
                          <p className="text-xs text-orange-500">
                            Deuda más antigua: {cliente.deudaMasAntigua.fechaVencimiento.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setClienteSeleccionado(cliente.id);
                          setDialogOpen(true);
                        }}
                        className="text-orange-600 border-orange-200 hover:bg-orange-100"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Crear Abono Individual
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Check className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>¡Excelente! Todos los clientes con deudas ya tienen abonos configurados</p>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Modal de Confirmación para Lote */}
      <Dialog open={modalLoteOpen} onOpenChange={setModalLoteOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-orange-800">Confirmar Abono de Lote</DialogTitle>
            <DialogDescription>
              Vas a crear abonos para {clientesPendientesSeleccionados.length} cliente(s) por un total de ${calcularTotalClientesPendientes().toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Resumen de clientes seleccionados */}
            <div className="bg-orange-50 p-3 rounded border">
              <h4 className="font-semibold text-orange-800 mb-2">Clientes a procesar:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {clientesPendientesSeleccionados.map(clienteId => {
                  const cliente = clientes.find(c => c.id === clienteId);
                  const deudasCliente = deudas.filter(d => d.clienteId === clienteId && d.estado !== 'Pagada');
                  const total = deudasCliente.reduce((sum, d) => sum + d.costoProveedor, 0);
                  return (
                    <div key={clienteId} className="flex justify-between text-sm">
                      <span>{cliente?.nombre}</span>
                      <span className="font-medium">${total.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Campo de observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Input
                id="observaciones"
                value={observacionesLote}
                onChange={(e) => setObservacionesLote(e.target.value)}
                placeholder="Ej: Transferencia realizada el día de hoy"
              />
            </div>

            {/* Campo para imagen */}
            <div className="space-y-2">
              <Label htmlFor="comprobante">Comprobante de Transferencia (opcional)</Label>
              <Input
                id="comprobante"
                type="file"
                accept="image/*"
                onChange={(e) => setImagenTransferencia(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {imagenTransferencia && (
                <p className="text-xs text-green-600">
                  ✅ Archivo seleccionado: {imagenTransferencia.name}
                </p>
              )}
            </div>

            {/* Total destacado */}
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <div className="text-center">
                <div className="text-sm text-green-800">Total del lote:</div>
                <div className="text-2xl font-bold text-green-900">
                  ${calcularTotalClientesPendientes().toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalLoteOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={procesarLoteClientesPendientes}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar Abono de Lote
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};