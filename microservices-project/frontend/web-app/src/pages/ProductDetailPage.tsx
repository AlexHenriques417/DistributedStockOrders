function ProductDetailPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">Nome do Produto</h1>
          <p className="text-2xl text-primary-600 font-semibold mb-4">R$ 299,90</p>
          <p className="text-gray-600 mb-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <button className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors mb-4">
            Adicionar ao Carrinho
          </button>
          <button className="w-full border-2 border-primary-600 text-primary-600 py-3 rounded-lg hover:bg-primary-50 transition-colors">
            Comprar Agora
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
