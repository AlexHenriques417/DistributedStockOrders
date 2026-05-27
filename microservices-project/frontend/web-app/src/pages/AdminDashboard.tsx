import { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  Globe,
  Clock,
  Cpu,
  HardDrive,
} from 'lucide-react';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'checking';
  port: number;
  url: string;
  uptime?: number;
  timestamp?: string;
  database?: string;
  redis?: string;
  rabbitmq?: string;
  responseTime?: number;
}

interface ServiceMetric {
  name: string;
  requests: number;
  avgResponseTime: number;
  errorRate: number;
  throughput: number;
}

const initialServices: ServiceHealth[] = [
  { name: 'API Gateway', status: 'checking', port: 3000, url: 'http://localhost:3000' },
  { name: 'User Service', status: 'checking', port: 3001, url: 'http://localhost:3001' },
  { name: 'Catalog Service', status: 'checking', port: 3002, url: 'http://localhost:3002' },
  { name: 'Inventory Service', status: 'checking', port: 3003, url: 'http://localhost:3003' },
  { name: 'Order Service', status: 'checking', port: 3004, url: 'http://localhost:3004' },
  { name: 'Payment Service', status: 'checking', port: 3005, url: 'http://localhost:3005' },
];

const infrastructureServices = [
  {
    name: 'PostgreSQL (User DB)',
    port: 5432,
    type: 'database',
    icon: Database,
    color: 'bg-blue-500',
    status: 'unknown',
  },
  {
    name: 'PostgreSQL (Catalog DB)',
    port: 5433,
    type: 'database',
    icon: Database,
    color: 'bg-blue-500',
    status: 'unknown',
  },
  {
    name: 'PostgreSQL (Inventory DB)',
    port: 5434,
    type: 'database',
    icon: Database,
    color: 'bg-blue-500',
    status: 'unknown',
  },
  {
    name: 'PostgreSQL (Order DB)',
    port: 5435,
    type: 'database',
    icon: Database,
    color: 'bg-blue-500',
    status: 'unknown',
  },
  {
    name: 'PostgreSQL (Payment DB)',
    port: 5436,
    type: 'database',
    icon: Database,
    color: 'bg-blue-500',
    status: 'unknown',
  },
  {
    name: 'Redis Cache',
    port: 6379,
    type: 'cache',
    icon: Zap,
    color: 'bg-red-500',
    status: 'unknown',
  },
  {
    name: 'RabbitMQ',
    port: 5672,
    type: 'mq',
    icon: MessageSquare,
    color: 'bg-orange-500',
    status: 'unknown',
    managementPort: 15672,
  },
];

function AdminDashboard() {
  const [services, setServices] = useState<ServiceHealth[]>(initialServices);
  const [metrics, setMetrics] = useState<ServiceMetric[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceHealth | null>(null);

  const checkServiceHealth = async (service: ServiceHealth): Promise<ServiceHealth> => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${service.url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          ...service,
          status: 'healthy',
          uptime: data.uptime,
          timestamp: data.timestamp,
          database: data.database,
          redis: data.redis,
          rabbitmq: data.rabbitmq,
          responseTime,
        };
      } else {
        return {
          ...service,
          status: 'unhealthy',
          responseTime,
        };
      }
    } catch (error) {
      return {
        ...service,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
      };
    }
  };

  const checkAllServices = async () => {
    const updatedServices = await Promise.all(
      services.map((service) => checkServiceHealth(service))
    );
    setServices(updatedServices);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    checkAllServices();

    if (autoRefresh) {
      const interval = setInterval(checkAllServices, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'healthy':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'unhealthy':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const unhealthyCount = services.filter((s) => s.status === 'unhealthy').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Microservices Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Monitoramento em tempo real de todos os serviços
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            <Clock className="inline h-4 w-4 mr-1" />
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={checkAllServices}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total de Serviços</p>
              <p className="text-3xl font-bold text-gray-900">{services.length}</p>
            </div>
            <Server className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Serviços Ativos</p>
              <p className="text-3xl font-bold text-green-600">{healthyCount}</p>
            </div>
            <CheckCircle2 className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Serviços Inativos</p>
              <p className="text-3xl font-bold text-red-600">{unhealthyCount}</p>
            </div>
            <XCircle className="h-12 w-12 text-red-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Disponibilidade</p>
              <p className="text-3xl font-bold text-purple-600">
                {services.length > 0 ? Math.round((healthyCount / services.length) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {services.map((service) => (
          <div
            key={service.name}
            className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl border-2 ${
              service.status === 'healthy'
                ? 'border-green-200 hover:border-green-400'
                : 'border-red-200 hover:border-red-400'
            }`}
            onClick={() => setSelectedService(service)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(service.status)}
                <div>
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-500">Porta: {service.port}</p>
                </div>
              </div>
              <span className={getStatusBadge(service.status)}>
                {service.status === 'healthy' ? 'Online' : 'Offline'}
              </span>
            </div>

            {service.status === 'healthy' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tempo de Resposta:</span>
                  <span className="font-medium">{service.responseTime}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Uptime:</span>
                  <span className="font-medium">
                    {service.uptime ? Math.floor(service.uptime / 60) : 0} min
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div
                    className={`h-2 rounded-full ${
                      service.responseTime && service.responseTime < 100
                        ? 'bg-green-500'
                        : service.responseTime && service.responseTime < 500
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((service.responseTime || 0) / 5, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Infrastructure Status */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Infraestrutura</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {infrastructureServices.map((infra) => {
            const Icon = infra.icon;
            return (
              <div
                key={infra.name}
                className="flex flex-col items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className={`${infra.color} rounded-full p-3 mb-2`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs text-center font-medium text-gray-900">{infra.name}</p>
                <p className="text-xs text-gray-500">:{infra.port}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Flow Visualization */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Fluxo de Eventos</h2>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Event flow visualization */}
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
            <Server className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">User Service</span>
          </div>
          <span className="text-gray-400">→</span>
          <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
            <MessageSquare className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">RabbitMQ</span>
          </div>
          <span className="text-gray-400">→</span>
          <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
            <Server className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Order Service</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          {['user.events', 'catalog.events', 'inventory.events', 'order.events', 'payment.events'].map(
            (exchange) => (
              <div key={exchange} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-mono text-gray-600">{exchange}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">Messages</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.floor(Math.random() * 100)}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Quick Access Links */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="http://localhost:15672"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <MessageSquare className="h-6 w-6 text-orange-600" />
            <div>
              <p className="font-medium text-gray-900">RabbitMQ</p>
              <p className="text-xs text-gray-500">Management UI</p>
            </div>
          </a>

          <a
            href="http://localhost:9090"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Activity className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-medium text-gray-900">Prometheus</p>
              <p className="text-xs text-gray-500">Metrics</p>
            </div>
          </a>

          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <TrendingUp className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Grafana</p>
              <p className="text-xs text-gray-500">Dashboards</p>
            </div>
          </a>

          <a
            href="http://localhost:9411"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Globe className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Zipkin</p>
              <p className="text-xs text-gray-500">Tracing</p>
            </div>
          </a>
        </div>
      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(selectedService.status)}
                  <h2 className="text-2xl font-bold text-gray-900">{selectedService.name}</h2>
                </div>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Porta</p>
                  <p className="text-xl font-semibold">{selectedService.port}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={getStatusBadge(selectedService.status)}>
                    {selectedService.status}
                  </span>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Tempo de Resposta</p>
                  <p className="text-xl font-semibold">{selectedService.responseTime}ms</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Uptime</p>
                  <p className="text-xl font-semibold">
                    {selectedService.uptime ? Math.floor(selectedService.uptime / 60) : 0} min
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">URL de Acesso</h3>
                <code className="block p-3 bg-gray-100 rounded text-sm">
                  {selectedService.url}
                </code>
              </div>

              <div className="text-sm text-gray-500">
                <p>Último check: {selectedService.timestamp || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
