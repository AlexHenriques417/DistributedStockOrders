function ProductsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Todos os Produtos</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Placeholder products */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gray-200 rounded mb-4"></div>
            <h3 className="font-semibold mb-2">Produto {i}</h3>
            <p className="text-gray-600 mb-2">R$ {(i * 100).toFixed(2)}</p>
            <button className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition-colors">
              Adicionar ao Carrinho
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductsPage;
