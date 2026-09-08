const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Normalizar CRLF para LF temporariamente para match consistente
const isCRLF = html.includes('\r\n');
let normalized = html.replace(/\r\n/g, '\n');

// 1. #escolas-panel
const p1_before = /(<div id="schools-overview-container">[\s\S]*?)<div class="schools-header-row">[\s\S]*?<\/div>(\s*<!-- 3 KPI Summary Cards -->)/;
if (p1_before.test(normalized)) {
    normalized = normalized.replace(p1_before, `$1<div class="tab-hero-banner">
                            <div class="tab-hero-content">
                                <div>
                                    <div class="tab-hero-tag">
                                        <i data-lucide="building-2" style="width: 14px; height: 14px;"></i>
                                        <span>Rede Municipal Oficial • Gonçalves Dias - MA</span>
                                    </div>
                                    <h2 class="tab-hero-title">Escolas da Rede Municipal de Ensino</h2>
                                    <p class="tab-hero-subtitle">Gestão institucional, infraestrutura e monitoramento pedagógico das 9 unidades escolares municipais.</p>
                                </div>
                                <div class="tab-hero-actions">
                                    <button class="btn-hero-white" id="btn-export-schools-list" onclick="if(window.exportSchoolsList) window.exportSchoolsList();">
                                        <i data-lucide="file-spreadsheet" style="width:16px; height:16px;"></i> Exportar Lista
                                    </button>
                                    <button class="btn-hero-outline" id="btn-refresh-schools-list" onclick="if(window.refreshSchoolsList) window.refreshSchoolsList();" title="Recarregar Escolas">
                                        <i data-lucide="rotate-cw" style="width:16px; height:16px;"></i> Atualizar
                                    </button>
                                </div>
                            </div>
                        </div>$2`);
    console.log('[OK] 1. Escolas Panel padronizado');
} else {
    console.error('[ERRO] 1. Escolas Panel regex não casou');
}

// 2. #alunos-panel
const p2_before = /(<section id="alunos-panel"[^>]*>)\s*<div class="card card-full margin-bottom-lg">\s*<div class="card-header flex-between flex-wrap gap-md">[\s\S]*?<\/button>\s*<\/div>\s*<div class="card-header border-top flex-between flex-wrap gap-md"/;
if (p2_before.test(normalized)) {
    normalized = normalized.replace(p2_before, `$1
                    <div class="tab-hero-banner">
                        <div class="tab-hero-content">
                            <div>
                                <div class="tab-hero-tag">
                                    <i data-lucide="users" style="width: 14px; height: 14px;"></i>
                                    <span>Censo Escolar & Matrículas Ativas</span>
                                </div>
                                <h2 class="tab-hero-title">Ficha Cadastral dos Alunos & Turmas</h2>
                                <p class="tab-hero-subtitle">Consulte, pesquise e gerencie os dados cadastrais e histórico de proficiência dos estudantes avaliados na rede municipal.</p>
                            </div>
                            <div class="tab-hero-actions">
                                <button class="btn-hero-white" id="btn-open-create-student-modal" onclick="openCreateStudentModal(); return false;">
                                    <i data-lucide="user-plus" style="width:16px; height:16px;"></i> + Novo Aluno
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="card card-full margin-bottom-lg">
                        <div class="card-header flex-between flex-wrap gap-md" style="background-color: var(--bg-tertiary); padding: 16px 24px; border-radius: var(--radius-card);"`);
    console.log('[OK] 2. Alunos Panel padronizado');
} else {
    console.error('[ERRO] 2. Alunos Panel regex não casou');
}

// 3. #metas-ideb
const p3_before = /(<section id="metas-ideb"[^>]*>)\s*<div class="card card-full margin-bottom-lg"[^>]*>\s*<div class="card-header flex-between flex-wrap gap-md"[\s\S]*?<\/div>\s*<\/div>\s*<div class="card-body" style="padding: 20px;">/;
if (p3_before.test(normalized)) {
    normalized = normalized.replace(p3_before, `$1
                    <div class="tab-hero-banner">
                        <div class="tab-hero-content">
                            <div>
                                <div class="tab-hero-tag">
                                    <i data-lucide="target" style="width: 14px; height: 14px;"></i>
                                    <span>Planos de Desenvolvimento Escolar (PDE)</span>
                                </div>
                                <h2 class="tab-hero-title">Metas Municipais & Planos de Intervenção PDE</h2>
                                <p class="tab-hero-subtitle">Mapeamento de metas pactuadas por escola, diagnóstico de defasagem (GAP) e execução estratégica de intervenções pedagógicas.</p>
                            </div>
                            <div class="tab-hero-actions">
                                <button class="btn-hero-white" id="btn-generate-all-pde-plans" onclick="handleAutoGenerateAllPdePlans()">
                                    <i data-lucide="sparkles" style="width: 16px; height: 16px;"></i> Gerar Planos (Escolas com Gap)
                                </button>
                                <button class="btn-hero-outline" id="btn-export-pde-report" onclick="handleExportPdeReportPdf()">
                                    <i data-lucide="download" style="width: 16px; height: 16px;"></i> Exportar Relatório PDE
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="card card-full margin-bottom-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-color);">
                        <div class="card-body" style="padding: 20px;">`);
    console.log('[OK] 3. Metas IDEB padronizado');
} else {
    console.error('[ERRO] 3. Metas IDEB regex não casou');
}

// 4. #ideb-comparativo
const p4_before = /(<section id="ideb-comparativo"[^>]*>[\s\S]*?)<div class="card margin-bottom-lg"\s+style="background:\s*linear-gradient\(135deg,\s*#1A2D42[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>/;
if (p4_before.test(normalized)) {
    normalized = normalized.replace(p4_before, `$1<div class="tab-hero-banner">
                        <div class="tab-hero-content">
                            <div>
                                <div id="ideb-period-badge" class="tab-hero-tag">
                                    <i data-lucide="award" style="width: 14px; height: 14px;"></i>
                                    <span id="ideb-period-badge-text">Dados Oficiais INEP • Ciclos 2015 a 2025</span>
                                </div>
                                <h2 class="tab-hero-title">
                                    Comparativo Regional do IDEB — Gonçalves Dias (MA)
                                </h2>
                                <p class="tab-hero-subtitle">
                                    Acompanhamento estratégico dos resultados e evolução histórica do IDEB no município, nas <strong>19 UREs do Maranhão</strong>, no <strong>Ranking Estadual (217 Municípios)</strong> e nas <strong>4.798 Escolas</strong>.
                                </p>
                            </div>
                            <div class="tab-hero-actions">
                                <button class="btn-hero-white" id="btn-export-ideb-regional-pdf" onclick="window.print();">
                                    <i data-lucide="printer" style="width: 15px; height: 15px;"></i>
                                    <span>Exportar Relatório Regional</span>
                                </button>
                            </div>
                        </div>
                    </div>`);
    console.log('[OK] 4. Comparativo Regional padronizado');
} else {
    console.error('[ERRO] 4. Comparativo Regional regex não casou');
}

// 5. #calculo-ideb
const p5_before = /(<section id="calculo-ideb"[^>]*>[\s\S]*?)<div class="card margin-bottom-lg"\s+style="background:\s*linear-gradient\(135deg,\s*#0A1931[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>/;
if (p5_before.test(normalized)) {
    normalized = normalized.replace(p5_before, `$1<div class="tab-hero-banner">
                        <div class="tab-hero-content">
                            <div>
                                <div class="tab-hero-tag">
                                    <i data-lucide="book-open" style="width: 14px; height: 14px;"></i>
                                    <span>Notas Técnicas INEP/MEC: NT Conjunta 23/2023 • NT 7/2024 • Fernandes (2007)</span>
                                </div>
                                <h2 class="tab-hero-title">
                                    Como se Calcula o IDEB & Indicadores VAAR / FUNDEB
                                </h2>
                                <p class="tab-hero-subtitle">
                                    Guia metodológico oficial de cálculo do IDEB clássico e dos novos indicadores de aprendizagem, fluxo e equidade para fins do FUNDEB (Lei nº 14.113/2020), com simulador interativo em tempo real.
                                </p>
                            </div>
                            <div class="tab-hero-actions">
                                <button class="btn-hero-white" id="btn-export-calculo-ideb-pdf" onclick="window.print();">
                                    <i data-lucide="printer" style="width: 15px; height: 15px;"></i>
                                    <span>Exportar Manual / Relatório</span>
                                </button>
                            </div>
                        </div>
                    </div>`);
    console.log('[OK] 5. Calculo IDEB padronizado');
} else {
    console.error('[ERRO] 5. Calculo IDEB regex não casou');
}

// 6. #matriz-descritores
const p6_before = /(<section id="matriz-descritores"[^>]*>)\s*<div class="card card-full margin-bottom-lg" style="background: var\(--bg-secondary\); border: 1px solid var\(--border-color\);">\s*<div class="card-header flex-between flex-wrap gap-md"[\s\S]*?<\/div>\s*<\/div>/;
if (p6_before.test(normalized)) {
    normalized = normalized.replace(p6_before, `$1
                    <div class="tab-hero-banner">
                        <div class="tab-hero-content">
                            <div>
                                <div class="tab-hero-tag">
                                    <i data-lucide="book-open" style="width: 14px; height: 14px;"></i>
                                    <span>Matrizes de Referência & BNCC Oficial</span>
                                </div>
                                <h2 class="tab-hero-title">Matrizes de Referência SAEB, SEAMA & BNCC</h2>
                                <p class="tab-hero-subtitle">Navegação estruturada por descritores cognitivos de avaliações externas e catálogo completo de habilidades da BNCC por componente curricular.</p>
                            </div>
                        </div>
                    </div>

                    <div class="card card-full margin-bottom-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-card); overflow: hidden;">`);
    console.log('[OK] 6. Matriz Descritores padronizado');
} else {
    console.error('[ERRO] 6. Matriz Descritores regex não casou');
}

// 7. #sec-criar-avaliacoes
const p7_before = /(<section id="sec-criar-avaliacoes"[^>]*>)\s*<!-- Top Sub-Navigation for Avaliações Module -->\s*<div class="card card-full margin-bottom-md"/;
if (p7_before.test(normalized)) {
    normalized = normalized.replace(p7_before, `$1
                    <div class="tab-hero-banner">
                        <div class="tab-hero-content">
                            <div>
                                <div class="tab-hero-tag">
                                    <i data-lucide="file-check" style="width: 14px; height: 14px;"></i>
                                    <span>Gestão de Avaliações & Simulados Municipais</span>
                                </div>
                                <h2 class="tab-hero-title">Avaliações, Simulados & Instrumentos Diagnósticos</h2>
                                <p class="tab-hero-subtitle">Criação de simulados padronizados SAEB/SEAMA, lançamento de cartões-resposta e acompanhamento de proficiência em tempo real.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Top Sub-Navigation for Avaliações Module -->
                    <div class="card card-full margin-bottom-md"`);
    console.log('[OK] 7. Criar Avaliacoes padronizado');
} else {
    console.error('[ERRO] 7. Criar Avaliacoes regex não casou');
}

// 8. #sec-aplicacao-provas
const p8_before = /(<section id="sec-aplicacao-provas"[^>]*>)\s*<div class="card card-full margin-bottom-lg">\s*<div class="card-header">[\s\S]*?<\/div>\s*<div class="card-body">/;
if (p8_before.test(normalized)) {
    normalized = normalized.replace(p8_before, `$1
                    <div class="tab-hero-banner">
                        <div class="tab-hero-content">
                            <div>
                                <div class="tab-hero-tag">
                                    <i data-lucide="activity" style="width: 14px; height: 14px;"></i>
                                    <span>Operação & Monitoramento em Tempo Real</span>
                                </div>
                                <h2 class="tab-hero-title">Painel de Acompanhamento de Aplicação</h2>
                                <p class="tab-hero-subtitle">Monitore a digitação de cartões-resposta, taxa de presença dos alunos e consolidação de proficiência em cada unidade escolar.</p>
                            </div>
                        </div>
                    </div>

                    <div class="card card-full margin-bottom-lg">
                        <div class="card-body">`);
    console.log('[OK] 8. Aplicacao Provas padronizado');
} else {
    console.error('[ERRO] 8. Aplicacao Provas regex não casou');
}

// 9. #cronograma-habilidades
const p9_before = /(<section id="cronograma-habilidades"[^>]*>)\s*<div class="card card-full margin-bottom-lg" style="background: var\(--bg-secondary\); border: 1px solid var\(--border-color\); border-radius: var\(--radius-lg\); padding: 0; overflow: hidden;">\s*<!-- Top Header com Título, Segmented Control[\s\S]*?<\/div>\s*<\/div>/;
if (p9_before.test(normalized)) {
    normalized = normalized.replace(p9_before, `$1
                    <div class="tab-hero-banner">
                        <div class="tab-hero-content">
                            <div>
                                <div class="tab-hero-tag">
                                    <i data-lucide="calendar-check" style="width: 14px; height: 14px;"></i>
                                    <span>Rotinas por Turma & Agenda Pedagógica</span>
                                </div>
                                <h2 class="tab-hero-title">Cronograma & Planejamento Escolar</h2>
                                <p class="tab-hero-subtitle">Planeje aulas vinculadas às turmas, acompanhe prazos de execução, compare turmas e rastreie habilidades da BNCC.</p>
                            </div>

                            <div class="tab-hero-actions">
                                <!-- Segmented Control de 3 Visões -->
                                <div class="schedule-view-switcher" style="display: inline-flex; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.25); border-radius: 30px; padding: 3px;">
                                    <button type="button" id="btn-view-monthly" onclick="switchScheduleMainView('monthly'); return false;" class="schedule-tab-btn active" style="display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 24px; font-size: 0.8rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s ease;">
                                        <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
                                        <span>Mensal</span>
                                    </button>
                                    <button type="button" id="btn-view-weekly" onclick="switchScheduleMainView('weekly'); return false;" class="schedule-tab-btn" style="display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 24px; font-size: 0.8rem; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s ease; background: transparent; color: #ffffff;">
                                        <i data-lucide="layout-grid" style="width: 14px; height: 14px;"></i>
                                        <span>Semanal (Grade)</span>
                                    </button>
                                    <button type="button" id="btn-view-comparison" onclick="switchScheduleMainView('comparison'); return false;" class="schedule-tab-btn" style="display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 24px; font-size: 0.8rem; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s ease; background: transparent; color: #ffffff;">
                                        <i data-lucide="git-compare" style="width: 14px; height: 14px;"></i>
                                        <span>Comparativo</span>
                                    </button>
                                </div>

                                <!-- Botão Lixeira Pedagógica -->
                                <button type="button" class="btn-hero-outline" onclick="openScheduleTrashModal(); return false;" title="Lixeira de Aulas Excluídas (30 dias)">
                                    <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                                    <span id="trash-count-badge">Lixeira (0)</span>
                                </button>

                                <!-- CTA Principal: + Novo Planejamento / Agendar Aula -->
                                <button type="button" class="btn-hero-white" onclick="openNewSchedulePlanModal(); return false;">
                                    <i data-lucide="plus" style="width: 15px; height: 15px;"></i>
                                    <span>+ Novo Planejamento</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="card card-full margin-bottom-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-card); padding: 0; overflow: hidden;">`);
    console.log('[OK] 9. Cronograma Habilidades padronizado');
} else {
    console.error('[ERRO] 9. Cronograma Habilidades regex não casou');
}

// 10. #gestao-pedagogica
const p10_before = /(<section id="gestao-pedagogica"[^>]*>)\s*<div class="card card-full margin-bottom-md"/;
if (p10_before.test(normalized)) {
    normalized = normalized.replace(p10_before, `$1
                    <div class="tab-hero-banner">
                        <div class="tab-hero-content">
                            <div>
                                <div class="tab-hero-tag">
                                    <i data-lucide="award" style="width: 14px; height: 14px;"></i>
                                    <span>Diagnóstico Cognitivo & Intervenções Pedagógicas</span>
                                </div>
                                <h2 class="tab-hero-title">Gestão Pedagógica & Análise SAEB</h2>
                                <p class="tab-hero-subtitle">Classificação por níveis de proficiência (0 a 5), laudos técnicos diagnósticos por estudante e modelos de intervenção escolar.</p>
                            </div>
                        </div>
                    </div>

                    <div class="card card-full margin-bottom-md"`);
    console.log('[OK] 10. Gestao Pedagogica padronizado');
} else {
    console.error('[ERRO] 10. Gestao Pedagogica regex não casou');
}

// 11. #banco-questoes
const p11_before = /(<section id="banco-questoes"[^>]*>[\s\S]*?)<div class="card margin-bottom-md"\s+style="background:\s*linear-gradient\(135deg,\s*rgba\(139,\s*92,\s*246[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
if (p11_before.test(normalized)) {
    normalized = normalized.replace(p11_before, `$1<div class="tab-hero-banner">
                        <div class="tab-hero-content">
                            <div>
                                <div class="tab-hero-tag">
                                    <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>
                                    <span>Banco de Itens & Inteligência Artificial</span>
                                </div>
                                <h2 class="tab-hero-title">Banco de Questões & Gerador com IA Integrada</h2>
                                <p class="tab-hero-subtitle">Crie itens calibrados por IA, importe lotes de arquivos (PDF/Word) com gabarito padrão, ou monte cadernos completos de simulados.</p>
                            </div>
                            <div class="tab-hero-actions">
                                <button class="btn-hero-outline" id="btn-download-word-template">
                                    <i data-lucide="file-down"></i>
                                    <span>Baixar Modelo Word (.docx)</span>
                                </button>
                                <button class="btn-hero-outline" id="btn-config-ai-key">
                                    <i data-lucide="key-round"></i>
                                    <span>Configurar Chave IA</span>
                                </button>
                                <button class="btn-hero-white" id="btn-open-create-exam-from-q">
                                    <i data-lucide="printer"></i>
                                    <span>Montar Simulado com Itens</span>
                                </button>
                            </div>
                        </div>
                    </div>`);
    console.log('[OK] 11. Banco Questoes padronizado');
} else {
    console.error('[ERRO] 11. Banco Questoes regex não casou');
}

// 12. #biblioteca-recursos
const p12_before = /(<section id="biblioteca-recursos"[^>]*>[\s\S]*?)<div class="mec-library-hero"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
if (p12_before.test(normalized)) {
    normalized = normalized.replace(p12_before, `$1<div class="tab-hero-banner">
                        <div class="tab-hero-content">
                            <div>
                                <div class="tab-hero-tag">
                                    <i data-lucide="book-open" style="width: 14px; height: 14px;"></i>
                                    <span>Acervo Digital Oficial • SEMED Gonçalves Dias - MA</span>
                                </div>
                                <h2 class="tab-hero-title">Biblioteca Pedagógica de Provas & Cadernos Didáticos</h2>
                                <p class="tab-hero-subtitle">Acesso institucional aos cadernos de simulados impressos padrão SAEB/SEAMA, matrizes curriculares comentadas e guias do professor.</p>
                            </div>
                            <div class="tab-hero-actions">
                                <button class="btn-hero-white" id="btn-bib-print-direct" onclick="openCombinedCadernoModal();">
                                    <i data-lucide="printer" style="width:16px; height:16px;"></i>
                                    <span>Gerar Caderno A4 Completo</span>
                                </button>
                                <button class="btn-hero-outline" id="btn-bib-upload-new" onclick="openUploadPedagogicModal(); return false;">
                                    <i data-lucide="upload-cloud" style="width:16px; height:16px;"></i>
                                    <span>Adicionar Material ao Acervo</span>
                                </button>
                            </div>
                        </div>
                    </div>`);
    console.log('[OK] 12. Biblioteca Recursos padronizado');
} else {
    console.error('[ERRO] 12. Biblioteca Recursos regex não casou');
}

// 13. #admin-panel
const p13_before = /(<div id="users-list-view-container">[\s\S]*?)<div class="flex-between margin-bottom-md" style="align-items: center;">[\s\S]*?<\/button>\s*<\/div>/;
if (p13_before.test(normalized)) {
    normalized = normalized.replace(p13_before, `$1<div class="tab-hero-banner">
                            <div class="tab-hero-content">
                                <div>
                                    <div class="tab-hero-tag">
                                        <i data-lucide="shield-check" style="width: 14px; height: 14px;"></i>
                                        <span>Controle de Acesso & Gestão de Equipe</span>
                                    </div>
                                    <h2 class="tab-hero-title">Gestão de Usuários & Equipe Escolar</h2>
                                    <p class="tab-hero-subtitle">Gestão centralizada de professores, diretores escolares, coordenadores e equipe técnica da SEMED Gonçalves Dias.</p>
                                </div>
                                <div class="tab-hero-actions">
                                    <button class="btn-hero-white" id="btn-open-create-user-modal" onclick="openCreateUserModal(); return false;">
                                        <i data-lucide="user-plus"></i>
                                        <span>+ Cadastrar Novo Usuário</span>
                                    </button>
                                </div>
                            </div>
                        </div>`);
    console.log('[OK] 13. Admin Panel padronizado');
} else {
    console.error('[ERRO] 13. Admin Panel regex não casou');
}

const finalHtml = isCRLF ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(indexHtmlPath, finalHtml, 'utf8');
console.log('\nProcesso finalizado com sucesso!');
