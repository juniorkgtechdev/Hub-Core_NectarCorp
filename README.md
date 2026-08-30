# Hub Core - Nectar IT Solutions

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-brightgreen.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org)

## Visão Geral

O **Hub Core** é uma plataforma inteligente de automação de contratos desenvolvida com Next.js 16, projetada para transformar a geração de documentos legais e escalonamento profissional. Utiliza IA avançada para extrair dados estruturados de fichas cadastrais e gerar contratos formatados automaticamente.

### Sistema de Extração e Geração de Contratos

O sistema implementa um pipeline completo para:
- **Extração inteligente**: Processamento de PDFs e imagens de fichas cadastrais
- **Validação de dados**: Interface para revisão e correção dos dados extraídos  
- **Geração automatizada**: Criação de contratos em Word (.docx) e PDF

---

## Funcionalidades Principais

### Extração com IA
- Upload de PDFs ou imagens de fichas cadastrais
- Extração automática de dados médicos via Google Gemini 2.5 Flash
- Suporte a múltiplos arquivos simultâneamente

### Validação de Dados
- Formulário dinâmico para revisão dos dados extraídos
- Edição em tempo real antes da geração final
- Validação de CPF, CREMESP e outros campos críticos

### Geração de Documentos
- **Word (.docx)**: Contratos editáveis com formatação corporativa
- **PDF**: Documentos prontos para assinatura com layout profissional
- **ZIP**: Exportação em lote para múltiplos contratos

---

## Tecnologias

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 16.3.3 | Framework full-stack |
| React | 19.2.8 | Interface do usuário |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 4.x | Estilização |
| Google GenAI | 2.19.0 | Processamento de IA |
| docx | 9.7.1 | Geração de Word |
| pdfkit | 0.20.1 | Geração de PDF |
| next-auth | 5.0-beta | Autenticação |
| Prisma | 6.0.0 | ORM/Banco de dados |

---

## Arquitetura

### Estrutura do Projeto

```
src/
├── app/                    # Rotas e API (App Router)
│   ├── api/                # Endpoints REST
│   │   ├── extract/        # Extração de dados via IA
│   │   ├── generate-word/  # Geração de documentos Word
│   │   └── generate-pdf/   # Geração de documentos PDF
│   ├── portal/             # Interface do cliente
│   └── superadmin/         # Painel administrativo
├── components/             # Componentes React reutilizáveis
├── utils/                  # Utilitários
│   ├── contractGenerator.ts
│   └── pdfGenerator.ts
├── lib/                    # Bibliotecas e serviços
└── middleware.ts           # Middleware de segurança
```

### Padrão de Multi-Tenant

O sistema implementa arquitetura multi-tenant com isolamento total de dados:

- **Tenant Isolation**: Cada cliente tem seu próprio ambiente
- **Slug Validation**: Preenchimento dinâmico com validação
- **Segurança**: Autenticação avançada e proteção de rotas

---

## Instalação

### Pré-requisitos

- Node.js >= 18.x
- npm >= 9.x
- Chave de API do Google Gemini

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/nectarcorp/hub-core.git
cd hub-core

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
```

### Variáveis de Ambiente

```env
# Google Gemini API
GEMINI_API_KEY=sua_chave_api_aqui

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua_chave_secreta_aqui

# Banco de Dados (opcional)
DATABASE_URL=postgresql://localhost:5432/nectar
```

---

## Desenvolvimento

```bash
# Executar em modo desenvolvimento
npm run dev

# Lint do código
npm run lint

# Build para produção
npm run build

# Iniciar servidor de produção
npm run start
```

Acesse em http://localhost:3000

---

## API

### Endpoint de Extração

`POST /api/extract`

Extrai dados de fichas cadastrais via IA.

### Endpoint de Geração

`POST /api/generate-word`

Gera documentos Word (.docx) compatíveis com Microsoft Word.

`POST /api/generate-pdf`

Gera documentos PDF com formatação profissional.

---

## Tipos de Dados

```typescript
interface ExtractedData {
  nome: string;
  nacionalidade: string;
  dataNascimento: string;
  estadoCivil: string;
  profissao: string;
  carteiraProfissional: string;
  rg: string;
  cpf: string;
  endereco: string;
  cep: string;
  cidade: string;
  estado: string;
}
```

---

## Licença

MIT License

---

## Contato

Desenvolvido por Nectar IT Solutions - Soluções em tecnologia para automação de processos corporativos.

CNPJ: 23.481.981/0001-31
Portal: itsolution.nectarcorp.ia.br