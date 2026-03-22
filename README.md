#  Delivery Manager

Interface de gerenciamento de pedidos para operações de delivery, construída em **Angular 17+** com consumo de API REST.

---

## Tecnologias

- **Angular 17+** — standalone components, signals, computed
- **TypeScript** — tipagem estrita
- **SCSS** — estilização modular com BEM e variáveis globais
- **Lucide Icons** — ícones via CDN
- **Google Fonts** — Inter (corpo) + Poppins (títulos)

---

## Estrutura do projeto

```
src/
├── index.html                        # Head global (fonts, lucide)
├── styles.scss                       # Agregador de estilos globais
├── styles/
│   ├── variables.scss               # Paleta de cores e tipografia
│   ├── mixins.scss                  # Breakpoints e helpers de layout
│   ├── reset.scss                   # Reset global
│   ├── animations.scss              # Keyframes e classes de animação
│   ├── utilities.scss               # Classes utilitárias (.font-display etc)
│   └── components.scss             # Toast, confirm overlay, spinner
└── app/
    ├── app.ts                        # Componente raiz (lógica principal)
    ├── app.html                      # Template
    ├── app.scss                      # Estilos do componente (BEM)
    ├── app.config.ts                 # Providers (HttpClient, Router)
    ├── app.routes.ts                 # Rotas
    ├── models/
    │   └── order.model.ts            # Interfaces, mapas de status, apiToOrder()
    └── core/
        └── services/
            └── order.service.ts      # Comunicação com a API REST
```

## API

A aplicação consome uma API REST de pedidos que eu havia feito previamente, vc pode testala clonando o repositorio e seguindo o passo a passo na documentação para executala :

```bash
git clone https://github.com/DiegoRodrigues06/delivery-api
```

### Endpoints utilizados

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/pedidos` | Lista todos os pedidos |
| `GET` | `/pedidos/:id` | Busca pedido por ID |
| `POST` | `/pedidos` | Cria novo pedido |
| `PATCH` | `/pedidos/:id/status` | Atualiza status do pedido |
| `DELETE` | `/pedidos/:id` | Remove pedido |

### Mapeamento de status

A API usa status em maiúsculas que são convertidos internamente:

| API | Interface |
|---|---|
| `RECEIVED` | Pendente |
| `CONFIRMED` | Preparando |
| `DISPATCHED` | Em Entrega |
| `DELIVERED` | Entregue |
| `CANCELED` | Entregue (encerrado) |

---

## Como rodar

```bash
# Clone o repositório
git clone https://github.com/DiegoRodrigues06/delivery-manager-app

# Instalar dependências
npm install

# Rodar em desenvolvimento
npm start
# ou
ng serve

# Build de produção
ng build
```

A aplicação sobe em `http://localhost:4200` por padrão.

---

## Funcionalidades

- **Listagem** de pedidos em grid responsivo (1 / 2 / 3 colunas)
- **Filtro por status** via tabs (Todos, Pendente, Preparando, Em Entrega, Entregue)
- **Stats em tempo real** no header (contagem por status)
- **Avançar status** diretamente no card com um clique
- **Criar pedido** via modal com formulário completo
- **Editar** status de pedidos existentes
- **Excluir** pedido com confirmação
- **Toasts** de feedback para todas as ações
- **Responsivo** — funciona em mobile, tablet e desktop
