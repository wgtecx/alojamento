# 🏠 AlocaPro - Gestão Inteligente de Alojamentos

[![Status](https://img.shields.io/badge/Status-Em%20Produção-success?style=for-the-badge)]()
[![Tech](https://img.shields.io/badge/Stack-Frontend%20%7C%20Supabase-blue?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)]()

**AlocaPro** é uma solução completa para gestão logística de alojamentos corporativos e repúblicas. Desenvolvida para simplificar o controle de ocupação, automatizar processos de check-in/out e fornecer insights em tempo real sobre a capacidade de hospedagem da empresa.

---

## 🚀 Funcionalidades Principais

### 📊 Dashboard e Inteligência
*   **KPIs em Tempo Real:** Acompanhamento instantâneo de vagas totais, ocupadas, disponíveis e taxa de ocupação percentual.
*   **Inteligência de Gênero:** Quadro resumo de ocupação detalhado por perfil (Masculino, Feminino e Não Especificado).
*   **Filtros de Precisão (Cascata):** Capacidade de filtrar o dashboard por categoria (Alojamentos/Repúblicas) e mergulhar na análise individual de cada unidade/quarto para auditoria detalhada.
*   **Legendas Interativas (Mapa):** As legendas de status (Disponível, Quase Cheio, Lotado) agora funcionam como filtros rápidos ao serem clicadas.
*   **Relatórios de Auditoria (Data Base):** O Relatório de Ocupação agora permite "viajar no tempo", mostrando a ocupação exata de qualquer data retroativa para conferência de faturas e auditoria financeira.
*   **Filtros de Relatório:** Recortes detalhados por Módulo, Tipo de Local e busca por nome, com exportação inteligente para Excel (respeita todos os filtros ativos).
*   **Gestão de Mobilidade (Transferência)**: Mova funcionários entre quartos ou alojamentos com um clique, com atualização automática de check-out/check-in e disparo opcional de nova localização via WhatsApp, além do **reenvio manual a qualquer momento** via ícone no card.
*   **Segurança e Auditoria**: Trava de segurança de 1 hora para exclusão de registros e validação de CPF duplicado, impedindo cadastros repetidos e protegendo o histórico.
*   **Filtros Geográficos e Operacionais**: Filtros avançados por Bloco/República e agora por **Módulo (Baseado em Funcionário)**, permitindo identificar exatamente onde os colaboradores de cada setor estão alocados no mapa.
*   **Integridade e Usabilidade**: Máscaras inteligentes de entrada e validação algorítmica rigorosa de CPF (bloqueio de números repetidos e formatos inválidos), além de alertas visuais na tabela para dados inconsistentes.
*   **Correção de Erros (Carência Zero)**: Detecção inteligente de check-outs no mesmo dia do check-in com aplicação automática de valor zero, ideal para correções rápidas de lançamento.
*   **Visão Analítica:** Resumos tabulares de ocupação por módulo e alertas de locais críticos (mais cheios) para tomada de decisão rápida.

### 🗺️ Mapa de Alojamento Visual (Interactive Grid)
*   **Visão por Blocos:** Organização visual intuitiva dos quartos agrupados por prédios/blocos.
*   **Status Color-Coded:** Identificação visual imediata de quartos disponíveis, quase cheios, lotados ou inativos.
*   **Ações Diretas (Quick Actions):** 
    *   **Check-in Rápido:** Clique em uma vaga livre para alocar um funcionário instantaneamente.
    *   **Check-out Rápido:** Clique no nome de um funcionário para liberar a vaga e calcular o custo da estadia.
*   **Localizador de Funcionários:** Campo de busca inteligente para encontrar colaboradores por Nome ou CPF, destacando sua localização exata no mapa.
*   **Filtro por Módulo de Alocação:** Novo seletor que isola a visualização dos locais que contêm funcionários de módulos específicos (ex: Mineração, Administrativo), permitindo uma gestão visual focada na força de trabalho.
*   **Comunicação Integrada (WhatsApp):** Ícone de reenvio de mensagem de alocação diretamente no card do funcionário, permitindo enviar os detalhes da estadia novamente com um clique.
*   **Tooltips Informativos:** Ao passar o mouse sobre o nome de um funcionário alocado, o sistema exibe instantaneamente sua função e a data/hora exata do check-in, facilitando o rastreio da estadia.
*   **Resumo Dinâmico por Gênero:** Estatísticas de ocupação por gênero filtradas automaticamente de acordo com o bloco ou república selecionada.
*   **Restrições de Gênero:** Controle visual de quartos masculinos, femininos ou de gênero não especificado.

### 👥 Gestão de Cadastros
*   **Funcionários:** Cadastro completo com CPF, Telefone, filtragem em cascata por Módulo/Função e histórico de alocações.
*   **Módulos e Funções:** Gestão administrativa de categorias profissionais com suporte a **Carga em Lote (.txt)**.
*   **Alojamentos e Repúblicas:** Controle de capacidade, blocos, módulos e valores diferenciados (Diária Ocupada vs Ociosa).
*   **Empresas (Admin):** Controle de licenciamento com definição de **Data de Expiração**.
*   **Inativação Inteligente:** Possibilidade de desativar locais para manutenção com registro de motivo.

### 📑 Relatórios e Auditoria
*   **Relatório de Ocupação:** Visão consolidada de vagas ocupadas e ociosas com cálculo financeiro individualizado (precificação independente para diárias ocupadas e diárias ociosas).
*   **Relatório Individual:** Histórico completo de estadias por funcionário com cálculo automático de dias alocados.
*   **Exportação Inteligente:** Módulos de exportação para **Excel (XLSX)** em todos os relatórios gerenciais.
*   **Filtros de Período:** Pesquisa por data de entrada/saída e busca por nome do colaborador.

### 🛡️ Blindagem Financeira e Processos
*   **Diária Imutável:** O valor da diária é congelado no check-in, protegendo o histórico contra alterações de preços retroativas.
*   **Prevenção de Erros:** Travas de segurança para evitar overbooking, duplicidade de alocação e conflitos de gênero.
*   **Integridade Referencial:** Proteção contra exclusão de dados (módulos/funções) que possuam vínculos ativos.

### 🔐 Segurança e Licenciamento
*   **Gestão de Senhas:** Funcionalidade integrada para que cada usuário altere sua própria senha de acesso diretamente pelo dashboard.
*   **Controle de Licença:** Alertas automáticos (7 dias de antecedência) e bloqueio imediato de acesso para empresas com licença expirada.

### 🎨 Experiência do Usuário (UX)
*   **Identidade Visual:** Nova identidade visual aplicada com sucesso em toda a plataforma. Inclui a substituição e otimização do ícone de favicon para as abas do navegador (`pagicon.png`), atualização da logo principal na tela de login, e a implementação de uma logomarca específica na barra lateral do dashboard (`logo_nova_barra.png`), ajustada com recuos negativos e escalas CSS para máximo aproveitamento de espaço em tela.
*   **Navegação Inteligente:** Barra lateral com rolagem customizada, garantindo acesso a todos os menus em qualquer resolução de tela ou tamanho de janela.

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

## 📤 Como subir para o GitHub (Passo a Passo)

Para versionar este projeto e compartilhá-lo no GitHub, siga estes passos no terminal da pasta raiz do projeto:

1.  **Inicializar o Repositório:**
    ```bash
    git init
    ```

2.  **Preparar os Arquivos:**
    ```bash
    git add .
    ```

3.  **Criar o Primeiro Registro (Commit):**
    ```bash
    git commit -m "Initial commit: Sistema AlocaPro completo"
    ```

4.  **Configurar o Repositório Remoto:**
    *   Crie um novo repositório no seu GitHub.
    *   Copie o link (ex: `https://github.com/seu-usuario/alojamento.git`).
    *   Execute:
    ```bash
    git remote add origin https://github.com/seu-usuario/alojamento.git
    ```

5.  **Enviar os Arquivos:**
    ```bash
    git branch -M main
    git push -u origin main
    ```

> [!TIP]
> Sempre que fizer uma alteração nova, repita os comandos: `git add .`, `git commit -m "descrição da mudança"` e `git push`.

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
    *   Estrutura de tabelas: `usuario`, `empresa`, `quarto`, `republica`, `funcionario`, `alocacao` e `modulo_funcao`.
    *   Colunas críticas em `alocacao`: `valor_diaria_contratado` para blindagem de faturamento.

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
*   **Isolamento de Dados:** Cada empresa isola seus próprios dados através de filtragem por `id_empresa`.
*   **Bloqueio de Acesso:** Sistema automático de verificação de status. Usuários, empresas inativas ou com **licenças expiradas** são impedidos de acessar o dashboard, com encerramento de sessão automático.
*   **Políticas RLS:** Integração total com as políticas de segurança (Row Level Security) do Supabase. Para novos usuários, certifique-se de que o `id` na tabela `usuario` corresponda ao UUID do Supabase Auth.

---
*Desenvolvido com foco em eficiência operacional e controle logístico.*
