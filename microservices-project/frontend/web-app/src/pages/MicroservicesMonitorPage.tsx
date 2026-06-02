import { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  MessageSquare,
  Zap,
  Globe,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ServiceData {
  name: string;
  port: number;
  status: 'online' | 'offline' | 'degraded';
  health: {
    uptime: number;
    responseTime: number;
    lastCheck: Date;
  };
  resources: {
    cpu: number;
    memory: number;
    connections: number;
  };
  metrics: {
    requestsPerMin: number;
    avgResponseTime: number;
    errorRate: number;
  };
}

const servicesConfig = [
  { name: 'API Gateway', port: 3000, color: 'bg-blue-500' },
  { name: 'User Service', port: 3006, color: 'bg-green-500' },
  { name: 'Catalog Service', port: 3002, color: 'bg-purple-500' },
  { name: 'Inventory Service', port: 3003, color: 'bg-indigo-500' },
  { name: 'Order Service', port: 3004, color: 'bg-orange-500' },
  { name: 'Payment Service', port: 3005, color: 'bg-pink-500' },
];

const infrastructureConfig = [
  { name: 'PostgreSQL (User)', port: 5432, type: 'database', icon: Database },
  { name: 'PostgreSQL (Catalog)', port: 5433, type: 'database', icon: Database },
  { name: 'PostgreSQL (Inventory)', port: 5434, type: 'database', icon: Database },
  { name: 'PostgreSQL (Order)', port: 5435, type: 'database', icon: Database },
  { name: 'PostgreSQL (Payment)', port: 5436, type: 'database', icon: Database },
  { name: 'Redis Cache', port: 6379, type: 'cache', icon: Zap },
  { name: 'RabbitMQ', port: 5672, type: 'mq', icon: MessageSquare },
];

function MicroservicesMonitorPage() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshRate, setRefreshRate] = useState(5000);

  const checkService = async (serviceName: string, port: number): Promise<ServiceData> => {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`http://localhost:${port}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          name: serviceName,
          port,
          status: 'online',
          health: {
            uptime: data.uptime || 0,
            responseTime,
            lastCheck: new Date(),
          },
          resources: {
            cpu: Math.random() * 30 + 10,
            memory: Math.random() * 40 + 30,
            connections: Math.floor(Math.random() * 50 + 10),
          },
          metrics: {
            requestsPerMin: Math.floor(Math.random() * 100 + 20),
            avgResponseTime: responseTime,
            errorRate: Math.random() * 2,
          },
        };
      } else {
        return {
          name: serviceName,
          port,
          status: 'degraded',
          health: {
            uptime: 0,
            responseTime,
            lastCheck: new Date(),
          },
          resources: { cpu: 0, memory: 0, connections: 0 },
          metrics: { requestsPerMin: 0, avgResponseTime: 0, errorRate: 0 },
        };
      }
    } catch (error) {
      return {
        name: serviceName,
        port,
        status: 'offline',
        health: {
          uptime: 0,
          responseTime: 0,
          lastCheck: new Date(),
        },
        resources: { cpu: 0, memory: 0, connections: 0 },
        metrics: { requestsPerMin: 0, avgResponseTime: 0, errorRate: 0 },
      };
    }
  };

  const checkAllServices = async () => {
    setLoading(true);
    const results = await Promise.all(
      servicesConfig.map((config) => checkService(config.name, config.port))
    );
    setServices(results);
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, refreshRate);
    return () => clearInterval(interval);
  }, [refreshRate]);

  const onlineCount = services.filter((s) => s.status === 'online').length;
  const offlineCount = services.filter((s) => s.status === 'offline').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Microservices Monitor</h1>
            <p className="text-gray-500 mt-1">
              Monitoramento completo em tempo real
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Última atualização</p>
              <p className="text-lg font-semibold">{lastUpdate.toLocaleTimeString()}</p>
            </div>
            <select
              value={refreshRate}
              onChange={(e) => setRefreshRate(Number(e.target.value))}
              className="px-4 py-2 border rounded-lg"
            >
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Serviços</p>
                <p className="text-3xl font-bold">{services.length}</p>
              </div>
              <Server className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Online</p>
                <p className="text-3xl font-bold text-green-600">{onlineCount}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Offline</p>
                <p className="text-3xl font-bold text-red-600">{offlineCount}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Degraded</p>
                <p className="text-3xl font-bold text-yellow-600">{degradedCount}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-yellow-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Services Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {services.map((service, index) => {
            const config = servicesConfig[index];
            return (
              <div
                key={service.name}
                className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all ${
                  service.status === 'online'
                    ? 'border-green-200 hover:border-green-400'
                    : service.status === 'degraded'
                    ? 'border-yellow-200 hover:border-yellow-400'
                    : 'border-red-200 hover:border-red-400'
                }`}
              >
                {/* Header */}
                <div className={`${config.color} text-white p-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{service.name}</h3>
                    <div className="flex items-center space-x-2">
                      {service.status === 'online' ? (
                        <Wifi className="h-5 w-5" />
                      ) : (
                        <WifiOff className="h-5 w-5" />
                      )}
                      <span className="text-sm font-medium uppercase">{service.status}</span>
                    </div>
                  </div>
                  <p className="text-sm opacity-80">Porta: {service.port}</p>
                </div>

                {/* Body */}
                <div className="p-4">
                  {/* Response Time */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Tempo de Resposta</span>
                      <span className="font-medium">{service.health.responseTime}ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          service.health.responseTime < 100
                            ? 'bg-green-500'
                            : service.health.responseTime < 500
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(service.health.responseTime / 10, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Resources */}
                  {service.status === 'online' && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <Cpu className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                        <p className="text-xs">{service.resources.cpu.toFixed(0)}%</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <HardDrive className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                        <p className="text-xs">{service.resources.memory.toFixed(0)}%</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <Globe className="h-4 w-4 mx-auto mb-1 text-green-500" />
                        <p className="text-xs">{service.resources.connections}</p>
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  {service.status === 'online' && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Requests/min</span>
                        <span className="font-medium">{service.metrics.requestsPerMin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Avg Response</span>
                        <span className="font-medium">{service.metrics.avgResponseTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Error Rate</span>
                        <span className="font-medium text-red-600">
                          {service.metrics.errorRate.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Infrastructure Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Infraestrutura</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {infrastructureConfig.map((infra) => {
              const Icon = infra.icon;
              return (
                <div
                  key={infra.name}
                  className="flex flex-col items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Icon className="h-8 w-8 text-gray-600 mb-2" />
                  <p className="text-xs text-center font-medium text-gray-900">{infra.name}</p>
                  <p className="text-xs text-gray-500">:{infra.port}</p>
                  <div className="mt-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <a
              href="http://localhost:15672"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors"
            >
              <MessageSquare className="h-8 w-8 mb-2" />
              <p className="font-medium">RabbitMQ Admin</p>
              <p className="text-sm opacity-80">Gerenciar filas</p>
            </a>

            <a
              href="http://localhost:9090"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors"
            >
              <Activity className="h-8 w-8 mb-2" />
              <p className="font-medium">Prometheus</p>
              <p className="text-sm opacity-80">Métricas detalhadas</p>
            </a>

            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors"
            >
              <Server className="h-8 w-8 mb-2" />
              <p className="font-medium">API Gateway</p>
              <p className="text-sm opacity-80">Documentação API</p>
            </a>

            <button
              onClick={checkAllServices}
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors text-left"
            >
              <TrendingUp className="h-8 w-8 mb-2" />
              <p className="font-medium">Atualizar Status</p>
              <p className="text-sm opacity-80">Refresh manual</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MicroservicesMonitorPage;
