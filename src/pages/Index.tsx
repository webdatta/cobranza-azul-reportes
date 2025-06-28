
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Calendar, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { ClientesForm } from '@/components/ClientesForm';
import { DeudasForm } from '@/components/DeudasForm';
import { ConfiguracionCorreo } from '@/components/ConfiguracionCorreo';
import { useCobranzas } from '@/hooks/useCobranzas';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { resumen, clientesConDeudas, deudasVencenHoy, deudasVencenMañana } = useCobranzas();

  const navegacion = [
    { id: 'dashboard', label: 'Dashboard', icon: DollarSign },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'deudas', label: 'Deudas', icon: Calendar },
    { id: 'configuracion', label: 'Configuración', icon: Mail }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Sistema de Cobranzas</h1>
          <p className="text-blue-100 mt-2">Gestión integral de cobranzas - webdatta.online</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-800">Navegación</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {navegacion.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                          activeTab === item.id ? 'bg-blue-100 border-r-4 border-blue-600 text-blue-800' : 'text-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Resumen Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-800">Total a Cobrar</CardTitle>
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-900">${resumen.totalACobrar.toLocaleString()}</div>
                      <p className="text-xs text-blue-600 mt-1">Ganancia: ${resumen.gananciaToral.toLocaleString()}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-orange-800">Vencen Hoy</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-900">{deudasVencenHoy.length}</div>
                      <p className="text-xs text-orange-600 mt-1">Requiere atención inmediata</p>
                    </CardContent>
                  </Card>

                  <Card className="border-yellow-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-yellow-800">Vencen Mañana</CardTitle>
                      <Calendar className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-900">{deudasVencenMañana.length}</div>
                      <p className="text-xs text-yellow-600 mt-1">Notificar pronto</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Alertas Importantes */}
                {(deudasVencenHoy.length > 0 || deudasVencenMañana.length > 0) && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-red-800 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Alertas de Vencimiento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {deudasVencenHoy.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-800 mb-2">Vencen Hoy:</h4>
                          <div className="space-y-2">
                            {deudasVencenHoy.map((deuda) => (
                              <div key={deuda.id} className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-red-500">
                                <div>
                                  <span className="font-medium">{deuda.cliente}</span>
                                  <span className="text-sm text-gray-600 ml-2">${deuda.monto.toLocaleString()}</span>
                                </div>
                                <Badge variant="destructive">{deuda.estado}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {deudasVencenMañana.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-yellow-800 mb-2">Vencen Mañana:</h4>
                          <div className="space-y-2">
                            {deudasVencenMañana.map((deuda) => (
                              <div key={deuda.id} className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-yellow-500">
                                <div>
                                  <span className="font-medium">{deuda.cliente}</span>
                                  <span className="text-sm text-gray-600 ml-2">${deuda.monto.toLocaleString()}</span>
                                </div>
                                <Badge className="bg-yellow-500">{deuda.estado}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Lista de Clientes con Deudas */}
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-800">Clientes con Deudas Activas</CardTitle>
                    <CardDescription>Resumen de todos los clientes con deudas pendientes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {clientesConDeudas.map((cliente) => (
                        <div key={cliente.id} className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border">
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-900">{cliente.nombre}</h4>
                            <p className="text-sm text-blue-700">{cliente.email}</p>
                            <p className="text-sm text-blue-600">{cliente.telefono}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-900">${cliente.totalDeuda.toLocaleString()}</div>
                            <div className="text-sm text-blue-600">{cliente.deudasActivas} deuda(s)</div>
                          </div>
                        </div>
                      ))}
                      {clientesConDeudas.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No hay clientes con deudas activas</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'clientes' && <ClientesForm />}
            {activeTab === 'deudas' && <DeudasForm />}
            {activeTab === 'configuracion' && <ConfiguracionCorreo />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
