
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { useCobranzas, Deuda } from '@/hooks/useCobranzas';
import { useToast } from "@/hooks/use-toast";

export const DeudasForm = () => {
  const { clientes, deudas, agregarDeuda, actualizarDeuda, eliminarDeuda } = useCobranzas();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deudaEditando, setDeudaEditando] = useState<Deuda | null>(null);
  const [formData, setFormData] = useState({
    clienteId: '',
    cliente: '',
    fechaVencimiento: '',
    monto: '',
    costoProveedor: '',
    estado: 'Pendiente' as Deuda['estado'],
    descripcion: ''
  });

  const resetForm = () => {
    setFormData({
      clienteId: '',
      cliente: '',
      fechaVencimiento: '',
      monto: '',
      costoProveedor: '',
      estado: 'Pendiente',
      descripcion: ''
    });
    setDeudaEditando(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clienteId || !formData.fechaVencimiento || !formData.monto || !formData.costoProveedor) {
      toast({
        title: "Error",
        description: "Todos los campos obligatorios deben ser completados",
        variant: "destructive"
      });
      return;
    }

    const clienteSeleccionado = clientes.find(c => c.id === formData.clienteId);
    if (!clienteSeleccionado) {
      toast({
        title: "Error",
        description: "Cliente no encontrado",
        variant: "destructive"
      });
      return;
    }

    try {
      const deudaData = {
        clienteId: formData.clienteId,
        cliente: clienteSeleccionado.nombre,
        fechaVencimiento: new Date(formData.fechaVencimiento),
        monto: parseFloat(formData.monto),
        costoProveedor: parseFloat(formData.costoProveedor),
        estado: formData.estado,
        descripcion: formData.descripcion || undefined
      };

      if (deudaEditando) {
        actualizarDeuda(deudaEditando.id, deudaData);
        toast({
          title: "Deuda actualizada",
          description: `La deuda de ${clienteSeleccionado.nombre} ha sido actualizada`
        });
      } else {
        agregarDeuda(deudaData);
        toast({
          title: "Deuda agregada",
          description: `Se agregó una nueva deuda para ${clienteSeleccionado.nombre}`
        });
      }
      
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la deuda",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (deuda: Deuda) => {
    setDeudaEditando(deuda);
    setFormData({
      clienteId: deuda.clienteId,
      cliente: deuda.cliente,
      fechaVencimiento: deuda.fechaVencimiento.toISOString().split('T')[0],
      monto: deuda.monto.toString(),
      costoProveedor: deuda.costoProveedor.toString(),
      estado: deuda.estado,
      descripcion: deuda.descripcion || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = (deuda: Deuda) => {
    if (confirm(`¿Estás seguro de eliminar esta deuda de ${deuda.cliente}?`)) {
      eliminarDeuda(deuda.id);
      toast({
        title: "Deuda eliminada",
        description: `La deuda de ${deuda.cliente} ha sido eliminada`
      });
    }
  };

  const getEstadoBadgeVariant = (estado: Deuda['estado']) => {
    switch (estado) {
      case 'Pagada': return 'default';
      case 'Pendiente': return 'secondary';
      case 'Vencida': return 'destructive';
      case 'En Proceso': return 'outline';
      default: return 'secondary';
    }
  };

  const getEstadoColor = (estado: Deuda['estado']) => {
    switch (estado) {
      case 'Pagada': return 'text-green-600';
      case 'Pendiente': return 'text-blue-600';
      case 'Vencida': return 'text-red-600';
      case 'En Proceso': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200">
        <CardHeader className="bg-blue-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-blue-800">Gestión de Deudas</CardTitle>
              <CardDescription>Administra las deudas de tus clientes</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Deuda
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-blue-800">
                    {deudaEditando ? 'Editar Deuda' : 'Nueva Deuda'}
                  </DialogTitle>
                  <DialogDescription>
                    {deudaEditando ? 'Modifica la información de la deuda' : 'Ingresa los datos de la nueva deuda'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="cliente">Cliente</Label>
                      <Select 
                        value={formData.clienteId} 
                        onValueChange={(value) => {
                          const cliente = clientes.find(c => c.id === value);
                          setFormData(prev => ({ 
                            ...prev, 
                            clienteId: value,
                            cliente: cliente?.nombre || ''
                          }));
                        }}
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
                      <Label htmlFor="monto">Monto a cobrar</Label>
                      <Input
                        id="monto"
                        type="number"
                        step="0.01"
                        value={formData.monto}
                        onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="costoProveedor">Costo proveedor</Label>
                      <Input
                        id="costoProveedor"
                        type="number"
                        step="0.01"
                        value={formData.costoProveedor}
                        onChange={(e) => setFormData(prev => ({ ...prev, costoProveedor: e.target.value }))}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fechaVencimiento">Fecha de vencimiento</Label>
                      <Input
                        id="fechaVencimiento"
                        type="date"
                        value={formData.fechaVencimiento}
                        onChange={(e) => setFormData(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Select 
                        value={formData.estado} 
                        onValueChange={(value: Deuda['estado']) => setFormData(prev => ({ ...prev, estado: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="En Proceso">En Proceso</SelectItem>
                          <SelectItem value="Vencida">Vencida</SelectItem>
                          <SelectItem value="Pagada">Pagada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="descripcion">Descripción (opcional)</Label>
                      <Input
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                        placeholder="Ej: Servicio de hosting mensual"
                      />
                    </div>
                  </div>
                  
                  {formData.monto && formData.costoProveedor && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="text-sm text-blue-800">
                        <strong>Ganancia: ${(parseFloat(formData.monto) - parseFloat(formData.costoProveedor)).toFixed(2)}</strong>
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
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {deudaEditando ? 'Actualizar' : 'Agregar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {deudas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No hay deudas registradas</p>
              <p className="text-sm text-gray-400">Comienza agregando la primera deuda</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Ganancia</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deudas.map((deuda) => {
                  const ganancia = deuda.monto - deuda.costoProveedor;
                  const diasVencimiento = Math.ceil((deuda.fechaVencimiento.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <TableRow key={deuda.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-blue-900">{deuda.cliente}</div>
                          {deuda.descripcion && (
                            <div className="text-sm text-gray-500">{deuda.descripcion}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-blue-600" />
                          <span className="font-semibold">{deuda.monto.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Costo: ${deuda.costoProveedor.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-semibold ${ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${ganancia.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="text-sm">{deuda.fechaVencimiento.toLocaleDateString()}</span>
                        </div>
                        {diasVencimiento < 0 && (
                          <div className="text-xs text-red-600">Vencida hace {Math.abs(diasVencimiento)} día(s)</div>
                        )}
                        {diasVencimiento === 0 && (
                          <div className="text-xs text-orange-600">Vence hoy</div>
                        )}
                        {diasVencimiento === 1 && (
                          <div className="text-xs text-yellow-600">Vence mañana</div>
                        )}
                        {diasVencimiento > 1 && (
                          <div className="text-xs text-gray-500">En {diasVencimiento} día(s)</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(deuda.estado)} className={getEstadoColor(deuda.estado)}>
                          {deuda.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(deuda)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(deuda)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
