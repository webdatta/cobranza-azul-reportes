
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { useCobranzas, Cliente } from '@/hooks/useCobranzas';
import { useToast } from "@/hooks/use-toast";

export const ClientesForm = () => {
  const { clientes, agregarCliente, actualizarCliente, eliminarCliente } = useCobranzas();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });

  const resetForm = () => {
    setFormData({ nombre: '', email: '', telefono: '' });
    setClienteEditando(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.email || !formData.telefono) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      if (clienteEditando) {
        actualizarCliente(clienteEditando.id, formData);
        toast({
          title: "Cliente actualizado",
          description: `${formData.nombre} ha sido actualizado correctamente`
        });
      } else {
        agregarCliente(formData);
        toast({
          title: "Cliente agregado",
          description: `${formData.nombre} ha sido agregado correctamente`
        });
      }
      
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el cliente",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono
    });
    setDialogOpen(true);
  };

  const handleDelete = (cliente: Cliente) => {
    if (confirm(`¿Estás seguro de eliminar a ${cliente.nombre}? Esto también eliminará todas sus deudas.`)) {
      eliminarCliente(cliente.id);
      toast({
        title: "Cliente eliminado",
        description: `${cliente.nombre} ha sido eliminado correctamente`
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200">
        <CardHeader className="bg-blue-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-blue-800">Gestión de Clientes</CardTitle>
              <CardDescription>Administra la información de tus clientes</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-blue-800">
                    {clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </DialogTitle>
                  <DialogDescription>
                    {clienteEditando ? 'Modifica la información del cliente' : 'Ingresa los datos del nuevo cliente'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre completo</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej: Juan Pérez"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Ej: juan@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="Ej: +1234567890"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {clienteEditando ? 'Actualizar' : 'Agregar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {clientes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No hay clientes registrados</p>
              <p className="text-sm text-gray-400">Comienza agregando tu primer cliente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Fecha de registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div className="font-medium text-blue-900">{cliente.nombre}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-3 h-3 mr-1" />
                          {cliente.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-3 h-3 mr-1" />
                          {cliente.telefono}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {cliente.fechaCreacion.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(cliente)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(cliente)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
