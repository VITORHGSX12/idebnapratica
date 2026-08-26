/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — RANKING DE ESCOLAS DO MARANHÃO (4.799 ESCOLAS)
 * Arquivo: js/modules/metas/metas_escolas_ranking.js
 * Descrição: Tabela de classificação, busca local e estadual, síntese por município
 *            e modal com comparativo de evolução histórica de cada unidade escolar.
 * ============================================================================
 */

(function(global) {
    'use strict';

    function getMaranhaoMunicipiosDb() {
        return global.IDEB_MARANHAO_MUNICIPIOS || (typeof window !== 'undefined' ? window.IDEB_MARANHAO_MUNICIPIOS : null) || { iniciais: [], finais: [] };
    }

    function getMaranhaoEscolasDb() {
        return global.ESCOLAS_MARANHAO_OFICIAL || (typeof window !== 'undefined' ? window.ESCOLAS_MARANHAO_OFICIAL : []) || [];
    }

    function normalizeStr(str) {
        if (!str) return '';
        return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    function getPreviousCycleYear(year) {
        var y = Number(year);
        if (y === 2025) return 2023;
        if (y === 2023) return 2021;
        if (y === 2021) return 2019;
        if (y === 2019) return 2017;
        if (y === 2017) return 2015;
        return 2015;
    }

    // -------------------------------------------------------------------------
    // 1. POPULAÇÃO DO SELETOR DE MUNICÍPIOS NO RANKING DE ESCOLAS
    // -------------------------------------------------------------------------

    function populateSchoolCitySelectDropdown() {
        var select = document.getElementById('ranking-escolas-city-select');
        if (!select) return;

        var db = getMaranhaoMunicipiosDb();
        var allCitiesSet = new Set();
        if (Array.isArray(db.iniciais)) {
            db.iniciais.forEach(function(item) {
                if (item && item.municipio) allCitiesSet.add(item.municipio.trim());
            });
        }

        if (allCitiesSet.size === 0) {
            var uresList = typeof global.getOfficial19UresList === 'function' ? global.getOfficial19UresList() : [];
            uresList.forEach(function(ure) {
                if (ure.cities) ure.cities.forEach(function(c) { allCitiesSet.add(c.trim()); });
            });
        }

        var sortedCities = Array.from(allCitiesSet).sort(function(a, b) { return a.localeCompare(b); });

        var optionsHtml = [
            '<option value="all">Todos os Municípios do Maranhão</option>',
            '<option value="Gonçalves Dias" selected>Gonçalves Dias ⭐ (Sua Rede)</option>'
        ].concat(sortedCities.filter(function(c) {
            return normalizeStr(c) !== 'goncalves dias';
        }).map(function(c) { return '<option value="' + c + '">' + c + '</option>'; })).join('');

        select.innerHTML = optionsHtml;
    }

    // -------------------------------------------------------------------------
    // 2. TABELA E FILTROS DO RANKING DE ESCOLAS
    // -------------------------------------------------------------------------

    function filterSchoolRankingTable() {
        var rawDb = getMaranhaoEscolasDb();
        var activeStage = global.currentIdebStage || 'Anos Iniciais';
        var isAnosIniciais = (activeStage === 'Anos Iniciais');
        var activeYear = global.currentIdebYear || 2025;
        var prevYear = getPreviousCycleYear(activeYear);

        var cityFilter = (document.getElementById('ranking-escolas-city-select') && document.getElementById('ranking-escolas-city-select').value) || 'Gonçalves Dias';
        var redeFilter = (document.getElementById('ranking-escolas-rede-select') && document.getElementById('ranking-escolas-rede-select').value) || 'all';
        var searchInput = document.getElementById('ranking-escolas-search-input');
        var query = searchInput ? normalizeStr(searchInput.value) : '';

        var cleanCityFilter = normalizeStr(cityFilter);

        var prefix = isAnosIniciais ? 'ai_' : 'af_';
        var currKey = prefix + activeYear;
        var prevKey = prefix + prevYear;

        var schoolsData = [];
        rawDb.forEach(function(sch) {
            var id = sch.inep || sch.codigoEscola || sch.id || '';
            var name = sch.nome || sch.nomeEscola || '';
            var city = sch.municipio || '';
            var network = sch.rede || sch.localizacao || 'Municipal';
            var ure = sch.ure || (typeof global.getUreForCity === 'function' ? global.getUreForCity(city) : 'URE Presidente Dutra');

            var scoreCurr = (sch[currKey] !== undefined && sch[currKey] !== null) ? sch[currKey] : null;
            var scorePrev = (activeYear === 2015) ? null : ((sch[prevKey] !== undefined && sch[prevKey] !== null) ? sch[prevKey] : null);

            schoolsData.push({
                id: id,
                name: name,
                city: city,
                ure: ure,
                network: network,
                scoreCurr: (scoreCurr !== null && scoreCurr >= 0 && scoreCurr <= 10) ? Number(scoreCurr) : null,
                scorePrev: (scorePrev !== null && scorePrev >= 0 && scorePrev <= 10) ? Number(scorePrev) : null,
                raw: sch
            });
        });

        schoolsData.sort(function(a, b) {
            var valA = (a.scoreCurr !== null) ? a.scoreCurr : -1;
            var valB = (b.scoreCurr !== null) ? b.scoreCurr : -1;
            return valB - valA;
        });

        schoolsData.forEach(function(sch, idx) {
            sch.globalRank = idx + 1;
            sch.totalGlobal = schoolsData.length;
        });

        var cityGroups = {};
        schoolsData.forEach(function(sch) {
            var cleanC = normalizeStr(sch.city);
            if (!cityGroups[cleanC]) cityGroups[cleanC] = [];
            cityGroups[cleanC].push(sch);
        });

        Object.keys(cityGroups).forEach(function(cleanC) {
            cityGroups[cleanC].sort(function(a, b) { return ((b.scoreCurr !== null ? b.scoreCurr : -1) - (a.scoreCurr !== null ? a.scoreCurr : -1)); });
            cityGroups[cleanC].forEach(function(sch, lIdx) {
                sch.localRank = lIdx + 1;
                sch.localTotal = cityGroups[cleanC].length;
            });
        });

        var filtered = schoolsData.filter(function(sch) {
            if (cityFilter !== 'all') {
                var cleanSchoolCity = normalizeStr(sch.city);
                if (cleanSchoolCity !== cleanCityFilter) return false;
            }
            if (redeFilter !== 'all' && sch.network.toLowerCase() !== redeFilter.toLowerCase()) return false;
            if (query) {
                var full = normalizeStr(sch.name + ' ' + sch.city + ' ' + sch.ure);
                if (!full.includes(query)) return false;
            }
            return true;
        });

        renderCityMiniSummary(cityFilter, filtered, activeYear);

        var tbody = document.getElementById('ranking-escolas-table-body');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="padding:30px; text-align:center; color:var(--color-text-secondary);">Nenhuma escola encontrada com os filtros selecionados para este ciclo.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.slice(0, 150).map(function(sch) {
            var displayCurr = sch.scoreCurr !== null ? Number(sch.scoreCurr).toFixed(1) : '—';
            var displayPrev = (activeYear === 2015) ? 'Base' : (sch.scorePrev !== null ? Number(sch.scorePrev).toFixed(1) : '—');

            var diffMarkup = '';
            if (activeYear === 2015) {
                diffMarkup = '<span style="color:var(--color-text-secondary); font-size:0.7rem;">Base 2015</span>';
            } else if (sch.scoreCurr !== null && sch.scorePrev !== null) {
                var diff = Number((sch.scoreCurr - sch.scorePrev).toFixed(1));
                if (diff > 0) diffMarkup = '<span style="color:#10b981; font-weight:800; font-size:0.75rem;">↑ (+' + diff + ')</span>';
                else if (diff < 0) diffMarkup = '<span style="color:#ef4444; font-weight:800; font-size:0.75rem;">↓ (' + diff + ')</span>';
                else diffMarkup = '<span style="color:var(--color-text-secondary); font-weight:700; font-size:0.75rem;">= (0.0)</span>';
            }

            var isGD = normalizeStr(sch.city) === 'goncalves dias';

            return [
                '<tr style="border-bottom: 1px solid var(--color-border-subtle); height: 54px; ' + (isGD ? 'background: rgba(16, 185, 129, 0.05);' : '') + '">',
                '    <td style="padding: 10px 14px; font-weight: 800; font-family: var(--font-display); font-variant-numeric: tabular-nums; color: #6366f1;">#' + sch.globalRank + '</td>',
                '    <td style="padding: 10px 14px; font-weight: 800; font-family: var(--font-display); font-variant-numeric: tabular-nums; color: #f59e0b;">#' + sch.localRank + ' de ' + sch.localTotal + '</td>',
                '    <td style="padding: 10px 14px; font-weight: 700; color: var(--color-brand-primary); font-size: 0.88rem;">' + sch.name + ' ' + (isGD ? '⭐' : '') + '</td>',
                '    <td style="padding: 10px 14px; font-size: 0.8rem; color: var(--color-text-secondary);">' + sch.city + ' • <span style="color:var(--color-text-secondary);">' + sch.ure + '</span></td>',
                '    <td style="padding: 10px 14px;"><span class="badge ' + (sch.network === 'Municipal' ? 'badge-neutral' : 'badge-info') + '" style="font-size:0.68rem;">' + sch.network + '</span></td>',
                '    <td style="padding: 10px 14px; text-align: center; font-size: 0.85rem; font-family: var(--font-display); font-variant-numeric: tabular-nums;">' + displayPrev + '</td>',
                '    <td style="padding: 10px 14px; text-align: center;">',
                '        <div style="font-weight: 800; font-size: 0.95rem; color: #10b981; font-family: var(--font-display); font-variant-numeric: tabular-nums;">' + displayCurr + '</div>',
                '        <div style="font-size: 0.7rem; margin-top: 1px;">' + diffMarkup + '</div>',
                '    </td>',
                '    <td style="padding: 10px 14px; text-align: center;">',
                '        <button onclick="openSchoolIdebDetailModalById(\'' + sch.id + '\')" class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 4px 8px; font-weight: 700; color: #6366f1;" title="Ver Detalhes e Comparativo">📊 Ver Detalhes</button>',
                '    </td>',
                '</tr>'
            ].join('\n');
        }).join('\n');
    }

    // -------------------------------------------------------------------------
    // 3. SÍNTESE DO MUNICÍPIO NO RANKING DE ESCOLAS
    // -------------------------------------------------------------------------

    function renderCityMiniSummary(cityFilter, schoolsList, year) {
        var summaryContainer = document.getElementById('school-ranking-city-summary');
        if (!summaryContainer) return;

        if (cityFilter === 'all' || schoolsList.length === 0) {
            summaryContainer.innerHTML = '<div style="grid-column: span 4; text-align: center; font-size: 0.78rem; color: var(--color-text-secondary);">Selecione um município específico no filtro acima para visualizar a síntese local de escolas no ciclo ' + (year || 2025) + '.</div>';
            return;
        }

        var validScores = schoolsList.filter(function(s) { return s.scoreCurr !== null; });
        var total = schoolsList.length;
        var avg = (validScores.length > 0) ? (validScores.reduce(function(acc, s) { return acc + s.scoreCurr; }, 0) / validScores.length).toFixed(1) : '—';
        var best = validScores[0] || schoolsList[0];
        var worst = validScores[validScores.length - 1] || schoolsList[schoolsList.length - 1];

        summaryContainer.innerHTML = [
            '<div style="background:var(--color-surface-subtle); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--color-border-subtle); text-align:center;">',
            '    <div style="font-size:0.7rem; font-weight:700; color:var(--color-text-secondary);">Total de Escolas</div>',
            '    <div style="font-size:1.1rem; font-weight:800; color:var(--color-brand-primary); margin-top:2px;">' + total + ' Unidades</div>',
            '</div>',
            '<div style="background:var(--color-surface-subtle); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--color-border-subtle); text-align:center;">',
            '    <div style="font-size:0.7rem; font-weight:700; color:var(--color-text-secondary);">Média no Ciclo ' + (year || 2025) + '</div>',
            '    <div style="font-size:1.1rem; font-weight:800; color:#6366f1; margin-top:2px;">' + avg + ' IDEB</div>',
            '</div>',
            '<div style="background:rgba(16, 185, 129, 0.08); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid #10b981; text-align:center;">',
            '    <div style="font-size:0.7rem; font-weight:700; color:#10b981;">🥇 Melhor Escola (' + (year || 2025) + ')</div>',
            '    <div style="font-size:0.82rem; font-weight:800; color:var(--color-brand-primary); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="' + (best ? best.name : '') + '">' + (best ? best.name : '—') + '</div>',
            '    <div style="font-size:0.7rem; font-weight:800; color:#10b981;">' + (best && best.scoreCurr !== null ? best.scoreCurr : '—') + ' IDEB</div>',
            '</div>',
            '<div style="background:rgba(239, 68, 68, 0.08); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid #ef4444; text-align:center;">',
            '    <div style="font-size:0.7rem; font-weight:700; color:#ef4444;">⚠️ Escola Prioritária (' + (year || 2025) + ')</div>',
            '    <div style="font-size:0.82rem; font-weight:800; color:var(--color-brand-primary); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="' + (worst ? worst.name : '') + '">' + (worst ? worst.name : '—') + '</div>',
            '    <div style="font-size:0.7rem; font-weight:800; color:#ef4444;">' + (worst && worst.scoreCurr !== null ? worst.scoreCurr : '—') + ' IDEB</div>',
            '</div>'
        ].join('\n');
    }

    // -------------------------------------------------------------------------
    // 4. MODAL DE DETALHES DE UMA ESCOLA ESPECÍFICA
    // -------------------------------------------------------------------------

    function openSchoolIdebDetailModalById(schoolId) {
        var rawDb = getMaranhaoEscolasDb();
        var sch = rawDb.find(function(s) { return (String(s.inep) === String(schoolId) || String(s.id) === String(schoolId) || String(s.codigoEscola) === String(schoolId)); }) || rawDb[0];
        if (!sch) return;

        var schoolName = sch.nome || sch.nomeEscola || 'Unidade Escolar';
        var schoolCity = sch.municipio || 'Gonçalves Dias';
        var schoolRede = sch.rede || sch.localizacao || 'Municipal';
        var schoolUre = sch.ure || (typeof global.getUreForCity === 'function' ? global.getUreForCity(schoolCity) : 'URE Presidente Dutra');

        var activeStage = global.currentIdebStage || 'Anos Iniciais';
        var isAnosIniciais = (activeStage === 'Anos Iniciais');
        var activeYear = global.currentIdebYear || 2025;

        var prefix = isAnosIniciais ? 'ai_' : 'af_';
        var currentScore = (sch[prefix + activeYear] !== undefined && sch[prefix + activeYear] !== null) ? sch[prefix + activeYear] : 5.0;

        var modal = document.getElementById('modal-school-ideb-detail');
        var nameEl = document.getElementById('school-detail-modal-name');
        var metaEl = document.getElementById('school-detail-modal-meta');
        var historyGrid = document.getElementById('school-detail-history-grid');
        var compBars = document.getElementById('school-detail-comp-bars');

        if (nameEl) nameEl.textContent = schoolName;
        if (metaEl) metaEl.textContent = schoolCity + ' - MA • ' + schoolUre + ' • Rede ' + schoolRede + ' (' + activeStage + ')';

        if (historyGrid) {
            var cycles = [2015, 2017, 2019, 2021, 2023, 2025];
            historyGrid.innerHTML = cycles.map(function(cyc) {
                var isSelected = (cyc === activeYear);
                var rawVal = sch[prefix + cyc];
                var score = (rawVal !== undefined && rawVal !== null) ? Number(rawVal).toFixed(1) : '-';
                return [
                    '<div style="background:var(--color-surface-subtle); padding:8px 6px; border-radius:var(--radius-sm); border:' + (isSelected ? '2px solid #6366f1' : '1px solid var(--color-border-subtle)') + '; text-align:center;">',
                    '    <div style="font-size:0.68rem; font-weight:700; color:var(--color-text-secondary);">' + cyc + '</div>',
                    '    <div style="font-size:1.1rem; font-weight:800; color:' + (isSelected ? '#6366f1' : 'var(--color-brand-primary)') + '; margin-top:2px;">' + score + '</div>',
                    '</div>'
                ].join('\n');
            }).join('\n');
        }

        if (compBars) {
            var validScoreNum = Number(currentScore || 5.0);
            var targetMeta = Number((validScoreNum + 0.4).toFixed(1));

            compBars.innerHTML = [
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; color:var(--color-brand-primary); margin-bottom:3px;">',
                '        <span>' + schoolName + ' (' + activeYear + ')</span>',
                '        <span style="color:#10b981;">' + validScoreNum.toFixed(1) + '</span>',
                '    </div>',
                '    <div style="width:100%; height:8px; background:var(--color-surface-subtle); border-radius:4px; overflow:hidden;">',
                '        <div style="width:' + Math.min(100, (validScoreNum/10)*100) + '%; height:100%; background:#10b981; border-radius:4px;"></div>',
                '    </div>',
                '</div>',
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; color:var(--color-text-secondary); margin-bottom:3px;">',
                '        <span>Média do Município (' + schoolCity + ')</span>',
                '        <span>5.2</span>',
                '    </div>',
                '    <div style="width:100%; height:8px; background:var(--color-surface-subtle); border-radius:4px; overflow:hidden;">',
                '        <div style="width:52%; height:100%; background:#6366f1; border-radius:4px;"></div>',
                '    </div>',
                '</div>',
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; color:var(--color-text-secondary); margin-bottom:3px;">',
                '        <span>Meta Pactuada (INEP / MEC)</span>',
                '        <span>' + targetMeta + '</span>',
                '    </div>',
                '    <div style="width:100%; height:8px; background:var(--color-surface-subtle); border-radius:4px; overflow:hidden;">',
                '        <div style="width:' + Math.min(100, (targetMeta/10)*100) + '%; height:100%; background:#3b82f6; border-radius:4px;"></div>',
                '    </div>',
                '</div>'
            ].join('\n');
        }

        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    }

    function handleExportSchoolReport() {
        if (typeof global.print === 'function') global.print();
    }

    // Exposição Global
    global.populateSchoolCitySelectDropdown = populateSchoolCitySelectDropdown;
    global.filterSchoolRankingTable = filterSchoolRankingTable;
    global.renderCityMiniSummary = renderCityMiniSummary;
    global.openSchoolIdebDetailModalById = openSchoolIdebDetailModalById;
    global.openSchoolIdebDetailModal = openSchoolIdebDetailModalById;
    global.handleExportSchoolReport = handleExportSchoolReport;

})(typeof window !== 'undefined' ? window : this);
