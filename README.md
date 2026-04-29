# 🏠 AlocaPro - Gestão Inteligente de Alojamentos

[![Status](https://img.shields.io/badge/Status-Em%20Produção-success?style=for-the-badge)]()
[![Tech](https://img.shields.io/badge/Stack-Frontend%20%7C%20Supabase-blue?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)]()

**AlocaPro** é uma solução completa para gestão logística de alojamentos corporativos e repúblicas. Desenvolvida para simplificar o controle de ocupação, automatizar processos de check-in/out e fornecer insights em tempo real sobre a capacidade de hospedagem da empresa.

---

## 🚀 Funcionalidades Principais

### 📊 Dashboard e Inteligência
*   **KPIs em Tempo Real:** Acompanhamento instantâneo de vagas totais, ocupadas, disponíveis e taxa de ocupação percentual.
*   **Filtros Avançados:** Alternância rápida entre visão de Alojamentos Próprios, Repúblicas ou visão consolidada.

### 🗺️ Mapa de Alojamento Visual (Interactive Grid)
*   **Visão por Blocos:** Organização visual intuitiva dos quartos agrupados por prédios/blocos.
*   **Status Color-Coded:** Identificação visual imediata de quartos disponíveis, quase cheios, lotados ou inativos.
*   **Ações Diretas (Quick Actions):** 
    *   **Check-in Rápido:** Clique em uma vaga livre para alocar um funcionário instantaneamente.
    *   **Check-out Rápido:** Clique no nome de um funcionário para liberar a vaga e calcular o custo da estadia.
*   **Restrições de Gênero:** Controle visual de quartos masculinos, femininos ou mistos.

### 👥 Gestão de Cadastros
*   **Funcionários:** Cadastro completo com CPF, Telefone e histórico de alocações.
*   **Alojamentos e Repúblicas:** Controle de capacidade, blocos, endereços e valores de diárias.
*   **Inativação Inteligente:** Possibilidade de desativar locais para manutenção com registro de motivo.

### 📑 Histórico e Relatórios
*   **Log de Estadias:** Registro detalhado de quem ficou onde, por quanto tempo e qual o custo gerado.
*   **Exportação:** Módulo de exportação de histórico para **Excel (XLSX)** para integração com RH e financeiro.
*   **Filtros de Período:** Pesquisa por data de entrada/saída e busca por nome do colaborador.

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza uma arquitetura moderna e leve, garantindo alta performance e facilidade de manutenção:

*   **Frontend:**
    *   **HTML5 & Vanilla CSS3:** Interface responsiva e moderna com estética *Glassmorphism*.
    *   **JavaScript (ES6+):** Lógica reativa sem dependências pesadas de frameworks.
    *   **Bootstrap 5:** Sistema de grid e componentes UI.
    *   **Bootstrap Icons:** Biblioteca de ícones vetoriais.
    *   **SheetJS (XLSX):** Motor de exportação de dados para planilhas.
*   **Backend & Persistência (BaaS):**
    *   **Supabase:** Banco de dados PostgreSQL com capacidades em tempo real.
    *   **PostgREST:** APIs REST automáticas e seguras.
    *   **Supabase Auth:** Sistema de autenticação de usuários e controle de acesso.

---

## 📁 Estrutura do Projeto

```text
alojamento/
└── frontend/
    ├── login.html          # Portal de acesso seguro
    ├── dashboard.html      # Painel central de operações
    ├── style.css           # Design system e estilização customizada
    ├── script.js           # Core engine da aplicação (Lógica, API e UI)
    ├── config.js           # Variáveis de ambiente e conexão Supabase
    └── ...                 # Ativos e bibliotecas auxiliares
```

---

## ⚙️ Configuração e Execução

Para rodar este projeto em seu ambiente de desenvolvimento:

1.  **Requisitos Prévios:**
    *   Uma conta no [Supabase](https://supabase.com/).
    *   Estrutura de tabelas: `usuario`, `empresa`, `quarto`, `republica`, `funcionario` e `alocacao`.

2.  **Configuração de Credenciais:**
    *   Acesse `frontend/config.js`.
    *   Insira suas chaves de API:
    ```javascript
    const SUPABASE_URL = 'https://seu-projeto.supabase.co';
    const SUPABASE_ANON_KEY = 'sua-chave-anonima';
    ```

3.  **Execução:**
    *   Utilize um servidor local (ex: **Live Server** do VS Code) para abrir o arquivo `login.html`.
    *   Certifique-se de que o domínio de origem está permitido nas configurações de CORS do seu projeto Supabase.

---

## 🔒 Segurança e Multitenancy

O AlocaPro foi construído com arquitetura **Multitenant**:
*   Cada empresa isola seus próprios dados.
*   A filtragem é feita a nível de aplicação baseada no `id_empresa` vinculado ao perfil do usuário logado.
*   Integração total com as políticas de segurança (RLS) do Supabase.

---
*Desenvolvido com foco em eficiência operacional e controle logístico.*
