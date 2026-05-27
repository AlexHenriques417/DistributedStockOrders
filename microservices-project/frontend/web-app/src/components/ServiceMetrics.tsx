import { Activity, Database, MessageSquare, Server, Wifi, WifiOff } from 'lucide-react';

interface ServiceStatusProps {
  serviceName: string;
  status: 'online' | 'offline' | 'warning';
  port: number;
  lastHeartbeat?: Date;
  metrics?: {
    cpu?: number;
    memory?: number;
    requests?: number;
    errors?: number;
  };
}

function ServiceStatusBox({
  serviceName,
  status,
  port,
  lastHeartbeat,
  metrics,
}: ServiceStatusProps) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    warning: 'bg-yellow-500',
  };

  const statusText = {
    online: 'Online',
    offline: 'Offline',
    warning: 'Degraded',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5 border-2 border-gray-100 hover:border-gray-300 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${statusColors[status]} animate-pulse`} />
          <h3 className="font-semibold text-gray-800">{serviceName}</h3>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            status === 'online'
              ? 'bg-green-100 text-green-700'
              : status === 'warning'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {statusText[status]}
        </span>
      </div>

      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        <Server className="h-4 w-4" />
        <span>: {port}</span>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {metrics.cpu !== undefined && (
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500 text-xs">CPU</p>
              <p className="font-semibold">{metrics.cpu}%</p>
            </div>
          )}
          {metrics.memory !== undefined && (
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500 text-xs">Memória</p>
              <p className="font-semibold">{metrics.memory}%</p>
            </div>
          )}
          {metrics.requests !== undefined && (
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500 text-xs">Requisições</p>
              <p className="font-semibold">{metrics.requests}/s</p>
            </div>
          )}
          {metrics.errors !== undefined && (
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500 text-xs">Erros</p>
              <p className="font-semibold text-red-600">{metrics.errors}</p>
            </div>
          )}
        </div>
      )}

      {lastHeartbeat && (
        <div className="mt-3 text-xs text-gray-400 flex items-center">
          <Activity className="h-3 w-3 mr-1" />
          <span>Último heartbeat: {lastHeartbeat.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}

export default ServiceStatusBox;
