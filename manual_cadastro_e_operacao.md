# Manual de Operação e Cadastros - AlocaPro

Este manual foi desenvolvido para orientar os usuários na operação diária do sistema **AlocaPro (Gestão Inteligente de Alojamentos)**, detalhando como gerenciar cadastros de alojamentos, repúblicas, funcionários e usuários, além de realizar operações de check-in, check-out e emissão de relatórios.

---

## Identidade Visual e Experiência do Usuário

O **AlocaPro** foi projetado com uma interface moderna, organizada e de fácil utilização:
*   **Identidade Visual Integrada:** A logomarca da aplicação está presente na tela de login, na barra lateral do painel e na aba do seu navegador, facilitando a identificação do sistema.
*   **Navegação Simplificada:** A barra lateral esquerda dá acesso direto a todas as telas de operação, cadastros e relatórios. Ela se adapta automaticamente a telas de computadores e notebooks de diferentes tamanhos.

---

## Gestão de Cadastros

Os cadastros são fundamentais para manter as informações do sistema organizadas. O sistema permite gerenciar os seguintes cadastros:

### 1. Cadastro de Funcionários
Gerencia os colaboradores que podem ser alocados em alojamentos ou repúblicas.

*   **Campos do Formulário:**
    *   **Nome Completo:** Nome do colaborador (sem abreviações).
    *   **CPF:** Campo com formatação automática. O sistema valida o CPF e impede o cadastro de CPFs inválidos ou repetidos.
    *   **Gênero:** Masculino ou Feminino (utilizado nas regras de alocação de quartos).
    *   **Telefone (WhatsApp):** Telefone com DDD para envio de mensagens com detalhes da hospedagem.
    *   **Módulo / Setor:** Setor de trabalho do funcionário (ex: Mineração, Administrativo).
    *   **Função:** Cargo do colaborador. As funções disponíveis mudam automaticamente de acordo com o Módulo selecionado.

---

### 2. Cadastro de Alojamentos
Gerencia os quartos físicos da empresa, que são agrupados por blocos.

*   **Campos do Formulário:**
    *   **Nome/Número do Alojamento:** Identificação do quarto (ex: *Quarto 101*).
    *   **Bloco:** Nome do bloco ou prédio (ex: *Bloco A*).
    *   **Capacidade:** Quantidade de vagas disponíveis (seleção de 1 a 10 pessoas).
    *   **Módulo Ocupacional:** Setor de trabalho associado a este quarto.
    *   **Gênero Permitido:** Restringe o quarto para ocupação masculina, feminina ou mista.
    *   **Diária Ocupada:** Valor cobrado por dia por cada vaga ocupada.
    *   **Diária Ociosa:** Custo diário por cada vaga que ficar vazia neste quarto.
    *   **Status:** Define se o quarto está *Ativo* (disponível para uso) ou *Inativo* (em manutenção).
    *   **Motivo da Inativação:** Justificativa da inativação (ex: *Manutenção elétrica*, *Reforma*).

---

### 3. Cadastro de Repúblicas
Gerencia as residências externas utilizadas para hospedar colaboradores.

*   **Campos do Formulário:**
    *   **Nome da República:** Identificação da casa (ex: *República Flores*).
    *   **Nome/Número do Quarto:** Quarto específico dentro da residência (ex: *Quarto 02*).
    *   **Endereço:** Endereço completo da república.
    *   **Bloco/Referência:** Ponto de referência ou agrupamento.
    *   **Capacidade:** Quantidade de vagas do quarto (seleção de 1 a 10 pessoas).
    *   **Módulo Ocupacional:** Setor de trabalho vinculado.
    *   **Gênero Permitido:** Restringe a ocupação por gênero (masculino, feminino ou misto).
    *   **Diária Ocupada:** Valor da diária para vaga ocupada.
    *   **Diária Ociosa:** Custo cobrado pela vaga vazia.
    *   **Status e Motivo de Inativação:** Permite colocar o quarto em manutenção ou registrar rescisão do imóvel.

---

### 4. Cadastro de Usuários
Controla quem tem permissão para acessar o sistema AlocaPro.

*   **Campos do Formulário:**
    *   **Nome Completo:** Nome do operador do sistema.
    *   **Email:** E-mail utilizado para login.
    *   **Perfil:** 
        *   *Usuário Comum:* Tem acesso às telas de mapa, check-in, check-out e relatórios.
        *   *Administrador:* Possui acesso total, incluindo a criação de novos usuários.
    *   **Usuário Ativo:** Chave liga/desliga para ativar ou suspender o acesso do usuário imediatamente.

---

## Mapas de Ocupação e Ações Rápidas

A visualização e a gestão diária dos quartos são feitas de forma interativa através das telas de **Mapa de Alojamentos** e **Mapa de Repúblicas**.

### Dashboard Analítico
O painel principal oferece uma visão geral rápida do sistema:
*   **Indicadores em Tempo Real:** Mostra o total de vagas, vagas ocupadas, vagas disponíveis e a taxa de ocupação geral.
*   **Divisão por Gênero:** Quadro simplificado mostrando a ocupação de vagas masculinas e femininas.
*   **Alertas de Ocupação:** Destaca automaticamente os locais mais cheios ou lotados para tomada de decisão rápida.

### Mapa Interativo
Os quartos são exibidos de forma visual no mapa, agrupados por blocos ou repúblicas.

*   **Legenda de Status (Código de Cores):**
    *   🟢 **Disponível:** O quarto possui vagas totalmente livres ou capacidade sobrando.
    *   🟡 **Quase Cheio:** O quarto está com ocupação parcial próxima do limite.
    *   🔴 **Lotado:** O quarto atingiu 100% da sua capacidade.
    *   ⚫ **Inativo:** O quarto está fora de operação (o motivo é exibido na tela).

*   **Busca Rápida de Hóspedes:** Digite o nome ou CPF de um funcionário no campo de busca para destacar visualmente no mapa exatamente onde ele está hospedado.
*   **Filtros Rápidos:** É possível filtrar os quartos exibidos no mapa por Bloco, por Setor (Módulo) ou clicando nas cores da legenda de status.
*   **Ações Diretas (Atalhos):**
    *   *Check-in Rápido:* Clique em qualquer vaga livre de um quarto no mapa para iniciar a hospedagem diretamente nele.
    *   *Check-out Rápido:* Clique no nome de um funcionário listado no card do quarto para iniciar o processo de saída dele.
    *   *Informações Rápidas (Tooltip):* Passe o mouse sobre o nome de um funcionário alocado para ver instantaneamente a sua função e a data e hora do seu check-in.
    *   *Transferência de Quarto:* Na tela de detalhes do quarto, você pode transferir um funcionário para outro quarto ou bloco com apenas um clique. Ao concluir, o sistema oferece um atalho para enviar a nova localização diretamente para o WhatsApp do funcionário.

---

## Processos de Hospedagem (Check-in e Check-out)

### 1. Entrada (Check-in)
Registra a entrada e alocação de um funcionário em um quarto.

*   **Segurança e Consistência:**
    *   O sistema impede que o mesmo funcionário seja alocado em dois quartos ao mesmo tempo.
    *   Não é permitido fazer check-in em quartos que já atingiram a capacidade máxima de vagas.
    *   O sistema respeita a restrição de gênero (ex: impede o cadastro de um funcionário masculino em um quarto definido como exclusivo feminino).

---

### 2. Saída (Check-out) e Faturamento
Registra a saída do colaborador, liberando a vaga no mapa e gerando as informações financeiras da estadia.

*   **Resumo Financeiro da Estadia:** Ao iniciar o check-out, o sistema calcula e exibe na tela:
    *   *Dias Hospedados:* Período total em que o funcionário permaneceu no quarto.
    *   *Valor da Diária:* Valor diário cobrado pela hospedagem.
    *   *Valor Total:* Custo final acumulado da estadia.

> [!TIP]
> **Carência de Cobrança (Check-out no mesmo dia):**
> Se você realizar o check-out de um colaborador no mesmo dia em que o check-in foi feito (comum para corrigir erros de digitação rápida), o sistema calcula o valor total das diárias como **R$ 0,00**, evitando cobranças incorretas.

> [!IMPORTANT]
> **Congelamento da Diária:**
> O valor da diária é fixado no momento do check-in. Se a diária de um quarto for alterada no cadastro posteriormente, o histórico de estadias antigas e ativas não será afetado, garantindo a integridade dos faturamentos já realizados.

---

## Relatórios e Auditoria

### 1. Relatório Individual (Histórico de Estadias)
Permite buscar o histórico de hospedagens passadas.
*   **Busca:** Filtre por data de início, data de fim ou pesquise pelo nome do colaborador.
*   **Exportação:** Permite gerar uma planilha no **Excel (XLSX)** com todas as estadias filtradas na tela.

---

### 2. Relatório de Ocupação e Vagas Ociosas
Ideal para conferir faturas e auditar a utilização física dos alojamentos em datas específicas.

*   **Consulta por Data Base (Histórico):** Permite escolher qualquer data do passado para verificar a taxa de ocupação, vagas cheias e vagas livres exatamente como estavam naquele dia. Muito útil para conferir cobranças antigas de fornecedores.
*   **Detalhamento (Lupa 🔍):** Ao clicar no ícone de lupa em qualquer linha de quarto ou bloco, o sistema abre uma janela detalhada mostrando nominalmente quem estava hospedado ali na data selecionada, calculando o custo de ocupação e o custo de vagas ociosas (vagas vazias).
*   **Exportação para Excel:** Toda a tabela do relatório pode ser exportada para planilhas Excel mantendo os mesmos filtros aplicados.
*   **Impressão Formatada:** O relatório possui um layout otimizado para impressão em papel. Ao acionar a impressão do navegador, menus e botões são ocultados automaticamente, gerando um documento limpo e oficial para auditoria física.

---

## Segurança e Regras do Sistema

### Trava de Segurança
*   Para evitar exclusões acidentais de registros importantes, o sistema possui uma **trava de segurança de 24 horas**. Exclusões só podem ser feitas dentro deste limite de tempo após a criação do registro.

### Troca de Senha
*   Qualquer operador pode alterar a sua própria senha de acesso diretamente no sistema clicando no botão **Alterar Senha** localizado no rodapé da barra lateral esquerda.

### Alertas de Licença
*   O sistema avisa na tela com 7 dias de antecedência quando o período de licença de uso do sistema estiver próximo do vencimento, bloqueando o acesso apenas quando a data limite for atingida.
