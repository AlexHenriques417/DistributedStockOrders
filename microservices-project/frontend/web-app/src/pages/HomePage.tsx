import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, Shield, CreditCard } from 'lucide-react';

function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Bem-vindo ao E-Shop
          </h1>
          <p className="text-xl mb-8">
            Plataforma de e-commerce construida com arquitetura de microsservicos
          </p>
          <Link
            to="/products"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Ver Produtos
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nossos Diferenciais</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-primary-600" />
              <h3 className="text-xl font-semibold mb-2">Variedade de Produtos</h3>
              <p className="text-gray-600">Milhares de produtos disponiveis</p>
            </div>
            <div className="text-center p-6">
              <Truck className="h-12 w-12 mx-auto mb-4 text-primary-600" />
              <h3 className="text-xl font-semibold mb-2">Entrega Rapida</h3>
              <p className="text-gray-600">Entrega em todo o Brasil</p>
            </div>
            <div className="text-center p-6">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary-600" />
              <h3 className="text-xl font-semibold mb-2">Compra Segura</h3>
              <p className="text-gray-600">Pagamentos criptografados</p>
            </div>
            <div className="text-center p-6">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-primary-600" />
              <h3 className="text-xl font-semibold mb-2">Multiplas Formas de Pagamento</h3>
              <p className="text-gray-600">Cartao, PIX, Boleto</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Comece a Comprar Agora</h2>
          <p className="text-gray-600 mb-8">
            Cadastre-se gratuitamente e aproveite todas as ofertas
          </p>
          <Link
            to="/register"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Criar Conta
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
