
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
import { Plus, Calendar, DollarSign, Check, Clock } from 'lucide-react';
import { useCobranzas, Abono } from '@/hooks/useCobranzas';
import { useToast } from "@/hooks/use-toast";

export const AbonosForm = () => {
  const { clientes, deudas, abonos, agregarAbono, marcarAbonoPagado } = useCobranzas();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [formData, setFormData] = useState({
    frecuencia: 'Mensual' as Abono['frecuencia'],
    deudasSeleccionadas: [] as string[],
    notas: ''
  });

  const resetForm = () => {
    setFormData({
      frecuencia: 'Mensual',
      deudasSeleccionadas: [],
      notas: ''
    });
    setClienteSeleccionado('');
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
      <Card className="border-green-200">
        <CardHeader className="bg-green-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-green-800">Gestión de Abonos a Proveedores</CardTitle>
              <CardDescription>Administra los pagos programados a proveedores por cliente</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Abono
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="text-green-800">Nuevo Abono a Proveedor</DialogTitle>
                  <DialogDescription>
                    Crea un abono programado seleccionando cliente y deudas
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cliente">Cliente</Label>
                      <Select 
                        value={clienteSeleccionado} 
                        onValueChange={setClienteSeleccionado}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frecuencia">Frecuencia de pago</Label>
                      <Select 
                        value={formData.frecuencia} 
                        onValueChange={(value: Abono['frecuencia']) => 
                          setFormData(prev => ({ ...prev, frecuencia: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Diario">Diario</SelectItem>
                          <SelectItem value="Semanal">Semanal</SelectItem>
                          <SelectItem value="Quincenal">Quincenal</SelectItem>
                          <SelectItem value="Mensual">Mensual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {clienteSeleccionado && deudasDelCliente.length > 0 && (
                    <div className="space-y-2">
                      <Label>Deudas a incluir en el abono</Label>
                      <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                        {deudasDelCliente.map((deuda) => (
                          <div key={deuda.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={deuda.id}
                              checked={formData.deudasSeleccionadas.includes(deuda.id)}
                              onCheckedChange={() => toggleDeudaSeleccionada(deuda.id)}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{deuda.descripcion || 'Sin descripción'}</div>
                              <div className="text-xs text-gray-500">
                                Costo proveedor: ${deuda.costoProveedor.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas (opcional)</Label>
                    <Input
                      id="notas"
                      value={formData.notas}
                      onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                      placeholder="Ej: Pago quincenal al proveedor X"
                    />
                  </div>
                  
                  {montoTotal > 0 && (
                    <div className="bg-green-50 p-3 rounded-md">
                      <div className="text-sm text-green-800">
                        <strong>Total a pagar al proveedor: ${montoTotal.toLocaleString()}</strong>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Próximo pago: {calcularFechaProximoPago(formData.frecuencia).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      Crear Abono
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {abonos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No hay abonos registrados</p>
              <p className="text-sm text-gray-400">Comienza creando el primer abono</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Próximo Pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abonos.map((abono) => {
                  const diasProximoPago = Math.ceil((abono.fechaProximoPago.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <TableRow key={abono.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-green-900">{abono.cliente}</div>
                          <div className="text-sm text-gray-500">{abono.deudasIncluidas.length} deuda(s)</div>
                          {abono.notas && (
                            <div className="text-xs text-gray-400">{abono.notas}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-700">
                          {abono.frecuencia}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                          <span className="font-semibold">{abono.montoTotal.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="text-sm">{abono.fechaProximoPago.toLocaleDateString()}</span>
                        </div>
                        {diasProximoPago <= 0 && abono.estado === 'Pendiente' && (
                          <div className="text-xs text-red-600">Vencido</div>
                        )}
                        {diasProximoPago === 1 && abono.estado === 'Pendiente' && (
                          <div className="text-xs text-orange-600">Vence mañana</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {abono.estado === 'Pagado' ? (
                          <Badge className="bg-green-500">
                            <Check className="w-3 h-3 mr-1" />
                            Pagado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {abono.estado === 'Pendiente' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarcarPagado(abono)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Marcar Pagado
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
