# Sistema de Contratos - Medprime

Um sistema moderno e inteligente desenvolvido com **Next.js** para automatizar a geração de contratos da Medprime Clínica Gestão e Saúde S.A.

O sistema utiliza a inteligência artificial do **Google Gemini (2.5 Flash)** para extrair dados estruturados automaticamente de Fichas Cadastrais (seja em PDF ou imagem) e gerar contratos formatados perfeitamente em **Word (.docx)** e **PDF**.

## 🚀 Funcionalidades

- **Extração com IA**: Upload de PDFs ou imagens de Fichas Cadastrais com extração automática dos dados do médico (Nome, CPF, Endereço, etc.) via API do Google Gemini.
- **Validação de Dados**: Formulário dinâmico na tela para revisar e corrigir os dados antes de gerar os documentos finais.
- **Geração de Word (.docx)**: Criação de um documento do Word totalmente editável e formatado com a logo da empresa e o modelo oficial do contrato.
- **Geração de PDF**: Geração instantânea de arquivos PDF em alta qualidade prontos para assinatura (com cabeçalho estruturado, logo e formatação oficial).
- **Interface Moderna**: UI minimalista e de alto contraste, com suporte a *drag and drop* para os arquivos.

## 🛠️ Tecnologias Utilizadas

- [Next.js 16](https://nextjs.org/) (App Router & Server Actions)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Google GenAI SDK](https://github.com/google/generative-ai-js) (Gemini 2.5 Flash)
- [docx](https://docx.js.org/) (Geração de Word)
- [pdfkit](https://pdfkit.org/) (Geração de PDF)

## ⚙️ Como Executar Localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) instalado na máquina.
- Uma chave de API do [Google Gemini](https://aistudio.google.com/app/apikey).

### 2. Instalação

Clone o repositório:
```bash
git clone https://github.com/juniorkgtechdev/Contrato_Medprime.git
cd sistema-contratos
```

Instale as dependências:
```bash
npm install
```

### 3. Configuração de Variáveis de Ambiente

Crie um arquivo chamado `.env.local` na raiz do projeto e adicione sua chave de API do Gemini:

```env
GEMINI_API_KEY=sua_chave_de_api_aqui
```
*(Nota: Se a chave não for fornecida, o sistema rodará usando dados de teste preenchidos automaticamente "Mock" para fins de desenvolvimento).*

Certifique-se também de que o arquivo da logo (`logo.png`) está dentro da pasta `public`.

### 4. Rodando o Servidor

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o sistema rodando.

---
**Medprime Clínica Gestão e Saúde S.A.**
CNPJ: 23.481.981/0001-31
