/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — COMPARATIVO REGIONAL IDEB & 19 UREs DO MARANHÃO
 * Arquivo: js/modules/metas/metas_regional.js
 * Descrição: Comparativo dos 217 municípios do Maranhão e painel das 19 UREs
 *            com séries históricas oficiais do INEP (2015-2025).
 * ============================================================================
 */

(function(global) {
    'use strict';

    function getMaranhaoMunicipiosDb() {
        return global.IDEB_MARANHAO_MUNICIPIOS || (typeof window !== 'undefined' ? window.IDEB_MARANHAO_MUNICIPIOS : null) || { iniciais: [], finais: [] };
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
    // 1. GESTÃO E MAPEAMENTO DAS 19 UREs DO MARANHÃO
    // -------------------------------------------------------------------------

    function getOfficial19UresList() {
        if (global.OFFICIAL_19_URES_MA && global.OFFICIAL_19_URES_MA.length > 0) {
            return global.OFFICIAL_19_URES_MA;
        }

        var db = getMaranhaoMunicipiosDb();
        var uresMap = {};

        var list = (Array.isArray(db.iniciais) && db.iniciais.length > 0) ? db.iniciais : db.finais;

        if (Array.isArray(list) && list.length > 0) {
            list.forEach(function(c) {
                if (!c || !c.municipio) return;
                var m = c.municipio.trim();
                var ureName = c.ure || "URE Presidente Dutra";
                if (!uresMap[ureName]) {
                    uresMap[ureName] = {
                        name: ureName,
                        sede: ureName.replace(/^URE\s+/i, '').trim(),
                        cities: []
                    };
                }
                if (!uresMap[ureName].cities.includes(m)) {
                    uresMap[ureName].cities.push(m);
                }
            });
        }

        var res = Object.values(uresMap).sort(function(a, b) { return a.name.localeCompare(b.name); });
        if (res.length > 0) {
            global.OFFICIAL_19_URES_MA = res;
        }
        return res;
    }

    function getUreForCity(cityName) {
        if (!cityName) return "URE Presidente Dutra";
        var clean = normalizeStr(cityName);

        var db = getMaranhaoMunicipiosDb();
        var allMun = (db.iniciais || []).concat(db.finais || []);
        var foundInMun = allMun.find(function(m) {
            return m && m.municipio && normalizeStr(m.municipio) === clean;
        });
        if (foundInMun && foundInMun.ure) return foundInMun.ure;

        var uresList = getOfficial19UresList();
        var found = uresList.find(function(ure) {
            return ure.cities && ure.cities.some(function(c) { return normalizeStr(c) === clean; });
        });
        return found ? found.name : "URE Presidente Dutra";
    }

    function getOfficialExcelCityData(cityName, etapa) {
        try {
            if (!cityName) return null;
            var clean = normalizeStr(cityName);

            var db = getMaranhaoMunicipiosDb();
            var list = (etapa === 'Anos Finais') ? db.finais : db.iniciais;

            if (Array.isArray(list)) {
                var found = list.find(function(item) {
                    if (!item || !item.municipio) return false;
                    var itemClean = normalizeStr(item.municipio);
                    return itemClean === clean || itemClean.includes(clean) || clean.includes(itemClean);
                });
                if (found) return found;
            }

            var refList = global.idebPublicoReferencia;
            if (Array.isArray(refList)) {
                var etapaName = (etapa === 'Anos Finais') ? 'finais' : 'iniciais';
                var foundRef = refList.find(function(item) {
                    if (!item || !item.municipio) return false;
                    var itemClean = normalizeStr(item.municipio);
                    return (itemClean === clean || itemClean.includes(clean)) && (item.etapa || '').toLowerCase().includes(etapaName);
                });
                if (foundRef) {
                    var anosObj = foundRef.anos || {};
                    return {
                        municipio: foundRef.municipio,
                        ure: getUreForCity(foundRef.municipio),
                        y2015: anosObj['2015'] !== undefined ? anosObj['2015'] : null,
                        y2017: anosObj['2017'] !== undefined ? anosObj['2017'] : null,
                        y2019: anosObj['2019'] !== undefined ? anosObj['2019'] : null,
                        y2021: anosObj['2021'] !== undefined ? anosObj['2021'] : null,
                        y2023: anosObj['2023'] !== undefined ? anosObj['2023'] : null,
                        y2025: anosObj['2025'] !== undefined ? anosObj['2025'] : null
                    };
                }
            }
        } catch(e) {
            console.error('[getOfficialExcelCityData Error]', e);
        }
        return null;
    }

    function getMaranhaoCityIdebData(cityName, etapa) {
        return getOfficialExcelCityData(cityName, etapa);
    }

    function toggleUreSortOrder() {
        global.currentUreSortOrder = global.currentUreSortOrder === 'media' ? 'az' : 'media';
        var btn = document.getElementById('btn-ure-sort-toggle');
        if (btn) {
            btn.innerHTML = global.currentUreSortOrder === 'media' 
                ? '<i data-lucide="arrow-up-down" style="width:14px;height:14px;"></i> <span>Alternar Ordenação (Maior Média)</span>' 
                : '<i data-lucide="arrow-up-down" style="width:14px;height:14px;"></i> <span>Ordem Alfabética (A-Z)</span>';
        }
        render19UresPanel();
    }

    function selectCityFromUre(cityName) {
        global.currentSelectedCity = cityName;
        var selector = document.getElementById('ideb-city-selector');
        if (selector) selector.value = cityName;
        if (typeof global.switchIdebSubtab === 'function') {
            global.switchIdebSubtab('painel-principal');
        }
        if (typeof global.handleSelectIdebCity === 'function') {
            global.handleSelectIdebCity(cityName);
        }
    }

    // -------------------------------------------------------------------------
    // 2. SUBTAB 2: PAINEL DAS 19 UREs DO MARANHÃO
    // -------------------------------------------------------------------------

    function render19UresPanel() {
        var container = document.getElementById('ures-cards-container');
        if (!container) return;

        try {
            var activeYear = global.currentIdebYear || 2025;
            var activeStage = global.currentIdebStage || 'Anos Iniciais';
            var currKey = 'y' + activeYear;

            var queryInput = document.getElementById('ure-search-input');
            var query = queryInput ? normalizeStr(queryInput.value) : '';

            var uresList = getOfficial19UresList();
            if (uresList.length === 0) {
                container.innerHTML = '<div style="padding:24px; text-align:center; color:var(--color-text-secondary);">Base de UREs indisponível.</div>';
                return;
            }

            var calculatedUres = uresList.map(function(ure) {
                var totalScore = 0;
                var validCount = 0;

                var citiesData = (ure.cities || []).map(function(city) {
                    var realData = getOfficialExcelCityData(city, activeStage);
                    var rawVal = realData && realData[currKey] !== null && realData[currKey] !== undefined ? realData[currKey] : null;
                    var isValid = (rawVal !== null && rawVal >= 0 && rawVal <= 10);
                    var score = isValid ? rawVal : null;

                    if (isValid) {
                        totalScore += rawVal;
                        validCount++;
                    }

                    return {
                        name: city,
                        score: score,
                        displayScore: isValid ? Number(rawVal).toFixed(1) : '—',
                        isGD: (normalizeStr(city) === 'goncalves dias')
                    };
                });

                var avgScore = validCount > 0 ? Number((totalScore / validCount).toFixed(2)) : 0;
                var displayAvg = validCount > 0 ? (totalScore / validCount).toFixed(1) : '—';

                return {
                    name: ure.name,
                    sede: ure.sede,
                    cities: citiesData,
                    count: citiesData.length,
                    avgScore: avgScore,
                    displayAvg: displayAvg
                };
            });

            var stateTotal = 0;
            var stateCount = 0;
            calculatedUres.forEach(function(u) {
                u.cities.forEach(function(c) {
                    if (c.score !== null) {
                        stateTotal += c.score;
                        stateCount++;
                    }
                });
            });
            var stateAvg = stateCount > 0 ? (stateTotal / stateCount).toFixed(1) : '4.8';

            var sortedForTop = calculatedUres.slice().sort(function(a, b) { return b.avgScore - a.avgScore; });
            var topUre = sortedForTop[0];
            var kpiAvgEl = document.getElementById('ures-kpi-state-avg');
            var kpiTopEl = document.getElementById('ures-kpi-top-ure');
            if (kpiAvgEl) kpiAvgEl.textContent = stateAvg + ' (' + (activeStage === 'Anos Iniciais' ? '5º Ano' : '9º Ano') + ')';
            if (kpiTopEl && topUre) kpiTopEl.textContent = topUre.name + ' (' + topUre.displayAvg + ')';

            var filtered = calculatedUres.filter(function(ure) {
                if (!query) return true;
                var fullText = normalizeStr(ure.name + ' ' + ure.cities.map(function(c) { return c.name; }).join(' '));
                return fullText.includes(query);
            });

            if (global.currentUreSortOrder === 'az') {
                filtered.sort(function(a, b) { return a.name.localeCompare(b.name); });
            } else {
                filtered.sort(function(a, b) { return b.avgScore - a.avgScore; });
            }

            if (filtered.length === 0) {
                container.innerHTML = '<div class="card" style="padding:32px; text-align:center; color:var(--color-text-secondary); background:var(--color-surface-subtle);"><h4 style="margin:0 0 4px 0;">Nenhuma URE ou Município Encontrado</h4><p class="text-sm text-muted" style="margin:0;">Nenhum registro corresponde à busca "' + query + '".</p></div>';
                return;
            }

            container.innerHTML = filtered.map(function(ure) {
                var citiesChips = ure.cities.map(function(c) {
                    var scoreBg = '#f1f5f9';
                    var scoreColor = '#475569';
                    if (c.score !== null) {
                        if (c.score >= 6.0) { scoreBg = '#dcfce7'; scoreColor = '#166534'; }
                        else if (c.score >= 5.0) { scoreBg = '#e0e7ff'; scoreColor = '#3730a3'; }
                        else if (c.score < 4.0) { scoreBg = '#fee2e2'; scoreColor = '#991b1b'; }
                    }

                    return [
                        '<button onclick="selectCityFromUre(\'' + c.name.replace(/'/g, "\\'") + '\')" style="display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:16px; border:1px solid ' + (c.isGD ? '#10b981' : 'var(--color-border-subtle)') + '; background:' + (c.isGD ? 'rgba(16,185,129,0.1)' : 'var(--color-surface-card)') + '; font-size:var(--text-xs); font-weight:' + (c.isGD ? '800' : '600') + '; color:var(--color-brand-primary); cursor:pointer; transition:all 0.15s ease;" title="Ver ' + c.name + ' no Painel Geral (' + activeYear + ')">',
                        '    <span>' + c.name + ' ' + (c.isGD ? '⭐ (Sua Rede)' : '') + '</span>',
                        '    <span style="font-weight:800; font-size:0.7rem; padding:1px 6px; border-radius:10px; background:' + scoreBg + '; color:' + scoreColor + ';">' + c.displayScore + '</span>',
                        '</button>'
                    ].join('\n');
                }).join('\n');

                return [
                    '<div class="card" style="background:var(--color-surface-card); border:1px solid var(--color-border-subtle); padding:16px; border-radius:var(--radius-md);">',
                    '    <div class="flex-between flex-wrap gap-md" style="margin-bottom: 12px; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 10px;">',
                    '        <div style="display: flex; align-items: center; gap: 10px;">',
                    '            <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:rgba(99,102,241,0.1);display:flex;align-items:center;justify-content:center;color:#6366f1;font-weight:800;font-size:0.8rem;">🏛️</div>',
                    '            <div>',
                    '                <h4 style="margin: 0; font-size: var(--text-title-sm); font-weight: 700; color: var(--color-brand-primary);">' + ure.name + '</h4>',
                    '                <span style="font-size: var(--text-xs); color: var(--color-text-secondary);">Sede: ' + (ure.sede || 'Maranhão') + '</span>',
                    '            </div>',
                    '            <span class="badge badge-neutral" style="font-size: var(--text-xs); margin-left: 4px;">' + ure.count + ' Municípios</span>',
                    '        </div>',
                    '        <div style="display: flex; align-items: center; gap: 10px;">',
                    '            <div style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary);">',
                    '                Média da URE (' + activeYear + '): <strong style="color: #6366f1; font-size: var(--text-body); font-family: var(--font-display); font-variant-numeric: tabular-nums;">' + ure.displayAvg + '</strong>',
                    '            </div>',
                    '        </div>',
                    '    </div>',
                    '    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">',
                    '        ' + citiesChips,
                    '    </div>',
                    '</div>'
                ].join('\n');
            }).join('\n');
        } catch(err) {
            console.error('Error rendering 19 UREs:', err);
            container.innerHTML = '<div class="card" style="padding:20px; text-align:center; color:#ef4444;">Erro ao renderizar UREs: ' + err.message + '</div>';
        }
    }

    // -------------------------------------------------------------------------
    // 3. SUBTAB 3: RANKING GERAL DOS 217 MUNICÍPIOS DO MARANHÃO
    // -------------------------------------------------------------------------

    function populateRankingMaUreFilter() {
        var select = document.getElementById('ranking-ma-ure-filter');
        if (!select) return;

        var uresList = getOfficial19UresList();
        var optionsHtml = '<option value="all">Todas as 19 UREs do Maranhão</option>' +
            uresList.map(function(u) {
                return '<option value="' + u.name + '">' + u.name + '</option>';
            }).join('');

        select.innerHTML = optionsHtml;
    }

    function renderRankingGeralMaTable() {
        var tbody = document.getElementById('ranking-geral-ma-table-body');
        if (!tbody) return;

        var activeYear = global.currentIdebYear || 2025;
        var prevYear = getPreviousCycleYear(activeYear);
        var activeStage = global.currentIdebStage || 'Anos Iniciais';

        var currKey = 'y' + activeYear;
        var prevKey = 'y' + prevYear;

        var queryInput = document.getElementById('ranking-ma-search-input');
        var query = queryInput ? normalizeStr(queryInput.value) : '';
        var ureFilter = document.getElementById('ranking-ma-ure-filter') ? document.getElementById('ranking-ma-ure-filter').value : 'all';

        var db = getMaranhaoMunicipiosDb();
        var rawList = (activeStage === 'Anos Finais') ? db.finais : db.iniciais;

        var validList = (Array.isArray(rawList) ? rawList : []).filter(function(c) {
            if (!c || !c.municipio) return false;
            var name = normalizeStr(c.municipio);
            return !name.includes('municipio') && !name.includes('codigo');
        });

        validList.sort(function(a, b) {
            var valA = (a[currKey] !== null && a[currKey] !== undefined && a[currKey] >= 0 && a[currKey] <= 10) ? a[currKey] : -1;
            var valB = (b[currKey] !== null && b[currKey] !== undefined && b[currKey] >= 0 && b[currKey] <= 10) ? b[currKey] : -1;
            return valB - valA;
        });

        var filtered = validList.filter(function(c) {
            var ure = c.ure || getUreForCity(c.municipio);
            if (ureFilter !== 'all' && ure !== ureFilter) return false;
            if (query) {
                var full = normalizeStr(c.municipio + ' ' + ure);
                if (!full.includes(query)) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="padding:24px; text-align:center; color:var(--color-text-secondary);">Nenhum município encontrado para os filtros selecionados.</td></tr>';
            return;
        }

        var cycles = [2015, 2017, 2019, 2021, 2023, 2025];

        tbody.innerHTML = filtered.map(function(c, idx) {
            var rawCurr = (c[currKey] !== null && c[currKey] !== undefined && c[currKey] >= 0 && c[currKey] <= 10) ? c[currKey] : null;
            var rawPrev = (activeYear === 2015) ? null : ((c[prevKey] !== null && c[prevKey] !== undefined && c[prevKey] >= 0 && c[prevKey] <= 10) ? c[prevKey] : null);

            var displayCurr = rawCurr !== null ? Number(rawCurr).toFixed(1) : '—';
            var displayPrev = rawPrev !== null ? Number(rawPrev).toFixed(1) : (activeYear === 2015 ? 'Base' : '—');

            var diffBadge = '—';
            if (activeYear === 2015) {
                diffBadge = '<span class="badge badge-neutral" style="font-size:0.68rem;">Base 2015</span>';
            } else if (rawCurr !== null && rawPrev !== null) {
                var diff = Number((rawCurr - rawPrev).toFixed(1));
                if (diff > 0) diffBadge = '<span style="color:#10b981; font-weight:800; font-size:0.8rem;">+' + diff + ' ↑</span>';
                else if (diff < 0) diffBadge = '<span style="color:#ef4444; font-weight:800; font-size:0.8rem;">' + diff + ' ↓</span>';
                else diffBadge = '<span style="color:var(--color-text-secondary); font-weight:700; font-size:0.8rem;">= 0.0</span>';
            }

            var isGD = normalizeStr(c.municipio) === 'goncalves dias';
            var ureName = c.ure || getUreForCity(c.municipio);

            var miniChips = cycles.map(function(cyc) {
                var k = 'y' + cyc;
                var v = (c[k] !== null && c[k] !== undefined && c[k] >= 0 && c[k] <= 10) ? Number(c[k]).toFixed(1) : '-';
                var isCurrent = (cyc === activeYear);
                return '<span style="font-size:0.65rem; padding:1px 4px; border-radius:4px; ' + (isCurrent ? 'background:#6366f1; color:#fff; font-weight:800;' : 'background:var(--color-surface-subtle); color:var(--color-text-secondary); border:1px solid var(--color-border-subtle);') + '" title="' + cyc + ': ' + v + '">' + v + '</span>';
            }).join(' ');

            return [
                '<tr style="border-bottom: 1px solid var(--color-border-subtle); height: 50px; ' + (isGD ? 'background: rgba(16, 185, 129, 0.08);' : '') + '">',
                '    <td style="padding: 10px 14px; font-weight: 800; color: ' + (idx < 3 ? '#f59e0b' : 'var(--color-text-secondary)') + '; font-family: var(--font-display); font-variant-numeric: tabular-nums;">',
                '        #' + (idx + 1) + ' ' + (idx === 0 ? '👑' : '') + '',
                '    </td>',
                '    <td style="padding: 10px 14px; font-weight: 700; color: ' + (isGD ? '#10b981' : 'var(--color-brand-primary)') + ';">',
                '        <a href="javascript:void(0)" onclick="selectCityFromUre(\'' + (c.municipio||'').replace(/'/g, "\\'") + '\')" style="color:inherit; text-decoration:none;">',
                '            ' + c.municipio + ' ' + (isGD ? '⭐ (Sua Rede)' : '') + '',
                '        </a>',
                '    </td>',
                '    <td style="padding: 10px 14px; font-size: 0.8rem; color: var(--color-text-secondary);">' + ureName + '</td>',
                '    <td style="padding: 10px 14px; text-align: center; font-size: 0.85rem; font-family: var(--font-display); font-variant-numeric: tabular-nums;">' + displayPrev + '</td>',
                '    <td style="padding: 10px 14px; text-align: center; font-weight: 800; font-size: 0.95rem; color: #10b981; font-family: var(--font-display); font-variant-numeric: tabular-nums;">' + displayCurr + '</td>',
                '    <td style="padding: 10px 14px; text-align: center;">' + diffBadge + '</td>',
                '    <td style="padding: 10px 14px; text-align: center;">',
                '        <span class="badge ' + (rawCurr !== null && rawCurr >= 5.0 ? 'badge-success' : 'badge-warning') + '" style="font-size: 0.68rem;">',
                '            ' + (rawCurr !== null && rawCurr >= 5.0 ? 'Alto Desempenho 🟢' : 'Em Desenvolvimento 🟡') + '',
                '        </span>',
                '    </td>',
                '    <td style="padding: 10px 14px; text-align: center; white-space: nowrap;">',
                '        <div style="display:inline-flex; gap:2px; align-items:center;">' + miniChips + '</div>',
                '    </td>',
                '</tr>'
            ].join('\n');
        }).join('\n');
    }

    // Exposição Global
    global.getOfficial19UresList = getOfficial19UresList;
    global.getUreForCity = getUreForCity;
    global.getOfficialExcelCityData = getOfficialExcelCityData;
    global.getMaranhaoCityIdebData = getMaranhaoCityIdebData;
    global.toggleUreSortOrder = toggleUreSortOrder;
    global.selectCityFromUre = selectCityFromUre;
    global.render19UresPanel = render19UresPanel;
    global.filterUresList = render19UresPanel;
    global.populateRankingMaUreFilter = populateRankingMaUreFilter;
    global.renderRankingGeralMaTable = renderRankingGeralMaTable;
    global.filterRankingMaTable = renderRankingGeralMaTable;

})(typeof window !== 'undefined' ? window : this);
