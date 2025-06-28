
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Mail, Server, Clock, Plus, X } from 'lucide-react';
import { useCobranzas } from '@/hooks/useCobranzas';
import { useToast } from "@/hooks/use-toast";

export const ConfiguracionCorreo = () => {
  const { configuracionCorreo, actualizarConfiguracionCorreo } = useCobranzas();
  const { toast } = useToast();
  const [formData, setFormData] = useState(configuracionCorreo);
  const [nuevoCorreo, setNuevoCorreo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.servidorSMTP || !formData.usuario || !formData.correoRemitente) {
      toast({
        title: "Error",
        description: "Completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      actualizarConfiguracionCorreo(formData);
      toast({
        title: "Configuración guardada",
        description: "La configuración de correo ha sido actualizada correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la configuración",
        variant: "destructive"
      });
    }
  };

  const agregarCorreoDestino = () => {
    if (!nuevoCorreo || !nuevoCorreo.includes('@')) {
      toast({
        title: "Error",
        description: "Ingresa un correo válido",
        variant: "destructive"
      });
      return;
    }

    if (formData.correosDestino.includes(nuevoCorreo)) {
      toast({
        title: "Error",
        description: "Este correo ya está en la lista",
        variant: "destructive"
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      correosDestino: [...prev.correosDestino, nuevoCorreo]
    }));
    setNuevoCorreo('');
  };

  const eliminarCorreoDestino = (correo: string) => {
    setFormData(prev => ({
      ...prev,
      correosDestino: prev.correosDestino.filter(c => c !== correo)
    }));
  };

  const enviarReportePrueba = () => {
    toast({
      title: "Reporte de prueba",
      description: "En un entorno de producción, se enviaría un reporte de prueba a los correos configurados",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-800 flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Configuración de Correo
          </CardTitle>
          <CardDescription>
            Configura el servidor SMTP y los destinatarios para los reportes diarios
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Configuración del servidor SMTP */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                <Server className="w-4 h-4 mr-2" />
                Configuración del Servidor SMTP
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="servidorSMTP">Servidor SMTP *</Label>
                  <Input
                    id="servidorSMTP"
                    value={formData.servidorSMTP}
                    onChange={(e) => setFormData(prev => ({ ...prev, servidorSMTP: e.target.value }))}
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="puerto">Puerto</Label>
                  <Input
                    id="puerto"
                    type="number"
                    value={formData.puerto}
                    onChange={(e) => setFormData(prev => ({ ...prev, puerto: parseInt(e.target.value) }))}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuario SMTP *</Label>
                  <Input
                    id="usuario"
                    value={formData.usuario}
                    onChange={(e) => setFormData(prev => ({ ...prev, usuario: e.target.value }))}
                    placeholder="tu_email@dominio.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contraseña">Contraseña</Label>
                  <Input
                    id="contraseña"
                    type="password"
                    value={formData.contraseña}
                    onChange={(e) => setFormData(prev => ({ ...prev, contraseña: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="correoRemitente">Correo remitente *</Label>
                  <Input
                    id="correoRemitente"
                    type="email"
                    value={formData.correoRemitente}
                    onChange={(e) => setFormData(prev => ({ ...prev, correoRemitente: e.target.value }))}
                    placeholder="reportes@webdatta.online"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Configuración de destinatarios */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-800">Destinatarios de Reportes</h3>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={nuevoCorreo}
                    onChange={(e) => setNuevoCorreo(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    type="email"
                  />
                  <Button type="button" onClick={agregarCorreoDestino} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {formData.correosDestino.length > 0 && (
                  <div className="space-y-2">
                    <Label>Correos configurados:</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.correosDestino.map((correo, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {correo}
                          <button
                            type="button"
                            onClick={() => eliminarCorreoDestino(correo)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Configuración de horarios */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Configuración de Horarios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horaEnvioReporte">Hora de envío del reporte diario</Label>
                  <Input
                    id="horaEnvioReporte"
                    type="time"
                    value={formData.horaEnvioReporte}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaEnvioReporte: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notificaciones habilitadas</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.habilitarNotificaciones}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, habilitarNotificaciones: checked }))}
                    />
                    <span className="text-sm text-gray-600">
                      {formData.habilitarNotificaciones ? 'Activado' : 'Desactivado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-blue-800 mb-2">Información sobre los reportes</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Los reportes se envían diariamente a la hora configurada</li>
                  <li>• Se incluyen todas las deudas con estado "Pendiente" y "Vencida"</li>
                  <li>• Las notificaciones se envían 1 día antes del vencimiento</li>
                  <li>• Los reportes incluyen: cliente, fecha de vencimiento, monto, ganancia y contacto</li>
                </ul>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={enviarReportePrueba}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Enviar Reporte de Prueba
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Guardar Configuración
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
