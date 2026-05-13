let currentUser = null;
let currentCompanyId = null;

// Elementos da UI
const userNameEl = document.getElementById('user-name');
const btnLogout = document.getElementById('btn-logout');
const roomsContainer = document.getElementById('rooms-container');

// Dados em memória
let quartos = [];
let republicas = [];
let funcionarios = [];
let alocacoesAtivas = [];
let alocacoesHistorico = [];
let empresas = [];
let todosUsuarios = [];

// Paginação e Filtros
let currentPageQuartos = 1;
let searchQuartos = '';
let currentPageRepublicas = 1;
let searchRepublicas = '';
let currentPageFuncs = 1;
let searchFuncs = '';
let currentPageHistorico = 1;
let searchHistorico = '';
let searchEmpresas = '';
let searchUsuarios = '';
let searchModulos = '';
let currentPageModulos = 1;
let currentPageOcupacao = 1;
let modulosFuncoes = [];
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Autenticação
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Buscar dados do usuário logado para obter a empresa
    // Tentamos primeiro pelo ID (Auth UUID) e depois pelo Email (fallback para usuários criados via form)
    let { data: userData } = await supabaseClient
        .from('usuario')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (!userData) {
        const { data: userDataByEmail } = await supabaseClient
            .from('usuario')
            .select('*')
            .ilike('email', session.user.email)
            .single();
        userData = userDataByEmail;
    }

    if (userData) {
        // Verificação de Segurança: Usuário Ativo
        if (userData.ativo === false) {
            alert('Sua conta de usuário está desativada. Por favor, entre em contato com o administrador.');
            await supabaseClient.auth.signOut();
            window.location.href = 'login.html';
            return;
        }

        // Verificação de Segurança: Empresa Ativa e Licença
        if (userData.id_empresa) {
            const { data: empresaData } = await supabaseClient
                .from('empresa')
                .select('ativo, data_expiracao')
                .eq('id', userData.id_empresa)
                .single();

            if (empresaData) {
                if (empresaData.ativo === false) {
                    alert('A sua empresa está inativada no sistema. Por favor, entre em contato com o suporte.');
                    await supabaseClient.auth.signOut();
                    window.location.href = 'login.html';
                    return;
                }

                // Verificar Expiração de Licença
                if (empresaData.data_expiracao) {
                    const expDate = new Date(empresaData.data_expiracao);
                    const today = new Date();
                    
                    // Zerar horas para comparação justa de dias
                    today.setHours(0,0,0,0);
                    expDate.setHours(0,0,0,0);

                    const diffTime = expDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays < 0) {
                        alert('A licença da sua empresa expirou. Por favor, entre em contato com o suporte para renovação.');
                        await supabaseClient.auth.signOut();
                        window.location.href = 'login.html';
                        return;
                    } else if (diffDays <= 7) {
                        const msg = diffDays === 0 ? 'Sua licença expira HOJE!' : `Atenção: Sua licença expira em ${diffDays} dia(s).`;
                        setTimeout(() => showToast(msg, 'warning'), 1500);
                    }
                }
            }
        }

        currentUser = userData;
        currentCompanyId = userData.id_empresa;
        userNameEl.textContent = `${userData.nome}`;
        
        // Atualizar perfil no rodapé da barra lateral (removendo o "Admin" fixo)
        const userProfileEl = document.querySelector('.user-info span:last-child');
        if (userProfileEl) {
            userProfileEl.textContent = userData.perfil.charAt(0).toUpperCase() + userData.perfil.slice(1).toLowerCase();
        }

        // Exibir seção de admin se o perfil for admin (case-insensitive)
        if (userData.perfil && userData.perfil.toLowerCase() === 'admin') {
            const adminSection = document.getElementById('admin-sidebar-section');
            if (adminSection) adminSection.classList.remove('d-none');
        }
    } else {
        userNameEl.textContent = session.user.email;
        showToast('Perfil não encontrado. Entre em contato com o administrador para vincular seu e-mail a uma empresa.', 'danger');
        console.error('Perfil do usuário não encontrado no Supabase (tabela usuario) para o ID:', session.user.id);
    }

    // Eventos
    btnLogout.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });

    document.getElementById('form-funcionario').addEventListener('submit', handleNovoFuncionario);
    document.getElementById('form-quarto').addEventListener('submit', handleNovoQuarto);
    const formRep = document.getElementById('form-republica');
    if (formRep) formRep.addEventListener('submit', handleNovoRepublica);
    document.getElementById('form-checkin').addEventListener('submit', handleCheckin);
    document.getElementById('form-checkout').addEventListener('submit', handleCheckout);
    document.getElementById('checkout-alocacao').addEventListener('change', atualizarInfoCheckout);
    document.getElementById('form-checkin-rapido').addEventListener('submit', handleCheckinRapido);
    document.getElementById('form-checkout-rapido').addEventListener('submit', handleCheckoutRapido);
    
    // Eventos Admin
    const formEmp = document.getElementById('form-empresa');
    if (formEmp) formEmp.addEventListener('submit', handleNovoEmpresa);
    const formUser = document.getElementById('form-usuario-admin');
    if (formUser) formUser.addEventListener('submit', handleNovoUsuario);
    const formMF = document.getElementById('form-modulo-funcao');
    if (formMF) formMF.addEventListener('submit', handleNovoModuloFuncao);
    const formSenha = document.getElementById('form-alterar-senha');
    if (formSenha) formSenha.addEventListener('submit', handleAlterarSenha);

    // Carregar dados iniciais
    await loadData();
});

// Navegação entre seções
window.switchSection = function(sectionId, element) {
    // Esconder todas as seções
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    // Mostrar a seção alvo
    document.getElementById(`sec-${sectionId}`).classList.add('active');

    // Atualizar menu ativo
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }

    // Recarregar dados específicos da aba
    if (sectionId === 'checkin') popularSelectsCheckin();
    if (sectionId === 'checkout') popularSelectsCheckout();
    if (sectionId === 'historico') renderizarListaHistorico();
    if (sectionId === 'empresas') renderizarListaEmpresas();
    if (sectionId === 'usuarios') {
        popularSelectEmpresaUsuario();
        renderizarListaUsuarios();
    }
    if (sectionId === 'funcionarios') {
        popularSelectsModulosFuncoes();
    }
    if (sectionId === 'quartos') {
        popularSelectsModulosLocais();
    }
    if (sectionId === 'republicas') {
        popularSelectsModulosLocais();
    }
    if (sectionId === 'modulos') {
        renderizarListaModulos();
    }
    if (sectionId === 'relatorio-ocupacao') {
        renderizarRelatorioOcupacao();
    }
}

// Função centralizada para carregar todos os dados
async function loadData() {
    try {
        if (!currentCompanyId) {
            console.warn('Aviso: currentCompanyId está nulo. Os dados de alojamento não serão carregados.');
            return;
        }

        // Buscar Quartos (Alojamentos)
        let qryQuartos = supabaseClient.from('quarto').select('*').eq('id_empresa', currentCompanyId).order('bloco').order('nome');
        const { data: quartosData, error: qError } = await qryQuartos;
        if (qError) throw qError;
        quartos = quartosData || [];

        // Buscar Repúblicas
        let qryReps = supabaseClient.from('republica').select('*').eq('id_empresa', currentCompanyId).order('nome');
        const { data: repData, error: rError } = await qryReps;
        if (rError) throw rError;
        republicas = repData || [];

        // Buscar Funcionários
        let qryFuncs = supabaseClient.from('funcionario').select('*').eq('id_empresa', currentCompanyId).order('nome');
        const { data: funcData, error: fError } = await qryFuncs;
        if (fError) throw fError;
        funcionarios = funcData || [];

        // Buscar Alocações Ativas (sem data_checkout)
        let qryAloc = supabaseClient.from('alocacao').select('*').eq('id_empresa', currentCompanyId).is('data_checkout', null);
        const { data: alocData, error: aError } = await qryAloc;
        if (aError) throw aError;
        alocacoesAtivas = alocData || [];

        // Buscar Alocações Históricas
        let qryHist = supabaseClient.from('alocacao').select('*').eq('id_empresa', currentCompanyId).not('data_checkout', 'is', null).order('data_checkout', {ascending: false});
        const { data: histData, error: hError } = await qryHist;
        if (hError) throw hError;
        alocacoesHistorico = histData || [];

        // Buscar Dados de Admin (se admin)
        if (currentUser && currentUser.perfil === 'admin') {
            const { data: empresasData } = await supabaseClient.from('empresa').select('*').order('nome');
            empresas = empresasData || [];

            const { data: usuariosData } = await supabaseClient.from('usuario').select('*').order('nome');
            todosUsuarios = usuariosData || [];

            const { data: mfData } = await supabaseClient.from('modulo_funcao').select('*').order('modulo').order('funcao');
            modulosFuncoes = mfData || [];
        }

        popularFiltrosMapa();
        atualizarDashboard();
    } catch (error) {
        showToast('Erro ao carregar dados: ' + error.message, 'danger');
        console.error(error);
    }
}

// Atualizar KPIs e Mapa
function atualizarDashboard() {
    const filter = document.getElementById('dashboard-filter')?.value || 'todos';
    
    let totalVagas = 0;
    let filteredQuartos = [...quartos];
    let filteredReps = [...republicas];
    let filteredAlocacoes = [...alocacoesAtivas];

    if (filter === 'alojamentos') {
        filteredReps = [];
        filteredAlocacoes = alocacoesAtivas.filter(a => a.id_quarto != null);
    } else if (filter === 'republicas') {
        filteredQuartos = [];
        filteredAlocacoes = alocacoesAtivas.filter(a => a.id_republica != null);
    }

    let vagasOcupadas = filteredAlocacoes.length;

    // Filtra apenas locais ativos para os KPIs
    const activeQuartos = filteredQuartos.filter(q => q.ativo !== false);
    const activeReps = filteredReps.filter(r => r.ativo !== false);

    activeQuartos.forEach(q => {
        totalVagas += parseInt(q.capacidade || 0);
    });
    activeReps.forEach(r => {
        totalVagas += parseInt(r.capacidade || 0);
    });

    let vagasDisponiveis = totalVagas - vagasOcupadas;
    let taxaOcupacao = totalVagas > 0 ? Math.round((vagasOcupadas / totalVagas) * 100) : 0;

    // Atualiza KPIs
    document.getElementById('kpi-total').textContent = totalVagas;
    document.getElementById('kpi-ocupadas').textContent = vagasOcupadas;
    document.getElementById('kpi-disponiveis').textContent = vagasDisponiveis;
    document.getElementById('kpi-taxa').textContent = `${taxaOcupacao}%`;

    // Atualiza Resumo
    const resumoLabel = document.getElementById('resumo-label');
    if (resumoLabel) {
        if (filter === 'alojamentos') resumoLabel.textContent = 'Alojamentos';
        else if (filter === 'republicas') resumoLabel.textContent = 'Repúblicas';
        else resumoLabel.textContent = 'Alojamentos e Repúblicas';
    }

    document.getElementById('resumo-quartos').textContent = filteredQuartos.length + filteredReps.length;
    document.getElementById('resumo-funcionarios').textContent = filter === 'todos' ? funcionarios.length : '-';
    document.getElementById('resumo-ocupacao-texto').textContent = `${vagasOcupadas}/${totalVagas}`;
    document.getElementById('resumo-progress').style.width = `${taxaOcupacao}%`;

    renderizarMapaAlojamentos();
    renderizarMapaRepublicas();
    renderizarListaQuartos();
    renderizarListaRepublicas();
    renderizarListaFuncionarios();
    
    // Se for admin, renderizar também as listas de administração
    if (currentUser && currentUser.perfil === 'admin') {
        renderizarListaEmpresas();
        renderizarListaUsuarios();
        popularSelectEmpresaUsuario();
        renderizarListaModulos();
    }
    popularSelectsModulosFuncoes();
    popularSelectsModulosLocais();
    if (document.getElementById('sec-relatorio-ocupacao').classList.contains('active')) {
        renderizarRelatorioOcupacao();
    }
}

// Renderizar os cards dos alojamentos agrupados por bloco
function renderizarMapaAlojamentos() {
    roomsContainer.innerHTML = '';

    if (quartos.length === 0) {
        roomsContainer.innerHTML = '<div class="col-12 text-center text-muted py-5"><i class="bi bi-info-circle fs-1"></i><br>Nenhum alojamento cadastrado.</div>';
        return;
    }

    // Identificar blocos únicos
    let blocosUnicos = [...new Set(quartos.map(q => q.bloco))].sort();

    // Aplicar Filtro
    const filtroBloco = document.getElementById('filter-mapa-bloco')?.value || 'todos';
    if (filtroBloco !== 'todos') {
        blocosUnicos = blocosUnicos.filter(b => b === filtroBloco);
    }

    blocosUnicos.forEach(bloco => {
        // Container do Bloco
        const blockContainer = document.createElement('div');
        blockContainer.className = 'card border-0 mb-4 p-4 shadow-sm';
        
        // Cabeçalho do Bloco
        blockContainer.innerHTML = `
            <div class="d-flex align-items-center mb-4 pb-3 border-bottom">
                <div class="bg-primary text-white rounded d-flex align-items-center justify-content-center me-3" style="width: 42px; height: 42px; font-size: 1.25rem;">
                    <i class="bi bi-building"></i>
                </div>
                <h4 class="fw-bold mb-0 text-dark">${bloco}</h4>
            </div>
        `;

        // Container do Grid de Quartos
        const gridDiv = document.createElement('div');
        gridDiv.className = 'rooms-grid';

        const quartosDoBloco = quartos.filter(q => q.bloco === bloco);

        quartosDoBloco.forEach(quarto => {
            const isAtivo = quarto.ativo !== false;
            const alocacoesQuarto = alocacoesAtivas.filter(a => a.id_quarto === quarto.id);
            const ocupacaoAtual = alocacoesQuarto.length;
            const capacidade = parseInt(quarto.capacidade);

            // Definir status visual
            let statusBadge = 'badge-available';
            let statusText = 'Disponível';
            let cardClass = '';
            
            if (!isAtivo) {
                statusBadge = 'badge-secondary text-dark bg-opacity-10';
                statusText = 'Inativo';
                cardClass = 'opacity-75';
            } else if (ocupacaoAtual >= capacidade) {
                statusBadge = 'badge-lotado';
                statusText = 'Lotado';
                cardClass = 'lotado';
            } else if (ocupacaoAtual >= capacidade / 2 && ocupacaoAtual > 0) {
                statusBadge = 'badge-almost';
                statusText = 'Quase cheio';
            }

            // Montar lista de funcionários / vagas
            let listaHTML = '<ul class="employee-list">';
            let vagasLivres = capacidade - ocupacaoAtual;

            if (!isAtivo) {
                listaHTML += `
                    <li class="employee-item text-danger fw-bold py-3 text-center border-top mt-2" style="background: rgba(239, 68, 68, 0.05); cursor: default;">
                        <i class="bi bi-exclamation-triangle-fill"></i> LOCAL INATIVO<br>
                        <span class="small fw-normal text-muted">${quarto.motivo_inativo || 'Sem motivo informado'}</span>
                    </li>
                `;
            } else {
                // Funcionários reais
                alocacoesQuarto.forEach(aloc => {
                    const func = funcionarios.find(f => f.id === aloc.id_funcionario);
                    if (func) {
                        const safeNomeFunc = func.nome.replace(/'/g, "\\'");
                        const safeNomeQuarto = quarto.nome.replace(/'/g, "\\'");
                        listaHTML += `
                            <li class="employee-item" onclick="abrirModalCheckoutRapido('${aloc.id}', '${safeNomeFunc}', '${quarto.id}', 'q')">
                                <i class="bi bi-person"></i> ${func.nome}
                            </li>
                        `;
                    }
                });

                // Vagas Livres
                for(let i=0; i<vagasLivres; i++) {
                    const safeNomeQuarto = quarto.nome.replace(/'/g, "\\'");
                    listaHTML += `
                        <li class="employee-item vaga-livre" onclick="abrirModalCheckinRapido('${quarto.id}', '${safeNomeQuarto}', 'q')">
                            <i class="bi bi-person"></i> vaga livre
                        </li>
                    `;
                }
            }

            listaHTML += '</ul>';

            // Montar Card
            const cardHTML = `
                <div class="card room-card ${cardClass}">
                    <div class="room-header">
                        <div class="w-100">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h3 class="room-title"><i class="bi bi-door-open"></i> ${quarto.nome}</h3>
                                <div class="badge-status ${statusBadge}">
                                    ${statusText}
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-2 mb-1">
                                ${getIconeSexoPermitido(quarto.sexo_permitido)}
                                <span class="room-subtitle m-0">${ocupacaoAtual}/${capacidade} ocupadas</span>
                                <span class="room-subtitle m-0 fw-bold text-primary">R$ ${parseFloat(quarto.valor_diaria||0).toFixed(2)}</span>
                            </div>
                            <div class="small text-muted" style="font-size: 0.75rem;"><i class="bi bi-layers"></i> Bloco ${quarto.bloco}</div>
                        </div>
                    </div>
                    ${listaHTML}
                </div>
            `;

            gridDiv.insertAdjacentHTML('beforeend', cardHTML);
        });

        blockContainer.appendChild(gridDiv);
        roomsContainer.appendChild(blockContainer);
    });
}

// Renderizar os cards das repúblicas
function renderizarMapaRepublicas() {
    const repsContainer = document.getElementById('reps-container');
    if(!repsContainer) return;

    repsContainer.innerHTML = '';

    if (republicas.length === 0) {
        repsContainer.innerHTML = '<div class="col-12 text-center text-muted py-5"><i class="bi bi-house-door fs-1"></i><br>Nenhuma república cadastrada.</div>';
        return;
    }

    // Agrupar por nome da república
    let nomesReps = [...new Set(republicas.map(r => r.nome))].sort();

    // Aplicar Filtro
    const filtroRep = document.getElementById('filter-mapa-republica')?.value || 'todos';
    if (filtroRep !== 'todos') {
        nomesReps = nomesReps.filter(n => n === filtroRep);
    }

    nomesReps.forEach(nomeRep => {
        const quartosDaRep = republicas.filter(r => r.nome === nomeRep);
        const endereco = quartosDaRep[0].endereco;

        // Container da República
        const repContainer = document.createElement('div');
        repContainer.className = 'card border-0 mb-4 p-4 shadow-sm';

        // Cabeçalho da República
        repContainer.innerHTML = `
            <div class="d-flex align-items-center mb-4 pb-3 border-bottom">
                <div class="bg-success text-white rounded d-flex align-items-center justify-content-center me-3" style="width: 42px; height: 42px; font-size: 1.25rem;">
                    <i class="bi bi-house-door"></i>
                </div>
                <div>
                    <h4 class="fw-bold mb-0 text-dark">${nomeRep}</h4>
                    <div class="small text-muted"><i class="bi bi-geo-alt"></i> ${endereco}</div>
                </div>
            </div>
        `;

        const gridDiv = document.createElement('div');
        gridDiv.className = 'rooms-grid';

        quartosDaRep.forEach(republica => {
            const isAtivo = republica.ativo !== false;
            const alocacoesRep = alocacoesAtivas.filter(a => a.id_republica === republica.id);
            const ocupacaoAtual = alocacoesRep.length;
            const capacidade = parseInt(republica.capacidade);

            let statusBadge = 'badge-available';
            let statusText = 'Disponível';
            let cardClass = '';
            
            if (!isAtivo) {
                statusBadge = 'badge-secondary text-dark bg-opacity-10';
                statusText = 'Inativo';
                cardClass = 'opacity-75';
            } else if (ocupacaoAtual >= capacidade) {
                statusBadge = 'badge-lotado';
                statusText = 'Lotado';
                cardClass = 'lotado';
            } else if (ocupacaoAtual >= capacidade / 2 && ocupacaoAtual > 0) {
                statusBadge = 'badge-almost';
                statusText = 'Quase cheio';
            }

            let listaHTML = '<ul class="employee-list">';
            let vagasLivres = capacidade - ocupacaoAtual;

            if (!isAtivo) {
                listaHTML += `
                    <li class="employee-item text-danger fw-bold py-3 text-center border-top mt-2" style="background: rgba(239, 68, 68, 0.05); cursor: default;">
                        <i class="bi bi-exclamation-triangle-fill"></i> LOCAL INATIVO<br>
                        <span class="small fw-normal text-muted">${republica.motivo_inativo || 'Sem motivo informado'}</span>
                    </li>
                `;
            } else {
                alocacoesRep.forEach(aloc => {
                    const func = funcionarios.find(f => f.id === aloc.id_funcionario);
                    if (func) {
                        const safeNomeFunc = func.nome.replace(/'/g, "\\'");
                        const safeNomeRep = republica.nome.replace(/'/g, "\\'");
                        listaHTML += `
                            <li class="employee-item" onclick="abrirModalCheckoutRapido('${aloc.id}', '${safeNomeFunc}', '${republica.id}', 'r')">
                                <i class="bi bi-person"></i> ${func.nome}
                            </li>
                        `;
                    }
                });

                for(let i=0; i<vagasLivres; i++) {
                    const safeNomeRep = republica.nome.replace(/'/g, "\\'");
                    listaHTML += `
                        <li class="employee-item vaga-livre" onclick="abrirModalCheckinRapido('${republica.id}', '${safeNomeRep}', 'r')">
                            <i class="bi bi-person"></i> vaga livre
                        </li>
                    `;
                }
            }
            listaHTML += '</ul>';

            const cardHTML = `
                <div class="card room-card ${cardClass}">
                    <div class="room-header">
                        <div class="w-100">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h3 class="room-title"><i class="bi bi-door"></i> ${republica.quarto || 'Principal'}</h3>
                                <div class="badge-status ${statusBadge}">
                                    ${statusText}
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-2 mb-0">
                                ${getIconeSexoPermitido(republica.sexo_permitido)}
                                <span class="room-subtitle m-0">${ocupacaoAtual}/${capacidade} ocupadas</span>
                                <span class="room-subtitle m-0 fw-bold text-primary">R$ ${parseFloat(republica.valor_diaria||0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    ${listaHTML}
                </div>
            `;
            gridDiv.insertAdjacentHTML('beforeend', cardHTML);
        });

        repContainer.appendChild(gridDiv);
        repsContainer.appendChild(repContainer);
    });
}

function popularFiltrosMapa() {
    const selectBloco = document.getElementById('filter-mapa-bloco');
    const selectRep = document.getElementById('filter-mapa-republica');
    
    if (selectBloco) {
        const valorAtual = selectBloco.value;
        const blocos = [...new Set(quartos.map(q => q.bloco))].sort();
        selectBloco.innerHTML = '<option value="todos">Todos os Blocos</option>';
        blocos.forEach(b => {
            selectBloco.innerHTML += `<option value="${b}">${b}</option>`;
        });
        selectBloco.value = valorAtual || 'todos';
        if (selectBloco.selectedIndex === -1) selectBloco.value = 'todos';
    }
    
    if (selectRep) {
        const valorAtual = selectRep.value;
        const nomesReps = [...new Set(republicas.map(r => r.nome))].sort();
        selectRep.innerHTML = '<option value="todos">Todas as Repúblicas</option>';
        nomesReps.forEach(n => {
            selectRep.innerHTML += `<option value="${n}">${n}</option>`;
        });
        selectRep.value = valorAtual || 'todos';
        if (selectRep.selectedIndex === -1) selectRep.value = 'todos';
    }
}

// Helpers para Paginação
function renderPagination(totalItems, currentPage, elementId, changePageFunc) {
    const ul = document.getElementById(elementId);
    ul.innerHTML = '';
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return;

    ul.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="${changePageFunc}(${currentPage - 1}); return false;">&laquo;</a>
        </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
        ul.innerHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="${changePageFunc}(${i}); return false;">${i}</a>
            </li>
        `;
    }

    ul.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="${changePageFunc}(${currentPage + 1}); return false;">&raquo;</a>
        </li>
    `;
}

// Handlers de Busca e Troca de Página
window.handleSearchQuartos = function() {
    searchQuartos = document.getElementById('search-quartos').value.toLowerCase();
    currentPageQuartos = 1;
    renderizarListaQuartos();
}

window.changePageQuartos = function(page) {
    currentPageQuartos = page;
    renderizarListaQuartos();
}

window.handleSearchFuncs = function() {
    searchFuncs = document.getElementById('search-funcs').value.toLowerCase();
    currentPageFuncs = 1;
    renderizarListaFuncionarios();
}

window.changePageFuncs = function(page) {
    currentPageFuncs = page;
    renderizarListaFuncionarios();
}

window.handleSearchRepublicas = function() {
    searchRepublicas = document.getElementById('search-republicas').value.toLowerCase();
    currentPageRepublicas = 1;
    renderizarListaRepublicas();
}

window.changePageRepublicas = function(page) {
    currentPageRepublicas = page;
    renderizarListaRepublicas();
}

window.handleSearchHistorico = function() {
    searchHistorico = document.getElementById('search-historico').value.toLowerCase();
    currentPageHistorico = 1;
    renderizarListaHistorico();
}

window.changePageHistorico = function(page) {
    currentPageHistorico = page;
    renderizarListaHistorico();
}

function getIconeSexoPermitido(val) {
    if(val === 'M') return '<span class="badge bg-primary bg-opacity-10 text-primary"><i class="bi bi-gender-male"></i> Masculino</span>';
    if(val === 'F') return '<span class="badge bg-danger bg-opacity-10 text-danger"><i class="bi bi-gender-female"></i> Feminino</span>';
    return '<span class="badge bg-secondary bg-opacity-10 text-secondary"><i class="bi bi-gender-ambiguous"></i> Misto</span>';
}

function getIconeSexoFuncionario(val) {
    if(val === 'M') return '<span class="text-primary"><i class="bi bi-gender-male"></i> Masc</span>';
    if(val === 'F') return '<span class="text-danger"><i class="bi bi-gender-female"></i> Fem</span>';
    return '-';
}

// Renderizar Tabela de Alojamentos
function renderizarListaQuartos() {
    const tbody = document.getElementById('lista-quartos-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    
    // Filtrar
    const filtered = quartos.filter(q => 
        q.nome.toLowerCase().includes(searchQuartos) || 
        q.bloco.toLowerCase().includes(searchQuartos)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhum alojamento encontrado.</td></tr>';
        document.getElementById('pagination-quartos').innerHTML = '';
        return;
    }

    // Paginar
    const start = (currentPageQuartos - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    paginated.forEach(q => {
        const isAtivo = q.ativo !== false;
        tbody.innerHTML += `
            <tr>
                <td class="fw-medium"><i class="bi bi-door-open me-2 text-muted"></i>${q.nome}</td>
                <td>${q.bloco}</td>
                <td><small class="badge bg-light text-dark border">${q.modulo || '-'}</small></td>
                <td>
                    <small class="text-success">Ocup: R$ ${parseFloat(q.valor_diaria||0).toFixed(2)}</small><br>
                    <small class="text-muted">Ocio: R$ ${parseFloat(q.valor_diaria_ociosa||0).toFixed(2)}</small>
                </td>
                <td>${q.capacidade} vagas</td>
                <td>${isAtivo ? '<span class="badge bg-success bg-opacity-10 text-success">Ativo</span>' : '<span class="badge bg-danger bg-opacity-10 text-danger" title="'+(q.motivo_inativo||'')+'">Inativo</span>'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light text-primary" onclick="editarQuarto('${q.id}')"><i class="bi bi-pencil"></i></button>
                </td>
            </tr>
        `;
    });

    renderPagination(filtered.length, currentPageQuartos, 'pagination-quartos', 'changePageQuartos');
}

// Renderizar Tabela de Repúblicas
function renderizarListaRepublicas() {
    const tbody = document.getElementById('lista-republicas-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    
    // Filtrar
    const filtered = republicas.filter(r => 
        r.nome.toLowerCase().includes(searchRepublicas) || 
        r.endereco.toLowerCase().includes(searchRepublicas)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhuma república encontrada.</td></tr>';
        document.getElementById('pagination-republicas').innerHTML = '';
        return;
    }

    // Paginar
    const start = (currentPageRepublicas - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    paginated.forEach(r => {
        const isAtivo = r.ativo !== false;
        tbody.innerHTML += `
            <tr>
                <td class="fw-medium"><i class="bi bi-house-door me-2 text-muted"></i>${r.nome}</td>
                <td>${r.quarto || '-'}</td>
                <td><small class="badge bg-light text-dark border">${r.modulo || '-'}</small></td>
                <td>
                    <small class="text-success">Ocup: R$ ${parseFloat(r.valor_diaria||0).toFixed(2)}</small><br>
                    <small class="text-muted">Ocio: R$ ${parseFloat(r.valor_diaria_ociosa||0).toFixed(2)}</small>
                </td>
                <td>${r.capacidade} vagas</td>
                <td>${isAtivo ? '<span class="badge bg-success bg-opacity-10 text-success">Ativo</span>' : '<span class="badge bg-danger bg-opacity-10 text-danger" title="'+(r.motivo_inativo||'')+'">Inativo</span>'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light text-primary" onclick="editarRepublica('${r.id}')"><i class="bi bi-pencil"></i></button>
                </td>
            </tr>
        `;
    });

    renderPagination(filtered.length, currentPageRepublicas, 'pagination-republicas', 'changePageRepublicas');
}

// Renderizar Tabela de Funcionários
function renderizarListaFuncionarios() {
    const tbody = document.getElementById('lista-funcionarios-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';

    // Filtrar
    const filtered = funcionarios.filter(f => 
        f.nome.toLowerCase().includes(searchFuncs) || 
        (f.cpf && f.cpf.toLowerCase().includes(searchFuncs))
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhum funcionário encontrado.</td></tr>';
        document.getElementById('pagination-funcs').innerHTML = '';
        return;
    }

    // Paginar
    const start = (currentPageFuncs - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    paginated.forEach(f => {
        // Checar status de alocação
        const alocacao = alocacoesAtivas.find(a => a.id_funcionario === f.id);
        const mf = modulosFuncoes.find(m => m.id === f.id_modulo_funcao);
        
        let statusBadge = '<span class="badge bg-secondary fw-normal">Sem vaga</span>';
        if (alocacao) {
            if (alocacao.id_quarto) {
                const quarto = quartos.find(q => q.id === alocacao.id_quarto);
                if (quarto) statusBadge = `<span class="badge bg-success fw-normal">Alocado (Alojamento ${quarto.nome})</span>`;
            } else if (alocacao.id_republica) {
                const rep = republicas.find(r => r.id === alocacao.id_republica);
                if (rep) statusBadge = `<span class="badge bg-success fw-normal">Alocado (República ${rep.nome})</span>`;
            } else {
                statusBadge = `<span class="badge bg-success fw-normal">Alocado</span>`;
            }
        }

        tbody.innerHTML += `
            <tr>
                <td class="fw-medium"><i class="bi bi-person me-2 text-muted"></i>${f.nome}</td>
                <td>${f.cpf || '-'}</td>
                <td><small class="text-muted">${mf ? mf.modulo + ' - ' + mf.funcao : '-'}</small></td>
                <td>${f.telefone || '-'}</td>
                <td>${statusBadge}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light text-primary" onclick="editarFuncionario('${f.id}')"><i class="bi bi-pencil"></i></button>
                </td>
            </tr>
        `;
    });

    renderPagination(filtered.length, currentPageFuncs, 'pagination-funcs', 'changePageFuncs');
}

// Renderizar Tabela de Histórico
function renderizarListaHistorico() {
    const tbody = document.getElementById('lista-historico-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    
    // Preparar dados enriquecidos (com nomes do funcionário e locais)
    const enrichedData = alocacoesHistorico.map(a => {
        const f = funcionarios.find(x => x.id === a.id_funcionario);
        let nome_local = "-";
        if (a.id_quarto) {
            const q = quartos.find(x => x.id === a.id_quarto);
            if(q) nome_local = "Alojamento " + q.nome;
        } else if (a.id_republica) {
            const r = republicas.find(x => x.id === a.id_republica);
            if(r) nome_local = "República " + r.nome;
        }
        return {
            ...a,
            nome_funcionario: f ? f.nome : 'Desconhecido',
            nome_local: nome_local
        };
    });

    // Filtrar
    const valInicial = document.getElementById('filter-data-inicial').value;
    const valFinal = document.getElementById('filter-data-final').value;

    const filtered = enrichedData.filter(a => {
        const matchesSearch = a.nome_funcionario.toLowerCase().includes(searchHistorico);
        
        let matchesPeriodo = true;
        if (valInicial) {
            const dateIn = a.data_checkin.split('T')[0];
            if (dateIn < valInicial) matchesPeriodo = false;
        }
        if (valFinal) {
            const dateOut = a.data_checkout.split('T')[0];
            if (dateOut > valFinal) matchesPeriodo = false;
        }

        return matchesSearch && matchesPeriodo;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhum registro no relatório.</td></tr>';
        document.getElementById('pagination-historico').innerHTML = '';
        return;
    }

    // Paginar
    const start = (currentPageHistorico - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    paginated.forEach(a => {
        const inDate = new Date(a.data_checkin).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'});
        const outDate = new Date(a.data_checkout).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'});
        
        const durationMs = new Date(a.data_checkout) - new Date(a.data_checkin);
        const durationDays = (durationMs / (1000 * 60 * 60 * 24)).toFixed(1);

        tbody.innerHTML += `
            <tr>
                <td class="fw-medium"><i class="bi bi-person me-2 text-muted"></i>${a.nome_funcionario}</td>
                <td>${a.nome_local}</td>
                <td>${inDate}</td>
                <td>${outDate}</td>
                <td class="text-center fw-bold text-dark">${durationDays}</td>
                <td class="text-end fw-bold text-primary">R$ ${parseFloat(a.valor_total||0).toFixed(2)}</td>
            </tr>
        `;
    });

    renderPagination(filtered.length, currentPageHistorico, 'pagination-historico', 'changePageHistorico');
}

window.exportarHistoricoExcel = function() {
    // 1. Obter dados enriquecidos
    const enrichedData = alocacoesHistorico.map(a => {
        const f = funcionarios.find(x => x.id === a.id_funcionario);
        let nome_local = "-";
        if (a.id_quarto) {
            const q = quartos.find(x => x.id === a.id_quarto);
            if(q) nome_local = "Alojamento " + q.nome;
        } else if (a.id_republica) {
            const r = republicas.find(x => x.id === a.id_republica);
            if(r) nome_local = "República " + r.nome;
        }
        const durationMs = new Date(a.data_checkout) - new Date(a.data_checkin);
        const durationDays = (durationMs / (1000 * 60 * 60 * 24)).toFixed(1);

        return {
            'Funcionário': f ? f.nome : 'Desconhecido',
            'Local': nome_local,
            'Entrada': new Date(a.data_checkin).toLocaleString('pt-BR'),
            'Saída': new Date(a.data_checkout).toLocaleString('pt-BR'),
            'Duração (Dias)': parseFloat(durationDays),
            'Valor Total (R$)': parseFloat(a.valor_total || 0).toFixed(2),
            _search: f ? f.nome.toLowerCase() : '',
            _dateIn: a.data_checkin.split('T')[0],
            _dateOut: a.data_checkout.split('T')[0]
        };
    });

    // 2. Aplicar filtros
    const valInicial = document.getElementById('filter-data-inicial').value;
    const valFinal = document.getElementById('filter-data-final').value;
    
    const filtered = enrichedData.filter(a => {
        const matchesSearch = a._search.includes(searchHistorico);
        let matchesPeriodo = true;
        if (valInicial && a._dateIn < valInicial) matchesPeriodo = false;
        if (valFinal && a._dateOut > valFinal) matchesPeriodo = false;
        return matchesSearch && matchesPeriodo;
    });

    if (filtered.length === 0) {
        showToast('Nenhum dado para exportar.', 'warning');
        return;
    }

    // 3. Limpar e Exportar
    const cleanData = filtered.map(({ _search, _dateIn, _dateOut, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Histórico");
    XLSX.writeFile(wb, `Alojamento_Historico_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Exportação concluída!', 'success');
}

// Popula os selects do check-in
function popularSelectsCheckin() {
    const selectFunc = document.getElementById('checkin-funcionario');
    const selectQuarto = document.getElementById('checkin-quarto');

    selectFunc.innerHTML = '<option value="">Selecione um funcionário...</option>';
    selectQuarto.innerHTML = '<option value="">Selecione um local...</option>';

    // Funcionários sem alocação ativa
    const funcionariosLivres = funcionarios.filter(f => !alocacoesAtivas.some(a => a.id_funcionario === f.id));
    funcionariosLivres.forEach(f => {
        selectFunc.innerHTML += `<option value="${f.id}">${f.nome} (CPF: ${f.cpf || 'N/A'})</option>`;
    });

    // Alojamentos com vagas
    let htmlQuartos = '<optgroup label="Alojamentos">';
    const quartosComVagas = quartos.filter(q => {
        const ocupacao = alocacoesAtivas.filter(a => a.id_quarto === q.id).length;
        return ocupacao < parseInt(q.capacidade);
    });
    quartosComVagas.forEach(q => {
        const ocupacao = alocacoesAtivas.filter(a => a.id_quarto === q.id).length;
        htmlQuartos += `<option value="q_${q.id}">${q.nome} - Bloco ${q.bloco} (${ocupacao}/${q.capacidade} ocupado)</option>`;
    });
    htmlQuartos += '</optgroup>';

    // Repúblicas com vagas
    let htmlRepublicas = '<optgroup label="Repúblicas">';
    const repComVagas = republicas.filter(r => {
        const ocupacao = alocacoesAtivas.filter(a => a.id_republica === r.id).length;
        return ocupacao < parseInt(r.capacidade);
    });
    repComVagas.forEach(r => {
        const ocupacao = alocacoesAtivas.filter(a => a.id_republica === r.id).length;
        htmlRepublicas += `<option value="r_${r.id}">${r.nome} (${ocupacao}/${r.capacidade} ocupado)</option>`;
    });
    htmlRepublicas += '</optgroup>';

    selectQuarto.innerHTML += htmlQuartos + htmlRepublicas;
}

// Popula os selects do check-out
function popularSelectsCheckout() {
    const selectAloc = document.getElementById('checkout-alocacao');
    selectAloc.innerHTML = '<option value="">Selecione um funcionário...</option>';

    alocacoesAtivas.forEach(aloc => {
        const func = funcionarios.find(f => f.id === aloc.id_funcionario);
        if (aloc.id_quarto) {
            const quarto = quartos.find(q => q.id === aloc.id_quarto);
            if (func && quarto) {
                selectAloc.innerHTML += `<option value="${aloc.id}">${func.nome} (Alojamento ${quarto.nome} - Bloco ${quarto.bloco})</option>`;
            }
        } else if (aloc.id_republica) {
            const rep = republicas.find(r => r.id === aloc.id_republica);
            if (func && rep) {
                selectAloc.innerHTML += `<option value="${aloc.id}">${func.nome} (República ${rep.nome})</option>`;
            }
        }
    });
}

// Handlers de Formulários
async function handleNovoFuncionario(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-func');
    btn.disabled = true;
    btn.innerHTML = 'Salvando...';

    const id = document.getElementById('func-id').value;
    const nome = document.getElementById('func-nome').value;
    const cpf = document.getElementById('func-cpf').value;
    const telefone = document.getElementById('func-telefone').value;
    const sexo = document.getElementById('func-sexo').value;
    const id_modulo_funcao = document.getElementById('func-funcao').value || null;

    const payload = { nome, cpf, telefone, sexo, id_modulo_funcao };
    if (currentCompanyId) payload.id_empresa = currentCompanyId;

    let error;
    if (id) {
        const { error: updateError } = await supabaseClient.from('funcionario').update(payload).eq('id', id);
        error = updateError;
    } else {
        const { error: insertError } = await supabaseClient.from('funcionario').insert([payload]);
        error = insertError;
    }

    if (error) {
        showToast('Erro ao salvar funcionário: ' + error.message, 'danger');
    } else {
        showToast(id ? 'Funcionário atualizado com sucesso!' : 'Funcionário cadastrado com sucesso!', 'success');
        cancelarEdicaoFuncionario();
        await loadData();
    }
    
    btn.disabled = false;
}

async function handleNovoQuarto(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-quarto');
    btn.disabled = true;
    btn.innerHTML = 'Salvando...';

    const id = document.getElementById('quarto-id').value;
    const nome = document.getElementById('quarto-nome').value;
    const bloco = document.getElementById('quarto-bloco').value;
    const capacidade = document.getElementById('quarto-capacidade').value;
    const valor_diaria = document.getElementById('quarto-diaria').value;
    const valor_diaria_ociosa = document.getElementById('quarto-diaria-ociosa').value;
    const modulo = document.getElementById('quarto-modulo').value;
    const sexo_permitido = document.getElementById('quarto-sexo').value;
    const ativo = document.getElementById('quarto-status').value === 'true';
    const motivo_inativo = document.getElementById('quarto-motivo').value;

    const payload = { nome, bloco, modulo, capacidade: parseInt(capacidade), valor_diaria: parseFloat(valor_diaria), valor_diaria_ociosa: parseFloat(valor_diaria_ociosa), sexo_permitido, ativo, motivo_inativo };
    if (currentCompanyId) payload.id_empresa = currentCompanyId;

    // Trava de segurança: Não inativar se houver gente alocada
    if (id && ativo === false) {
        const ocupado = alocacoesAtivas.some(a => a.id_quarto === id);
        if (ocupado) {
            showToast('Não é possível inativar um alojamento com funcionários alocados. Realize o check-out primeiro.', 'warning');
            btn.disabled = false;
            btn.innerHTML = id ? 'Salvar Alterações' : 'Cadastrar Alojamento';
            return;
        }
    }

    let error;
    if (id) {
        const { error: updateError } = await supabaseClient.from('quarto').update(payload).eq('id', id);
        error = updateError;
    } else {
        const { error: insertError } = await supabaseClient.from('quarto').insert([payload]);
        error = insertError;
    }

    if (error) {
        showToast('Erro ao salvar alojamento: ' + error.message, 'danger');
    } else {
        showToast(id ? 'Alojamento atualizado com sucesso!' : 'Alojamento cadastrado com sucesso!', 'success');
        cancelarEdicaoQuarto();
        await loadData();
    }

    btn.disabled = false;
}

async function handleNovoRepublica(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-republica');
    btn.disabled = true;
    btn.innerHTML = 'Salvando...';

    const id = document.getElementById('republica-id').value;
    const nome = document.getElementById('republica-nome').value;
    const bloco = document.getElementById('republica-bloco').value;
    const capacidade = document.getElementById('republica-capacidade').value;
    const valor_diaria = document.getElementById('republica-diaria').value;
    const valor_diaria_ociosa = document.getElementById('republica-diaria-ociosa').value;
    const modulo = document.getElementById('republica-modulo').value;
    const sexo_permitido = document.getElementById('republica-sexo').value;
    const endereco = document.getElementById('republica-endereco').value;
    const quarto = document.getElementById('republica-quarto').value;
    const ativo = document.getElementById('republica-status').value === 'true';
    const motivo_inativo = document.getElementById('republica-motivo').value;

    const payload = { 
        nome, bloco, modulo,
        capacidade: parseInt(capacidade), 
        valor_diaria: parseFloat(valor_diaria), 
        valor_diaria_ociosa: parseFloat(valor_diaria_ociosa),
        endereco, sexo_permitido, quarto, ativo, motivo_inativo 
    };
    if (currentCompanyId) payload.id_empresa = currentCompanyId;

    // Trava de segurança: Não inativar se houver gente alocada
    if (id && ativo === false) {
        const ocupado = alocacoesAtivas.some(a => a.id_republica === id);
        if (ocupado) {
            showToast('Não é possível inativar uma república com funcionários alocados. Realize o check-out primeiro.', 'warning');
            btn.disabled = false;
            btn.innerHTML = id ? 'Salvar Alterações' : 'Cadastrar República';
            return;
        }
    }

    let error;
    if (id) {
        const { error: updateError } = await supabaseClient.from('republica').update(payload).eq('id', id);
        error = updateError;
    } else {
        const { error: insertError } = await supabaseClient.from('republica').insert([payload]);
        error = insertError;
    }

    if (error) {
        showToast('Erro ao salvar república: ' + error.message, 'danger');
    } else {
        showToast(id ? 'República atualizada com sucesso!' : 'República cadastrada com sucesso!', 'success');
        cancelarEdicaoRepublica();
        await loadData();
    }

    btn.disabled = false;
}

async function handleCheckin(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-checkin');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Processando...';

    const id_funcionario = document.getElementById('checkin-funcionario').value;
    const val_local = document.getElementById('checkin-quarto').value;

    if (!id_funcionario || !val_local) {
        showToast('Selecione funcionário e local', 'warning');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    let id_quarto = null;
    let id_republica = null;
    let localObj = null;

    if (val_local.startsWith('q_')) {
        id_quarto = val_local.substring(2);
        localObj = quartos.find(q => q.id === id_quarto);
    }
    if (val_local.startsWith('r_')) {
        id_republica = val_local.substring(2);
        localObj = republicas.find(r => r.id === id_republica);
    }

    const func = funcionarios.find(f => f.id === id_funcionario);

    // Validar Status Ativo
    if (localObj && localObj.ativo === false) {
        showToast(`O local ${localObj.nome} está INATIVO (${localObj.motivo_inativo || 'Sem motivo informado'}).`, 'danger');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    // Validar Gênero
    if (func && localObj) {
        if (localObj.sexo_permitido !== 'A' && localObj.sexo_permitido !== func.sexo) {
            showToast(`Gênero incompatível! O local é exclusivo para o gênero ${localObj.sexo_permitido === 'M' ? 'Masculino' : 'Feminino'}.`, 'danger');
            btn.disabled = false;
            btn.innerHTML = originalText;
            return;
        }
    }

    // Validar Capacidade (Reforço)
    const alocacoesNoLocal = alocacoesAtivas.filter(a => id_quarto ? a.id_quarto === id_quarto : a.id_republica === id_republica);
    if (alocacoesNoLocal.length >= parseInt(localObj.capacidade)) {
        showToast('Este local já atingiu a capacidade máxima!', 'danger');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    const payload = { 
        id_funcionario, 
        data_checkin: new Date().toISOString(),
        valor_diaria_contratado: localObj.valor_diaria || 0
    };
    if (id_quarto) payload.id_quarto = id_quarto;
    if (id_republica) payload.id_republica = id_republica;
    if (currentCompanyId) payload.id_empresa = currentCompanyId;

    const { data, error } = await supabaseClient.from('alocacao').insert([payload]);

    if (error) {
        showToast('Erro ao realizar check-in: ' + error.message, 'danger');
    } else {
        showToast('Check-in realizado com sucesso!', 'success');
        document.getElementById('form-checkin').reset();
        await loadData();
        popularSelectsCheckin(); // refresh lists
        
        // Disparar WhatsApp (Opcional, com base no funcionário)
        const func = funcionarios.find(f => f.id === id_funcionario);
        let nomeLocal = "";
        let refLocal = "";
        if (id_quarto) {
            const quarto = quartos.find(q => q.id === id_quarto);
            if (quarto) { nomeLocal = "Alojamento " + quarto.nome; refLocal = "Bloco " + quarto.bloco; }
        } else if (id_republica) {
            const rep = republicas.find(r => r.id === id_republica);
            if (rep) { nomeLocal = "República " + rep.nome; refLocal = rep.endereco; }
        }

        if (func && func.telefone && confirm('Deseja enviar mensagem de aviso no WhatsApp do funcionário?')) {
            const textoMsg = encodeURIComponent(`Olá ${func.nome}, você foi alocado em: ${nomeLocal} (${refLocal}).`);
            const linkWa = `https://wa.me/${func.telefone.replace(/\D/g, '')}?text=${textoMsg}`;
            window.open(linkWa, '_blank');
        }
    }

    btn.disabled = false;
    btn.innerHTML = originalText;
}

async function handleCheckout(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-checkout');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Processando...';

    const id_alocacao = document.getElementById('checkout-alocacao').value;

    if (!id_alocacao) {
        showToast('Selecione uma alocação ativa', 'warning');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    const aloc = alocacoesAtivas.find(a => a.id === id_alocacao);
    let valor_diaria = 0;
    if (aloc.id_quarto) {
        const q = quartos.find(x => x.id === aloc.id_quarto);
        if (q) valor_diaria = parseFloat(q.valor_diaria || 0);
    } else if (aloc.id_republica) {
        const r = republicas.find(x => x.id === aloc.id_republica);
        if (r) valor_diaria = parseFloat(r.valor_diaria || 0);
    }

    const checkinDate = new Date(aloc.data_checkin);
    const now = new Date();
    const diffTime = Math.abs(now - checkinDate);
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const valor_total = diffDays * valor_diaria;

    const data_checkout = now.toISOString();

    const { data, error } = await supabaseClient
        .from('alocacao')
        .update({ data_checkout, valor_total })
        .eq('id', id_alocacao);

    if (error) {
        showToast('Erro ao realizar check-out: ' + error.message, 'danger');
    } else {
        showToast('Check-out realizado com sucesso!', 'success');
        document.getElementById('form-checkout').reset();
        document.getElementById('checkout-info-container').classList.add('d-none');
        await loadData();
        popularSelectsCheckout(); // refresh lists
    }
    
    btn.disabled = false;
    btn.innerHTML = originalText;
}

function atualizarInfoCheckout() {
    const id_alocacao = document.getElementById('checkout-alocacao').value;
    const container = document.getElementById('checkout-info-container');
    
    if (!id_alocacao) {
        container.classList.add('d-none');
        return;
    }

    const aloc = alocacoesAtivas.find(a => a.id === id_alocacao);
    if (!aloc) {
        container.classList.add('d-none');
        return;
    }

    let valor_diaria = 0;
    if (aloc.id_quarto) {
        const q = quartos.find(x => x.id === aloc.id_quarto);
        if (q) valor_diaria = parseFloat(q.valor_diaria || 0);
    } else if (aloc.id_republica) {
        const r = republicas.find(x => x.id === aloc.id_republica);
        if (r) valor_diaria = parseFloat(r.valor_diaria || 0);
    }

    const checkinDate = new Date(aloc.data_checkin);
    const now = new Date();
    const diffTime = Math.abs(now - checkinDate);
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const valor_total = diffDays * valor_diaria;

    document.getElementById('tab-co-dias-hospedados').textContent = `${diffDays} dia(s)`;
    document.getElementById('tab-co-valor-diaria').textContent = `R$ ${valor_diaria.toFixed(2)}`;
    document.getElementById('tab-co-valor-total').textContent = `R$ ${valor_total.toFixed(2)}`;
    
    container.classList.remove('d-none');
}

// Modais Rápidos no Mapa
window.abrirModalCheckinRapido = function(id_local, nome_local, tipo_local) {
    const local = (tipo_local === 'q') ? quartos.find(x => x.id === id_local) : republicas.find(x => x.id === id_local);
    if (local && local.ativo === false) {
        showToast('Este local está inativo e não pode receber novos check-ins.', 'warning');
        return;
    }

    document.getElementById('cr-quarto-id').value = id_local;
    document.getElementById('cr-tipo-local').value = tipo_local;
    document.getElementById('cr-quarto-nome').textContent = (tipo_local === 'q' ? "Alojamento " : "República ") + nome_local;
    
    const selectFunc = document.getElementById('cr-funcionario');
    selectFunc.innerHTML = '<option value="">Selecione um funcionário...</option>';
    
    let localObj = null;
    if (tipo_local === 'q') localObj = quartos.find(q => q.id === id_local);
    else localObj = republicas.find(r => r.id === id_local);

    const funcionariosLivres = funcionarios.filter(f => !alocacoesAtivas.some(a => a.id_funcionario === f.id));
    
    funcionariosLivres.forEach(f => {
        // Filtrar por gênero
        if (localObj && localObj.sexo_permitido !== 'A' && localObj.sexo_permitido !== f.sexo) {
            return; // pular incompatíveis
        }
        selectFunc.innerHTML += `<option value="${f.id}">${f.nome} (CPF: ${f.cpf || 'N/A'})</option>`;
    });

    const modal = new bootstrap.Modal(document.getElementById('modalCheckinRapido'));
    modal.show();
}

window.abrirModalCheckoutRapido = function(id_alocacao, nome_funcionario, id_local, tipo_local) {
    const aloc = alocacoesAtivas.find(a => a.id === id_alocacao);
    if(!aloc) return;
    document.getElementById('co-alocacao-id').value = id_alocacao;
    document.getElementById('co-funcionario-nome').textContent = nome_funcionario;
    
    let nome_local = "";
    let valor_diaria = 0;
    
    // Prioridade para a diária "congelada" no check-in
    if (aloc.valor_diaria_contratado !== undefined && aloc.valor_diaria_contratado !== null) {
        valor_diaria = parseFloat(aloc.valor_diaria_contratado);
    } else if (tipo_local === 'q') {
        const q = quartos.find(x => x.id === id_local);
        if(q) valor_diaria = parseFloat(q.valor_diaria || 0);
    } else {
        const r = republicas.find(x => x.id === id_local);
        if(r) valor_diaria = parseFloat(r.valor_diaria || 0);
    }
    
    document.getElementById('co-quarto-nome').textContent = nome_local;

    const checkinDate = new Date(aloc.data_checkin);
    const now = new Date();
    const diffTime = Math.abs(now - checkinDate);
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const valor_total = diffDays * valor_diaria;

    document.getElementById('co-dias-hospedados').textContent = `${diffDays} dia(s)`;
    document.getElementById('co-valor-diaria').textContent = `R$ ${valor_diaria.toFixed(2)}`;
    document.getElementById('co-valor-total').textContent = `R$ ${valor_total.toFixed(2)}`;
    document.getElementById('co-valor-total-input').value = valor_total;

    const modal = new bootstrap.Modal(document.getElementById('modalCheckoutRapido'));
    modal.show();
}

async function handleCheckinRapido(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-cr');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Processando...';

    const id_funcionario = document.getElementById('cr-funcionario').value;
    const id_local = document.getElementById('cr-quarto-id').value;
    const tipo_local = document.getElementById('cr-tipo-local').value;

    if (!id_funcionario || !id_local) {
        showToast('Selecione um funcionário', 'warning');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    let currentRate = 0;
    if (tipo_local === 'q') {
        const q = quartos.find(x => x.id === id_local);
        if(q) currentRate = q.valor_diaria || 0;
    } else {
        const r = republicas.find(x => x.id === id_local);
        if(r) currentRate = r.valor_diaria || 0;
    }

    const payload = { 
        id_funcionario, 
        data_checkin: new Date().toISOString(),
        valor_diaria_contratado: currentRate
    };
    if (tipo_local === 'q') payload.id_quarto = id_local;
    else payload.id_republica = id_local;
    if (currentCompanyId) payload.id_empresa = currentCompanyId;

    const { data, error } = await supabaseClient.from('alocacao').insert([payload]);

    if (error) {
        showToast('Erro ao realizar check-in rápido: ' + error.message, 'danger');
    } else {
        showToast('Check-in rápido realizado com sucesso!', 'success');
        document.getElementById('form-checkin-rapido').reset();
        
        // Hide modal
        const modalEl = document.getElementById('modalCheckinRapido');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Disparar WhatsApp (Opcional, com base no funcionário)
        const func = funcionarios.find(f => f.id === id_funcionario);
        let nomeLocal = "";
        let refLocal = "";
        if (tipo_local === 'q') {
            const quarto = quartos.find(q => q.id === id_local);
            if (quarto) { nomeLocal = "Alojamento " + quarto.nome; refLocal = "Bloco " + quarto.bloco; }
        } else {
            const rep = republicas.find(r => r.id === id_local);
            if (rep) { nomeLocal = "República " + rep.nome; refLocal = rep.endereco; }
        }

        if (func && func.telefone && confirm('Deseja enviar mensagem de aviso no WhatsApp do funcionário?')) {
            const textoMsg = encodeURIComponent(`Olá ${func.nome}, você foi alocado em: ${nomeLocal} (${refLocal}).`);
            const linkWa = `https://wa.me/${func.telefone.replace(/\D/g, '')}?text=${textoMsg}`;
            window.open(linkWa, '_blank');
        }

        await loadData();
    }

    btn.disabled = false;
    btn.innerHTML = originalText;
}

async function handleCheckoutRapido(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-co');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Processando...';

    const id_alocacao = document.getElementById('co-alocacao-id').value;

    if (!id_alocacao) {
        showToast('Alocação inválida', 'warning');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    const data_checkout = new Date().toISOString();
    const valor_total = document.getElementById('co-valor-total-input').value;

    const { data, error } = await supabaseClient
        .from('alocacao')
        .update({ data_checkout, valor_total })
        .eq('id', id_alocacao);

    if (error) {
        showToast('Erro ao realizar check-out rápido: ' + error.message, 'danger');
    } else {
        showToast('Check-out rápido realizado com sucesso!', 'success');
        
        // Hide modal
        const modalEl = document.getElementById('modalCheckoutRapido');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        await loadData();
    }
    
    btn.disabled = false;
    btn.innerHTML = originalText;
}

async function handleAlterarSenha(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-senha');
    const originalText = btn.innerHTML;
    
    const novaSenha = document.getElementById('nova-senha').value;
    const confirmaSenha = document.getElementById('confirma-senha').value;

    if (novaSenha !== confirmaSenha) {
        showToast('As senhas não coincidem', 'warning');
        return;
    }

    if (novaSenha.length < 6) {
        showToast('A senha deve ter no mínimo 6 caracteres', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Processando...';

    const { error } = await supabaseClient.auth.updateUser({ password: novaSenha });

    if (error) {
        showToast('Erro ao alterar senha: ' + error.message, 'danger');
    } else {
        showToast('Senha alterada com sucesso!', 'success');
        document.getElementById('form-alterar-senha').reset();
        
        // Esconder modal
        const modalEl = document.getElementById('modalAlterarSenha');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }

    btn.disabled = false;
    btn.innerHTML = originalText;
}

// Utilidade de Toast Bootstrap
function showToast(message, type = 'primary') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toast-message');
    
    // reset classes
    toastEl.className = 'toast align-items-center text-white border-0';
    if(type === 'success') toastEl.classList.add('bg-success');
    else if(type === 'danger') toastEl.classList.add('bg-danger');
    else if(type === 'warning') toastEl.classList.add('bg-warning');
    else toastEl.classList.add('bg-primary');
    
    toastBody.textContent = message;
    
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// Lógica de Edição e Cancelamento
window.editarQuarto = function(id) {
    const quarto = quartos.find(q => q.id === id);
    if(!quarto) return;
    
    document.getElementById('quarto-id').value = quarto.id;
    document.getElementById('quarto-nome').value = quarto.nome;
    document.getElementById('quarto-bloco').value = quarto.bloco;
    document.getElementById('quarto-modulo').value = quarto.modulo || '';
    document.getElementById('quarto-capacidade').value = quarto.capacidade;
    document.getElementById('quarto-diaria').value = quarto.valor_diaria || 0;
    document.getElementById('quarto-diaria-ociosa').value = quarto.valor_diaria_ociosa || 0;
    document.getElementById('quarto-sexo').value = quarto.sexo_permitido || 'A';
    document.getElementById('quarto-status').value = String(quarto.ativo !== false);
    document.getElementById('quarto-motivo').value = quarto.motivo_inativo || '';
    
    toggleMotivoQuarto();
    
    document.getElementById('btn-save-quarto').innerHTML = 'Salvar Alterações';
    document.getElementById('btn-cancel-quarto').classList.remove('d-none');
    window.scrollTo(0, 0);
}

window.toggleMotivoQuarto = function() {
    const status = document.getElementById('quarto-status').value;
    const div = document.getElementById('div-motivo-quarto');
    if (status === 'false') div.classList.remove('d-none');
    else div.classList.add('d-none');
}

window.cancelarEdicaoQuarto = function() {
    document.getElementById('quarto-id').value = '';
    document.getElementById('quarto-modulo').value = '';
    document.getElementById('quarto-diaria-ociosa').value = '0.00';
    document.getElementById('btn-save-quarto').innerHTML = 'Cadastrar Alojamento';
    document.getElementById('btn-cancel-quarto').classList.add('d-none');
}

window.editarFuncionario = function(id) {
    const func = funcionarios.find(f => f.id === id);
    if(!func) return;
    
    document.getElementById('func-id').value = func.id;
    document.getElementById('func-nome').value = func.nome;
    document.getElementById('func-cpf').value = func.cpf;
    document.getElementById('func-telefone').value = func.telefone;
    document.getElementById('func-sexo').value = func.sexo || 'M';
    
    // Setar módulo e função se existirem
    const mf = modulosFuncoes.find(m => m.id === func.id_modulo_funcao);
    if (mf) {
        document.getElementById('func-modulo').value = mf.modulo;
        filtrarFuncoesPorModuloFuncionario();
        document.getElementById('func-funcao').value = mf.id;
    } else {
        document.getElementById('func-modulo').value = '';
        document.getElementById('func-funcao').innerHTML = '<option value="">Selecione um módulo primeiro...</option>';
    }
    
    document.getElementById('btn-save-func').innerHTML = 'Salvar Alterações';
    document.getElementById('btn-cancel-func').classList.remove('d-none');
}

window.cancelarEdicaoFuncionario = function() {
    document.getElementById('form-funcionario').reset();
    document.getElementById('func-id').value = '';
    document.getElementById('func-modulo').value = '';
    document.getElementById('func-funcao').innerHTML = '<option value="">Selecione um módulo primeiro...</option>';
    document.getElementById('btn-save-func').innerHTML = 'Cadastrar Funcionário';
    document.getElementById('btn-cancel-func').classList.add('d-none');
}

window.editarRepublica = function(id) {
    const rep = republicas.find(r => r.id === id);
    if(!rep) return;
    
    document.getElementById('republica-id').value = rep.id;
    document.getElementById('republica-nome').value = rep.nome;
    document.getElementById('republica-quarto').value = rep.quarto || '';
    document.getElementById('republica-bloco').value = rep.bloco;
    document.getElementById('republica-modulo').value = rep.modulo || '';
    document.getElementById('republica-capacidade').value = rep.capacidade;
    document.getElementById('republica-diaria').value = rep.valor_diaria || 0;
    document.getElementById('republica-diaria-ociosa').value = rep.valor_diaria_ociosa || 0;
    document.getElementById('republica-endereco').value = rep.endereco;
    document.getElementById('republica-sexo').value = rep.sexo_permitido || 'A';
    document.getElementById('republica-status').value = String(rep.ativo !== false);
    document.getElementById('republica-motivo').value = rep.motivo_inativo || '';
    
    toggleMotivoRepublica();
    
    document.getElementById('btn-save-republica').innerHTML = 'Salvar Alterações';
    document.getElementById('btn-cancel-republica').classList.remove('d-none');
    window.scrollTo(0, 0);
}

window.toggleMotivoRepublica = function() {
    const status = document.getElementById('republica-status').value;
    const div = document.getElementById('div-motivo-republica');
    if (status === 'false') div.classList.remove('d-none');
    else div.classList.add('d-none');
}

window.cancelarEdicaoRepublica = function() {
    document.getElementById('republica-id').value = '';
    document.getElementById('republica-modulo').value = '';
    document.getElementById('republica-diaria-ociosa').value = '0.00';
    document.getElementById('btn-save-republica').innerHTML = 'Cadastrar República';
    document.getElementById('btn-cancel-republica').classList.add('d-none');
}

// === ADMIN: EMPRESAS ===
window.handleSearchEmpresas = function() {
    searchEmpresas = document.getElementById('search-empresas').value.toLowerCase();
    renderizarListaEmpresas();
}

async function handleNovoEmpresa(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-empresa');
    btn.disabled = true;
    btn.innerHTML = 'Salvando...';

    const id = document.getElementById('empresa-id').value;
    const nome = document.getElementById('empresa-nome').value;
    const data_expiracao = document.getElementById('empresa-expiracao').value || null;
    const ativo = document.getElementById('empresa-ativo').checked;

    const payload = { nome, ativo, data_expiracao };

    let error;
    if (id) {
        const { error: updateError } = await supabaseClient.from('empresa').update(payload).eq('id', id);
        error = updateError;
    } else {
        const { error: insertError } = await supabaseClient.from('empresa').insert([payload]);
        error = insertError;
    }

    if (error) {
        showToast('Erro ao salvar empresa: ' + error.message, 'danger');
    } else {
        showToast(id ? 'Empresa atualizada!' : 'Empresa cadastrada!', 'success');
        cancelarEdicaoEmpresa();
        await loadData(); // Isso agora chamará atualizarDashboard e renderizarListaEmpresas
    }
    btn.disabled = false;
}

function renderizarListaEmpresas() {
    const tbody = document.getElementById('lista-empresas-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const filtered = empresas.filter(e => e.nome.toLowerCase().includes(searchEmpresas));

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">Nenhuma empresa encontrada.</td></tr>';
        return;
    }

    filtered.forEach(e => {
        const dataCriacao = new Date(e.created_at).toLocaleDateString('pt-BR');
        const dataExp = e.data_expiracao ? new Date(e.data_expiracao).toLocaleDateString('pt-BR') : '<span class="text-muted small">Vitalícia</span>';
        
        tbody.innerHTML += `
            <tr>
                <td class="fw-medium">${e.nome}</td>
                <td><span class="badge ${e.ativo ? 'bg-success' : 'bg-secondary'} bg-opacity-10 ${e.ativo ? 'text-success' : 'text-secondary'}">${e.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td>${dataExp}</td>
                <td>${dataCriacao}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light text-primary" onclick="editarEmpresa('${e.id}')"><i class="bi bi-pencil"></i></button>
                </td>
            </tr>
        `;
    });
}

window.editarEmpresa = function(id) {
    const emp = empresas.find(e => e.id === id);
    if(!emp) return;
    document.getElementById('empresa-id').value = emp.id;
    document.getElementById('empresa-nome').value = emp.nome;
    document.getElementById('empresa-expiracao').value = emp.data_expiracao || '';
    document.getElementById('empresa-ativo').checked = emp.ativo !== false;
    document.getElementById('btn-save-empresa').innerHTML = 'Salvar Alterações';
    document.getElementById('btn-cancel-empresa').classList.remove('d-none');
}

window.cancelarEdicaoEmpresa = function() {
    document.getElementById('form-empresa').reset();
    document.getElementById('empresa-id').value = '';
    document.getElementById('empresa-expiracao').value = '';
    document.getElementById('empresa-ativo').checked = true;
    document.getElementById('btn-save-empresa').innerHTML = 'Cadastrar Empresa';
    document.getElementById('btn-cancel-empresa').classList.add('d-none');
}

// === ADMIN: USUÁRIOS ===
window.handleSearchUsuarios = function() {
    searchUsuarios = document.getElementById('search-usuarios').value.toLowerCase();
    renderizarListaUsuarios();
}

window.handleSearchModulos = function() {
    searchModulos = document.getElementById('search-modulos').value.toLowerCase();
    currentPageModulos = 1;
    renderizarListaModulos();
}

window.changePageModulos = function(page) {
    currentPageModulos = page;
    renderizarListaModulos();
}

function popularSelectEmpresaUsuario() {
    const select = document.getElementById('usuario-empresa');
    if(!select) return;
    const valorAtual = select.value;
    select.innerHTML = '<option value="">Selecione uma empresa...</option>';
    empresas.forEach(e => {
        select.innerHTML += `<option value="${e.id}">${e.nome}</option>`;
    });
    select.value = valorAtual;
}

async function handleNovoUsuario(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-usuario');
    btn.disabled = true;
    btn.innerHTML = 'Salvando...';

    const id = document.getElementById('usuario-id').value;
    const nome = document.getElementById('usuario-nome').value;
    const email = document.getElementById('usuario-email').value;
    const id_empresa = document.getElementById('usuario-empresa').value;
    const perfil = document.getElementById('usuario-perfil').value;
    const ativo = document.getElementById('usuario-ativo').checked;

    const payload = { nome, email, id_empresa, perfil, ativo };

    let error;
    if (id) {
        const { error: updateError } = await supabaseClient.from('usuario').update(payload).eq('id', id);
        error = updateError;
    } else {
        // Nota: Isso apenas insere na tabela 'usuario'. 
        // O usuário precisará ser criado no Auth do Supabase separadamente ou via Trigger.
        const { error: insertError } = await supabaseClient.from('usuario').insert([payload]);
        error = insertError;
    }

    if (error) {
        showToast('Erro ao salvar usuário: ' + error.message, 'danger');
    } else {
        showToast(id ? 'Usuário atualizado!' : 'Usuário cadastrado!', 'success');
        cancelarEdicaoUsuario();
        await loadData(); // Isso agora chamará atualizarDashboard e renderizarListaUsuarios
    }
    btn.disabled = false;
}

function renderizarListaUsuarios() {
    const tbody = document.getElementById('lista-usuarios-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const filtered = todosUsuarios.filter(u => 
        u.nome.toLowerCase().includes(searchUsuarios) || 
        u.email.toLowerCase().includes(searchUsuarios)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhum usuário encontrado.</td></tr>';
        return;
    }

    filtered.forEach(u => {
        const emp = empresas.find(e => e.id === u.id_empresa);
        
        tbody.innerHTML += `
            <tr>
                <td class="fw-medium">${u.nome}</td>
                <td>${u.email}</td>
                <td>${emp ? emp.nome : '<span class="text-danger">Sem empresa</span>'}</td>
                <td><span class="badge ${u.perfil === 'admin' ? 'bg-danger' : 'bg-primary'} bg-opacity-10 ${u.perfil === 'admin' ? 'text-danger' : 'text-primary'}">${u.perfil}</span></td>
                <td><span class="badge ${u.ativo ? 'bg-success' : 'bg-secondary'} bg-opacity-10 ${u.ativo ? 'text-success' : 'text-secondary'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light text-primary" onclick="editarUsuario('${u.id}')"><i class="bi bi-pencil"></i></button>
                </td>
            </tr>
        `;
    });
}

window.editarUsuario = function(id) {
    const user = todosUsuarios.find(u => u.id === id);
    if(!user) return;
    document.getElementById('usuario-id').value = user.id;
    document.getElementById('usuario-nome').value = user.nome;
    document.getElementById('usuario-email').value = user.email;
    document.getElementById('usuario-empresa').value = user.id_empresa || '';
    document.getElementById('usuario-perfil').value = user.perfil || 'user';
    document.getElementById('usuario-ativo').checked = user.ativo !== false;
    
    document.getElementById('btn-save-usuario').innerHTML = 'Salvar Alterações';
    document.getElementById('btn-cancel-usuario').classList.remove('d-none');
}

window.cancelarEdicaoUsuario = function() {
    document.getElementById('form-usuario-admin').reset();
    document.getElementById('usuario-id').value = '';
    document.getElementById('usuario-ativo').checked = true;
    document.getElementById('btn-save-usuario').innerHTML = 'Cadastrar Usuário';
    document.getElementById('btn-cancel-usuario').classList.add('d-none');
}

// === ADMIN: MÓDULOS E FUNÇÕES ===
async function handleNovoModuloFuncao(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-mf');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Salvando...';

    const id = document.getElementById('mf-id').value;
    const modulo = document.getElementById('mf-modulo').value.toUpperCase();
    const funcao = document.getElementById('mf-funcao').value.toUpperCase();

    const payload = { modulo, funcao };

    let error;
    if (id) {
        const { error: updateError } = await supabaseClient.from('modulo_funcao').update(payload).eq('id', id);
        error = updateError;
    } else {
        const { error: insertError } = await supabaseClient.from('modulo_funcao').insert([payload]);
        error = insertError;
    }

    if (error) {
        showToast('Erro ao salvar: ' + error.message, 'danger');
    } else {
        showToast('Sucesso!', 'success');
        cancelarEdicaoMF();
        await loadData();
    }
    btn.disabled = false;
    btn.innerHTML = originalText;
}

function renderizarListaModulos() {
    const tbody = document.getElementById('lista-modulos-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const filtered = modulosFuncoes.filter(mf => 
        mf.modulo.toLowerCase().includes(searchModulos) || 
        mf.funcao.toLowerCase().includes(searchModulos)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">Nenhum registro encontrado.</td></tr>';
        document.getElementById('pagination-modulos').innerHTML = '';
        return;
    }

    // Paginar
    const start = (currentPageModulos - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    paginated.forEach(mf => {
        tbody.innerHTML += `
            <tr>
                <td><span class="badge bg-light text-dark border">${mf.modulo}</span></td>
                <td>${mf.funcao}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-light text-primary me-1" onclick="editarMF('${mf.id}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-light text-danger" onclick="excluirMF('${mf.id}')"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
    });

    renderPagination(filtered.length, currentPageModulos, 'pagination-modulos', 'changePageModulos');
}

window.editarMF = function(id) {
    const mf = modulosFuncoes.find(m => m.id === id);
    if(!mf) return;
    document.getElementById('mf-id').value = mf.id;
    document.getElementById('mf-modulo').value = mf.modulo;
    document.getElementById('mf-funcao').value = mf.funcao;
    document.getElementById('btn-save-mf').innerHTML = 'Salvar Alterações';
    document.getElementById('btn-cancel-mf').classList.remove('d-none');
}

window.cancelarEdicaoMF = function() {
    document.getElementById('form-modulo-funcao').reset();
    document.getElementById('mf-id').value = '';
    document.getElementById('btn-save-mf').innerHTML = 'Cadastrar';
    document.getElementById('btn-cancel-mf').classList.add('d-none');
}

async function excluirMF(id) {
    // Blindagem: Verificar se algum funcionário usa este módulo/função
    const emUso = funcionarios.some(f => f.id_modulo_funcao === id);
    if (emUso) {
        showToast('Não é possível excluir: existem funcionários vinculados a este Módulo/Função.', 'warning');
        return;
    }

    if(!confirm('Tem certeza que deseja excluir este registro?')) return;
    const { error } = await supabaseClient.from('modulo_funcao').delete().eq('id', id);
    if (error) showToast('Erro ao excluir: ' + error.message, 'danger');
    else {
        showToast('Excluído com sucesso!', 'success');
        await loadData();
    }
}

function popularSelectsModulosFuncoes() {
    const selectModulo = document.getElementById('func-modulo');
    if(!selectModulo) return;

    const modulosUnicos = [...new Set(modulosFuncoes.map(mf => mf.modulo))].sort();
    
    const valorAtual = selectModulo.value;
    selectModulo.innerHTML = '<option value="">Selecione...</option>';
    modulosUnicos.forEach(m => {
        selectModulo.innerHTML += `<option value="${m}">${m}</option>`;
    });
    selectModulo.value = valorAtual;
}

window.filtrarFuncoesPorModuloFuncionario = function() {
    const moduloSel = document.getElementById('func-modulo').value;
    const selectFuncao = document.getElementById('func-funcao');
    
    if(!moduloSel) {
        selectFuncao.innerHTML = '<option value="">Selecione um módulo primeiro...</option>';
        return;
    }

    const funcoesDoModulo = modulosFuncoes.filter(mf => mf.modulo === moduloSel).sort((a, b) => a.funcao.localeCompare(b.funcao));
    
    selectFuncao.innerHTML = '<option value="">Selecione a função...</option>';
    funcoesDoModulo.forEach(mf => {
        selectFuncao.innerHTML += `<option value="${mf.id}">${mf.funcao}</option>`;
    });
}

window.executarCargaInicialModulos = function() {
    document.getElementById('input-carga-txt').click();
}

window.processarArquivoCarga = async function(input) {
    const file = input.files[0];
    if (!file) return;

    if(!confirm(`Deseja iniciar a carga a partir do arquivo "${file.name}"?`)) {
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target.result;
            const lines = text.split('\n');
            
            const registros = [];
            lines.forEach(line => {
                if(!line.trim()) return;
                // O arquivo usa tabulação ou espaços múltiplos
                const parts = line.split(/\t/);
                if(parts.length >= 2) {
                    registros.push({
                        modulo: parts[0].trim().toUpperCase(),
                        funcao: parts[1].trim().toUpperCase()
                    });
                }
            });

            if(registros.length === 0) {
                showToast('Nenhum registro válido encontrado no arquivo.', 'warning');
                return;
            }

            showToast(`Processando ${registros.length} registros...`, 'info');

            // Inserir em blocos de 50 para não sobrecarregar
            const chunkSize = 50;
            let sucessos = 0;
            
            for (let i = 0; i < registros.length; i += chunkSize) {
                const chunk = registros.slice(i, i + chunkSize);
                const { error } = await supabaseClient.from('modulo_funcao').insert(chunk);
                if(!error) sucessos += chunk.length;
                else console.error('Erro no bloco:', error);
            }

            showToast(`Carga finalizada! ${sucessos} registros importados.`, 'success');
            input.value = ''; // Limpar input
            await loadData();
            
        } catch (error) {
            showToast('Erro ao processar arquivo: ' + error.message, 'danger');
            console.error(error);
        }
    };
    
    reader.readAsText(file);
}

// === RELATÓRIO DE OCUPAÇÃO ===
function popularSelectsModulosLocais() {
    const sQuarto = document.getElementById('quarto-modulo');
    const sRep = document.getElementById('republica-modulo');
    
    if(!sQuarto && !sRep) return;

    const modulosUnicos = [...new Set(modulosFuncoes.map(mf => mf.modulo))].sort();
    const options = '<option value="">Selecione...</option>' + modulosUnicos.map(m => `<option value="${m}">${m}</option>`).join('');
    
    if(sQuarto) {
        const v = sQuarto.value;
        sQuarto.innerHTML = options;
        sQuarto.value = v;
    }
    if(sRep) {
        const v = sRep.value;
        sRep.innerHTML = options;
        sRep.value = v;
    }
}

function renderizarRelatorioOcupacao() {
    const tbody = document.getElementById('lista-ocupacao-tbody');
    const tfoot = document.getElementById('lista-ocupacao-tfoot');
    if(!tbody) return;

    tbody.innerHTML = '';
    
    // Unificar quartos e repúblicas ativos
    const locais = [
        ...quartos.filter(q => q.ativo !== false).map(q => ({...q, tipo: 'Alojamento', id_unificado: 'q_'+q.id})),
        ...republicas.filter(r => r.ativo !== false).map(r => ({...r, tipo: 'República', id_unificado: 'r_'+r.id}))
    ].sort((a, b) => (a.modulo || '').localeCompare(b.modulo || '') || (a.bloco || '').localeCompare(b.bloco || ''));

    if(locais.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4">Nenhum local ativo encontrado.</td></tr>';
        document.getElementById('pagination-ocupacao').innerHTML = '';
        return;
    }

    let totVagas = 0, totOcup = 0, totOcio = 0, totValOcup = 0, totValOcio = 0;

    // Calcular Totais Gerais (Sempre sobre o set completo)
    locais.forEach(loc => {
        const isQuarto = loc.tipo === 'Alojamento';
        const alocs = alocacoesAtivas.filter(a => isQuarto ? a.id_quarto === loc.id : a.id_republica === loc.id);
        const ocupadas = alocs.length;
        const ociosas = Math.max(0, loc.capacidade - ocupadas);
        totVagas += loc.capacidade;
        totOcup += ocupadas;
        totOcio += ociosas;
        totValOcup += ocupadas * (loc.valor_diaria || 0);
        totValOcio += ociosas * (loc.valor_diaria_ociosa || 0);
    });

    // Paginar
    const start = (currentPageOcupacao - 1) * itemsPerPage;
    const paginated = locais.slice(start, start + itemsPerPage);

    paginated.forEach(loc => {
        const isQuarto = loc.tipo === 'Alojamento';
        const alocs = alocacoesAtivas.filter(a => isQuarto ? a.id_quarto === loc.id : a.id_republica === loc.id);
        
        const ocupadas = alocs.length;
        const ociosas = Math.max(0, loc.capacidade - ocupadas);
        const taxa = loc.capacidade > 0 ? (ocupadas / loc.capacidade * 100).toFixed(1) : 0;
        
        const vOcup = ocupadas * (loc.valor_diaria || 0);
        const vOcio = ociosas * (loc.valor_diaria_ociosa || 0);
        const vTotal = vOcup + vOcio;

        tbody.innerHTML += `
            <tr>
                <td><span class="badge bg-light text-dark border">${loc.modulo || 'N/A'}</span></td>
                <td>
                    <div class="fw-medium">${loc.nome}</div>
                    <small class="text-muted">${loc.tipo} - ${loc.bloco || '-'}</small>
                </td>
                <td class="text-center">${loc.capacidade}</td>
                <td class="text-center text-primary fw-bold">${ocupadas}</td>
                <td class="text-center text-warning">${ociosas}</td>
                <td class="text-center">
                    <div class="progress" style="height: 6px; width: 60px; margin: 0 auto;">
                        <div class="progress-bar ${taxa > 80 ? 'bg-danger' : 'bg-success'}" role="progressbar" style="width: ${taxa}%"></div>
                    </div>
                    <small>${taxa}%</small>
                </td>
                <td class="text-center small">
                    <span class="text-success">${parseFloat(loc.valor_diaria||0).toFixed(2)}</span> / 
                    <span class="text-muted">${parseFloat(loc.valor_diaria_ociosa||0).toFixed(2)}</span>
                </td>
                <td class="text-end text-success">R$ ${vOcup.toFixed(2)}</td>
                <td class="text-end text-muted">R$ ${vOcio.toFixed(2)}</td>
                <td class="text-end fw-bold">R$ ${vTotal.toFixed(2)}</td>
            </tr>
        `;
    });

    tfoot.innerHTML = `
        <tr>
            <td colspan="2" class="text-end">TOTAIS GERAIS:</td>
            <td class="text-center">${totVagas}</td>
            <td class="text-center">${totOcup}</td>
            <td class="text-center">${totOcio}</td>
            <td class="text-center">${(totOcup/totVagas*100).toFixed(1)}%</td>
            <td></td>
            <td class="text-end text-success">R$ ${totValOcup.toFixed(2)}</td>
            <td class="text-end text-muted">R$ ${totValOcio.toFixed(2)}</td>
            <td class="text-end text-primary fs-5">R$ ${(totValOcup + totValOcio).toFixed(2)}</td>
        </tr>
    `;

    renderPagination(locais.length, currentPageOcupacao, 'pagination-ocupacao', 'changePageOcupacao');
}

window.changePageOcupacao = function(page) {
    currentPageOcupacao = page;
    renderizarRelatorioOcupacao();
}

window.exportarRelatorioOcupacaoExcel = function() {
    const locais = [
        ...quartos.filter(q => q.ativo !== false).map(q => ({...q, tipo: 'Alojamento'})),
        ...republicas.filter(r => r.ativo !== false).map(r => ({...r, tipo: 'República'}))
    ];

    const data = locais.map(loc => {
        const isQuarto = loc.tipo === 'Alojamento';
        const alocs = alocacoesAtivas.filter(a => isQuarto ? a.id_quarto === loc.id : a.id_republica === loc.id);
        const ocupadas = alocs.length;
        const ociosas = Math.max(0, loc.capacidade - ocupadas);
        const vOcup = ocupadas * (loc.valor_diaria || 0);
        const vOcio = ociosas * (loc.valor_diaria_ociosa || 0);

        return {
            'Módulo': loc.modulo || 'N/A',
            'Tipo': loc.tipo,
            'Local': loc.nome,
            'Bloco/Ref': loc.bloco || '-',
            'Total Vagas': loc.capacidade,
            'Ocupadas': ocupadas,
            'Ociosas': ociosas,
            'Taxa Ocup. (%)': loc.capacidade > 0 ? (ocupadas / loc.capacidade * 100).toFixed(1) : 0,
            'Diária Ocupada': loc.valor_diaria,
            'Diária Ociosa': loc.valor_diaria_ociosa,
            'Total Ocupado (R$)': vOcup,
            'Total Ocioso (R$)': vOcio,
            'Resumo Total (R$)': vOcup + vOcio
        };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ocupação");
    XLSX.writeFile(wb, `Relatorio_Ocupacao_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Relatório exportado!', 'success');
}

