# Front Painel Vercel OL

![Next.js](https://img.shields.io/badge/Next.js-15-blue?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-4.x-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8?logo=tailwindcss)
![PNPM](https://img.shields.io/badge/PNPM-%E2%9C%94-yellow?logo=pnpm)

> Painel administrativo moderno para gestão de pedidos, clientes e retornos, desenvolvido com Next.js, React, TypeScript e TailwindCSS.

## ✨ Funcionalidades

- Visualização e filtro de pedidos por data, status, cliente, filial e fornecedor
- Modal detalhado do pedido com informações do cliente, itens e financeiro
- Reenvio de retorno de pedido e de NF com feedback visual
- Busca inteligente e filtros dinâmicos
- UI responsiva e moderna (mobile e desktop)
- Animações e transições suaves
- Toasts de feedback para ações

## 🚀 Tecnologias Utilizadas

- [Next.js 15](https://nextjs.org/)
- [React 18+](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [PNPM](https://pnpm.io/)
- [Lucide Icons](https://lucide.dev/)

## 📦 Instalação

```bash
# Clone o repositório
$ git clone https://github.com/ronaldobonifacio/front-painel-vercel-ol.git
$ cd front-painel-vercel-ol

# Instale as dependências
$ pnpm install

# Crie um arquivo .env.local se necessário
$ cp .env.example .env.local
```

## 🏃‍♂️ Rodando o Projeto

```bash
# Ambiente de desenvolvimento
$ pnpm dev

# Build de produção
$ pnpm build
$ pnpm start
```

Acesse: http://localhost:3000

## 📝 Estrutura de Pastas

```
├── app/                # Páginas e layout Next.js
├── components/         # Componentes reutilizáveis
├── hooks/              # Custom hooks
├── lib/                # Funções utilitárias
├── public/             # Arquivos estáticos
├── styles/             # Estilos globais
├── ...
```

## 🛠️ Customização
- Edite `admin-panel.tsx` para alterar regras de negócio e UI principal.
- Ajuste variáveis de ambiente em `.env.local` conforme necessário.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nome-feature`)
3. Commit suas alterações (`git commit -m 'feat: minha feature'`)
4. Push para a branch (`git push origin feature/nome-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido com 💙 por [Ronaldo Bonifácio](https://github.com/ronaldobonifacio)
