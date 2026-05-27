import { Server, Database, MessageSquare, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface Connection {
  from: string;
  to: string;
  label: string;
  active: boolean;
}

const connections: Connection[] = [
  { from: 'Frontend', to: 'API Gateway', label: 'HTTP', active: true },
  { from: 'API Gateway', to: 'User Service', label: 'REST', active: true },
  { from: 'API Gateway', to: 'Catalog Service', label: 'REST', active: true },
  { from: 'API Gateway', to: 'Order Service', label: 'REST', active: true },
  { from: 'Order Service', to: 'Inventory Service', label: 'Events', active: true },
  { from: 'Order Service', to: 'Payment Service', label: 'Events', active: true },
  { from: 'Catalog Service', to: 'Inventory Service', label: 'Events', active: true },
];

const services = [
  { name: 'Frontend', type: 'frontend', port: 4000 },
  { name: 'API Gateway', type: 'gateway', port: 3000 },
  { name: 'User Service', type: 'service', port: 3001 },
  { name: 'Catalog Service', type: 'service', port: 3002 },
  { name: 'Inventory Service', type: 'service', port: 3003 },
  { name: 'Order Service', type: 'service', port: 3004 },
  { name: 'Payment Service', type: 'service', port: 3005 },
];

function ConnectionLine({ connection }: { connection: Connection }) {
  return (
    <div className="flex items-center justify-center my-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
          {connection.from}
        </span>
        <div className={`flex items-center ${connection.active ? 'text-green-500' : 'text-gray-400'}`}>
          <ArrowUpRight className="h-4 w-4" />
        </div>
        <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
          {connection.label}
        </span>
        <div className={`flex items-center ${connection.active ? 'text-green-500' : 'text-gray-400'}`}>
          <ArrowDownRight className="h-4 w-4" />
        </div>
        <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
          {connection.to}
        </span>
      </div>
    </div>
  );
}

export default function ServiceArchitectureGraph() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Arquitetura de Conexões</h2>
      <div className="space-y-3">
        {connections.map((conn, index) => (
          <ConnectionLine key={index} connection={conn} />
        ))}
      </div>
      <div className="mt-6 flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">Conexão Ativa</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span className="text-gray-600">Conexão Inativa</span>
        </div>
      </div>
    </div>
  );
}
