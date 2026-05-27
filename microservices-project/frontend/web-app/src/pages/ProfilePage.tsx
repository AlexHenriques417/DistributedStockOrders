function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Informacoes Pessoais</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Nome</label>
              <p className="text-gray-900">Usuario</p>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Email</label>
              <p className="text-gray-900">usuario@email.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
