Sistema de Gestão de Pedidos com Estoque Distribuído

Sobre o Projeto :
Este projeto consiste em um Sistema de Gestão de Pedidos com Estoque Distribuído, desenvolvido utilizando conceitos de Arquitetura de Microsserviços.
O objetivo é simular um ambiente real de e-commerce ou marketplace, onde diferentes serviços trabalham de forma independente para gerenciar catálogo, estoque, pedidos, pagamentos e entregas.

A arquitetura prioriza desacoplamento, escalabilidade e comunicação orientada a eventos, utilizando mensageria e consistência eventual.

Domínios do Sistema :
O sistema é dividido nos seguintes domínios:

Catálogo :
Responsável por gerenciar os produtos disponíveis no sistema.

Funções :
Cadastro de produtos
Consulta de produtos
Atualização de informações
Cache para otimizar consultas

Estoque :
Responsável pelo controle de quantidade de produtos disponíveis.

Funções :
Controle de estoque
Reserva de produtos
Atualização de quantidades após pedidos

Pedido :
Gerencia a criação e acompanhamento dos pedidos.

Funções :
Criar pedidos
Atualizar status do pedido
Integrar com pagamento e estoque

Pagamento :
Responsável pelo processamento e confirmação dos pagamentos.

Funções :
Processar pagamento
Confirmar ou recusar transações
Enviar eventos para atualização do pedido

Entrega :
Responsável pelo gerenciamento da logística de entrega.

Funções :
Criar envio
Atualizar status da entrega
Integrar com o serviço de pedidos

Conceitos Arquiteturais Utilizados :
Saga Pattern (Conceitual)
O sistema utiliza o Saga Pattern para gerenciar transações distribuídas entre os microsserviços.
Esse padrão permite que cada serviço execute sua parte da transação e publique eventos que acionam o próximo passo do fluxo.

Exemplo de fluxo :
Pedido criado
Estoque reservado
Pagamento processado
Entrega iniciada
Caso algum passo falhe, podem ocorrer ações compensatórias.

Mensageria :
Os serviços se comunicam por meio de mensageria baseada em eventos, permitindo comunicação assíncrona entre os microsserviços.

Consistência Eventual :
Como o sistema é distribuído, não há garantia de consistência imediata entre os serviços.
O sistema utiliza consistência eventual, garantindo que os dados fiquem consistentes após a propagação dos eventos.

Cache para Catálogo :
O serviço de catálogo utiliza cache para melhorar a performance de leitura de produtos.

Eventos de Negócio :
O sistema utiliza eventos para comunicação entre serviços.

Exemplos de eventos :
PedidoCriado
EstoqueReservado
PagamentoAprovado
PagamentoRecusado
EntregaCriada





Circuit Breaker (Resilience4j)

Service Discovery
