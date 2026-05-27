import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu, Activity, Monitor } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuth';
import { useCartStore } from '../hooks/useCart';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items } = useCartStore();

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary-600 flex items-center space-x-2">
            <Activity className="h-8 w-8" />
            <span>E-Shop</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">
              Inicio
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-primary-600 transition-colors">
              Produtos
            </Link>
            <Link
              to="/monitor"
              className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <Monitor className="h-4 w-4" />
              <span>Monitor</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-primary-600" />
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-2">
                  <User className="h-6 w-6 text-gray-700" />
                  <span className="text-gray-700">{user?.firstName}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-primary-600 transition-colors">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
