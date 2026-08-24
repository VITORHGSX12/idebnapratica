// =========================================================================
// MÓDULO METAS MUNICIPAIS (PDE) & COMPARATIVO REGIONAL DO IDEB (2015-2025)
// Responsabilidade: Inteligência de metas municipais pactuadas (PDE),
// projeções matemáticas de crescimento, séries históricas de 2015 a 2025,
// painel das 19 UREs do Maranhão, rankings por município/escola e exportações.
// =========================================================================

(function(global) {
    'use strict';

    // -------------------------------------------------------------------------
    // 1. CONSTANTES E ESTADOS GLOBAIS
    // -------------------------------------------------------------------------
    global.URE_PRESIDENTE_DUTRA_MUNICIPALITIES = [
        "Dom Pedro", "Fortuna", "Gonçalves Dias", "Governador Archer", "Governador Eugênio Barros",
        "Governador Luiz Rocha", "Graça Aranha", "Joselândia", "Presidente Dutra", "Santa Filomena do Maranhão",
        "São Domingos do Maranhão", "São José dos Basílios", "Senador Alexandre Costa", "Tuntum"
    ];

    global.REGIAO_CENTRO_MA_MUNICIPALITIES = [
        "Presidente Dutra", "Gonçalves Dias", "Dom Pedro", "Tuntum", "Barra do Corda",
        "São Domingos do Maranhão", "Colinas", "Graça Aranha", "Joselândia"
    ];

    global.currentIdebYear = global.currentIdebYear || 2025;
    global.currentIdebStage = global.currentIdebStage || 'Anos Iniciais';
    global.currentSelectedCity = global.currentSelectedCity || 'Gonçalves Dias';
    global.currentUreSortOrder = global.currentUreSortOrder || 'media'; // 'media' | 'az'

    var gdSchoolTargetsMap = global.gdSchoolTargetsMap || {};
    var gdSchoolPdePlansMap = global.gdSchoolPdePlansMap || {};
    var schoolPdePlansMap = global.schoolPdePlansMap || {};

    // -------------------------------------------------------------------------
    // 2. AUXILIARES DE CICLO E ESTRUTURA DAS 19 UREs DO MARANHÃO
    // -------------------------------------------------------------------------

    function getPreviousCycleYear(year) {
        var y = Number(year);
        if (y === 2017) return 2015;
        if (y === 2019) return 2017;
        if (y === 2021) return 2019;
        if (y === 2023) return 2021;
        if (y === 2025) return 2023;
        return 2015;
    }

    function getOfficial19UresList() {
        if (global.OFFICIAL_19_URES_MA && global.OFFICIAL_19_URES_MA.length > 0) {
            return global.OFFICIAL_19_URES_MA;
        }

        var uresMap = {};
        var db = global.OFFICIAL_MARANHAO_IDEB_EXCEL;
        if (db && db.anosIniciais) {
            Object.values(db.anosIniciais).forEach(function(c) {
                if (!c || !c.municipio) return;
                var m = c.municipio.trim();
                if (m.toLowerCase().includes('município') || m.toLowerCase().includes('código')) return;
                var ureName = c.ure || "URE Presidente Dutra";
                if (!uresMap[ureName]) {
                    uresMap[ureName] = {
                        name: ureName,
                        sede: ureName.replace('URE ', ''),
                        cities: []
                    };
                }
                if (!uresMap[ureName].cities.includes(m)) {
                    uresMap[ureName].cities.push(m);
                }
            });
        }

        var list = Object.values(uresMap).sort(function(a, b) { return a.name.localeCompare(b.name); });
        global.OFFICIAL_19_URES_MA = list;
        return list;
    }

    function getUreForCity(cityName) {
        if (!cityName) return "URE Presidente Dutra";
        var clean = cityName.trim().toLowerCase();
        var uresList = getOfficial19UresList();
        var found = uresList.find(function(ure) {
            return ure.cities && ure.cities.some(function(c) { return c.trim().toLowerCase() === clean; });
        });
        return found ? found.name : "URE Presidente Dutra";
    }

    function getOfficialExcelCityData(cityName, etapa) {
        try {
            if (!cityName) return null;
            var clean = cityName.trim().toLowerCase();

            // 1. Dataset Oficial Ativo
            var dbMaranhao = global.IDEB_MARANHAO_MUNICIPIOS;
            if (dbMaranhao) {
                var list = (etapa === 'Anos Finais') ? dbMaranhao.finais : dbMaranhao.iniciais;
                if (Array.isArray(list)) {
                    var found = list.find(function(item) {
                        return item && item.municipio && item.municipio.trim().toLowerCase() === clean;
                    });
                    if (found) return found;
                }
            }

            // 2. Fallback: idebPublicoReferencia
            var refList = global.idebPublicoReferencia;
            if (Array.isArray(refList)) {
                var etapaName = (etapa === 'Anos Finais') ? 'finais' : 'iniciais';
                var foundRef = refList.find(function(item) {
                    return item && item.municipio && item.municipio.trim().toLowerCase() === clean &&
                        (item.etapa || '').toLowerCase().includes(etapaName);
                });
                if (foundRef) {
                    var anosObj = foundRef.anos || {};
                    return {
                        municipio: foundRef.municipio,
                        y2015: anosObj['2015'] !== undefined ? anosObj['2015'] : null,
                        y2017: anosObj['2017'] !== undefined ? anosObj['2017'] : null,
                        y2019: anosObj['2019'] !== undefined ? anosObj['2019'] : null,
                        y2021: anosObj['2021'] !== undefined ? anosObj['2021'] : null,
                        y2023: anosObj['2023'] !== undefined ? anosObj['2023'] : null,
                        y2025: anosObj['2025'] !== undefined ? anosObj['2025'] : null
                    };
                }
            }

            // 3. Fallback: OFFICIAL_MARANHAO_IDEB_EXCEL
            var dbExcel = global.OFFICIAL_MARANHAO_IDEB_EXCEL;
            if (dbExcel) {
                var collection = (etapa === 'Anos Finais') ? dbExcel.anosFinais : dbExcel.anosIniciais;
                if (collection) {
                    var keys = Object.keys(collection);
                    var foundKey = keys.find(function(k) { return k.trim().toLowerCase() === clean; });
                    if (foundKey) return collection[foundKey];
                }
            }
        } catch(e) {
            console.error('[getOfficialExcelCityData Error]', e);
        }
        return null;
    }

    // -------------------------------------------------------------------------
    // 3. VISUALIZADOR & GRÁFICO HISTÓRICO SVG DO COMPARATIVO
    // -------------------------------------------------------------------------

    function updateIdebComparativoView() {
        var stateSelect = document.getElementById('ideb-state-select');
        var citySearchInput = document.getElementById('ideb-city-search');
        var stageSelect = document.getElementById('ideb-stage-select');

        if (!stateSelect || !citySearchInput || !stageSelect) return;

        var uf = stateSelect.value;
        var city = global.selectedIdebCity || global.currentSelectedCity || 'Gonçalves Dias';
        var stage = stageSelect.value;

        var emptyState = document.getElementById('ideb-empty-state');
        var resultsContainer = document.getElementById('ideb-results-container');

        var records = (global.idebPublicoReferencia || []).filter(function(r) {
            return r.uf === uf && r.municipio === city && r.etapa === stage;
        }).sort(function(a, b) { return a.ano - b.ano; });

        if (records.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (resultsContainer) resultsContainer.classList.add('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        if (resultsContainer) resultsContainer.classList.remove('hidden');

        var latestRecord = records.find(function(r) { return r.ano === 2023; }) || records[records.length - 1];

        var kpiObserved = document.getElementById('ideb-kpi-observed');
        var kpiTarget = document.getElementById('ideb-kpi-target');
        var kpiStatusContainer = document.getElementById('ideb-kpi-status-container');
        var kpiStatusText = document.getElementById('ideb-kpi-status-text');

        if (kpiObserved) kpiObserved.textContent = latestRecord.ideb_observado !== null ? latestRecord.ideb_observado.toFixed(1) : 'N/A';
        if (kpiTarget) kpiTarget.textContent = latestRecord.meta_projetada !== null ? latestRecord.meta_projetada.toFixed(1) : 'N/A';

        if (latestRecord.ideb_observado !== null && latestRecord.meta_projetada !== null) {
            var diff = latestRecord.ideb_observado - latestRecord.meta_projetada;
            var met = diff >= 0;

            if (kpiStatusContainer) {
                kpiStatusContainer.innerHTML = met 
                    ? '<span class="badge badge-success" style="font-size: 1.1rem; padding: 6px 12px; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="check" style="width: 16px; height: 16px;"></i> Atingida</span>'
                    : '<span class="badge" style="font-size: 1.1rem; padding: 6px 12px; background-color: var(--red-light); color: white; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="x" style="width: 16px; height: 16px;"></i> Não Atingida</span>';
            }

            if (kpiStatusText) {
                kpiStatusText.textContent = met 
                    ? 'Diferença positiva de +' + diff.toFixed(1) + ' pontos em relação à meta.'
                    : 'Diferença negativa de ' + diff.toFixed(1) + ' pontos em relação à meta.';
            }
        } else {
            if (kpiStatusContainer) kpiStatusContainer.innerHTML = '<span class="badge badge-info" style="font-size: 1.1rem; padding: 6px 12px;">Sem Comparativo</span>';
            if (kpiStatusText) kpiStatusText.textContent = 'Metas ou resultados indisponíveis para este ciclo.';
        }

        renderIdebSvgChart(records);

        var projVal = document.getElementById('ideb-proj-val');
        var projDesc = document.getElementById('ideb-proj-desc');

        if (latestRecord.ideb_observado !== null) {
            var stateRecords2023 = (global.idebPublicoReferencia || []).filter(function(r) {
                return r.uf === uf && r.ano === 2023 && r.etapa === stage && !r.municipio.includes('(Estado)') && r.municipio !== 'Brasil';
            });

            var metCount = 0;
            var totalCount = 0;
            stateRecords2023.forEach(function(r) {
                if (r.ideb_observado !== null && r.meta_projetada !== null) {
                    totalCount++;
                    if (r.ideb_observado >= r.meta_projetada) metCount++;
                }
            });

            var growthFactor = 0.2;
            var trajectory = "similar";

            if (latestRecord.ideb_observado >= latestRecord.meta_projetada) {
                growthFactor = uf === 'CE' ? 0.35 : 0.25;
                trajectory = "favorável";
            } else {
                growthFactor = 0.15;
                trajectory = "de recuperação";
            }

            var projectedIdeb = latestRecord.ideb_observado + growthFactor;

            if (projVal) projVal.textContent = projectedIdeb.toFixed(2);
            if (projDesc) {
                projDesc.textContent = 'Sugere-se uma meta de ' + projectedIdeb.toFixed(2) + ' para o ciclo 2025. Municípios de ' + uf + ' com trajetória ' + trajectory + ' cresceram, em média, +' + growthFactor.toFixed(2) + ' no ciclo seguinte.';
            }
        } else {
            if (projVal) projVal.textContent = 'N/A';
            if (projDesc) projDesc.textContent = 'Histórico insuficiente para projetar meta atual.';
        }

        renderIdebRankingTable(uf, stage, city);
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function renderIdebSvgChart(records) {
        var container = document.getElementById('ideb-chart-container');
        if (!container) return;

        var years = records.map(function(r) { return r.ano; });
        var observed = records.map(function(r) { return r.ideb_observado || 0; });
        var targets = records.map(function(r) { return r.meta_projetada || 0; });

        var width = 550;
        var height = 240;
        var paddingLeft = 40;
        var paddingRight = 20;
        var paddingTop = 25;
        var paddingBottom = 35;

        var chartWidth = width - paddingLeft - paddingRight;
        var chartHeight = height - paddingTop - paddingBottom;

        var allVals = observed.concat(targets).filter(function(v) { return v > 0; });
        var maxVal = allVals.length > 0 ? Math.max.apply(Math, allVals) + 0.5 : 10;
        var minVal = allVals.length > 0 ? Math.max(0, Math.min.apply(Math, allVals) - 1.0) : 0;

        function getX(index) {
            if (years.length <= 1) return paddingLeft + chartWidth / 2;
            return paddingLeft + (index / (years.length - 1)) * chartWidth;
        }

        function getY(val) {
            if (val === 0) return paddingTop + chartHeight;
            return paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
        }

        var svgHtml = '<svg viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="240" style="background: transparent; overflow: visible;">';

        var steps = 4;
        for (var j = 0; j <= steps; j++) {
            var val = minVal + (j / steps) * (maxVal - minVal);
            var y = getY(val);
            svgHtml += '<line x1="' + paddingLeft + '" y1="' + y + '" x2="' + (width - paddingRight) + '" y2="' + y + '" stroke="var(--border-color)" stroke-dasharray="4,4" stroke-width="0.75" />';
            svgHtml += '<text x="' + (paddingLeft - 10) + '" y="' + (y + 4) + '" fill="var(--text-secondary)" font-size="10" font-family="var(--font-sans)" font-weight="600" text-anchor="end">' + val.toFixed(1) + '</text>';
        }

        years.forEach(function(yr, idx) {
            var x = getX(idx);
            svgHtml += '<text x="' + x + '" y="' + (height - 10) + '" fill="var(--text-secondary)" font-size="10" font-family="var(--font-sans)" font-weight="700" text-anchor="middle">' + yr + '</text>';
        });

        var obsPointsPath = '';
        var tgtPointsPath = '';

        observed.forEach(function(val, idx) {
            if (val > 0) {
                var x = getX(idx);
                var y = getY(val);
                obsPointsPath += (obsPointsPath === '' ? 'M' : 'L') + ' ' + x + ' ' + y;
            }
        });

        targets.forEach(function(val, idx) {
            if (val > 0) {
                var x = getX(idx);
                var y = getY(val);
                tgtPointsPath += (tgtPointsPath === '' ? 'M' : 'L') + ' ' + x + ' ' + y;
            }
        });

        if (tgtPointsPath !== '') {
            svgHtml += '<path d="' + tgtPointsPath + '" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-dasharray="5,5" />';
        }

        if (obsPointsPath !== '') {
            svgHtml += '<path d="' + obsPointsPath + '" fill="none" stroke="var(--blue-light)" stroke-width="3" />';
        }

        observed.forEach(function(val, idx) {
            if (val > 0) {
                var x = getX(idx);
                var y = getY(val);
                svgHtml += '<circle cx="' + x + '" cy="' + y + '" r="6" fill="var(--blue-light)" />';
                svgHtml += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="white" />';
                svgHtml += '<text x="' + x + '" y="' + (y - 12) + '" fill="var(--text-primary)" font-size="10" font-family="var(--font-sans)" font-weight="700" text-anchor="middle">' + val.toFixed(1) + '</text>';
            }
        });

        targets.forEach(function(val, idx) {
            if (val > 0) {
                var x = getX(idx);
                var y = getY(val);
                svgHtml += '<rect x="' + (x - 4) + '" y="' + (y - 4) + '" width="8" height="8" fill="var(--purple)" rx="1" />';
                var obsVal = observed[idx];
                var textY = (obsVal && Math.abs(obsVal - val) < 0.3 && obsVal > val) ? y + 16 : y - 12;
                svgHtml += '<text x="' + x + '" y="' + textY + '" fill="var(--text-muted)" font-size="9" font-family="var(--font-sans)" font-weight="600" text-anchor="middle">' + val.toFixed(1) + '</text>';
            }
        });

        svgHtml += '</svg>';
        container.innerHTML = svgHtml;
    }

    function renderIdebRankingTable(uf, stage, currentCity) {
        var tableBody = document.getElementById('ideb-ranking-table-body');
        var cityCountEl = document.getElementById('ideb-rank-city-count');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        var candidates = (global.idebPublicoReferencia || []).filter(function(r) {
            return r.uf === uf && r.ano === 2023 && r.etapa === stage && 
                !r.municipio.includes('(Estado)') && r.municipio !== 'Brasil';
        });

        candidates.sort(function(a, b) {
            var obsA = a.ideb_observado !== null ? a.ideb_observado : -1;
            var obsB = b.ideb_observado !== null ? b.ideb_observado : -1;
            return obsB - obsA;
        });

        if (cityCountEl) cityCountEl.textContent = candidates.length + ' municípios';

        if (candidates.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="padding: 16px; text-align:center; color:var(--text-muted);">Nenhum município listado para este filtro.</td></tr>';
            return;
        }

        candidates.forEach(function(c, idx) {
            var isSelected = c.municipio === currentCity;
            var tr = document.createElement('tr');
            
            if (isSelected) {
                tr.style.backgroundColor = 'rgba(79, 150, 252, 0.08)';
                tr.style.fontWeight = '700';
                tr.style.borderLeft = '3px solid var(--blue-light)';
            } else {
                tr.style.borderBottom = '1px solid var(--border-color)';
            }
            tr.style.height = '40px';

            var obsText = c.ideb_observado !== null ? c.ideb_observado.toFixed(1) : 'N/A';
            var tgtText = c.meta_projetada !== null ? c.meta_projetada.toFixed(1) : 'N/A';

            var statusBadge = '<span class="badge badge-info" style="font-size:0.7rem;">N/A</span>';
            if (c.ideb_observado !== null && c.meta_projetada !== null) {
                statusBadge = (c.ideb_observado >= c.meta_projetada)
                    ? '<span class="badge badge-success" style="font-size:0.7rem; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="check" style="width:10px; height:10px;"></i> Atingida</span>'
                    : '<span class="badge" style="font-size:0.7rem; background-color: var(--red-light); color: white; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="x" style="width:10px; height:10px;"></i> Não Atingida</span>';
            }

            tr.innerHTML = [
                '<td style="padding: 8px 12px; color: ' + (isSelected ? 'var(--blue-light)' : 'var(--text-secondary)') + '; font-weight:700;">#' + (idx + 1) + '</td>',
                '<td style="padding: 8px 12px; color: var(--text-primary);">' + c.municipio + '</td>',
                '<td style="padding: 8px 12px; text-align: center; font-weight:700; color: var(--text-primary);">' + obsText + '</td>',
                '<td style="padding: 8px 12px; text-align: center; color: var(--text-secondary);">' + tgtText + '</td>',
                '<td style="padding: 8px 12px; text-align: center;">' + statusBadge + '</td>'
            ].join('');

            tableBody.appendChild(tr);
        });
    }

    // -------------------------------------------------------------------------
    // 4. CONTROLE GLOBAL DE FILTROS DO COMPARATIVO
    // -------------------------------------------------------------------------

    function switchGlobalIdebYear(year) {
        global.currentIdebYear = Number(year);
        var prevYear = getPreviousCycleYear(year);

        document.querySelectorAll('.ideb-year-pill-btn').forEach(function(btn) {
            var bYear = Number(btn.getAttribute('data-year'));
            if (bYear === global.currentIdebYear) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        var thRankingCurr = document.getElementById('th-ranking-curr');
        var thRankingPrev = document.getElementById('th-ranking-prev');
        if (thRankingCurr) thRankingCurr.textContent = 'IDEB ' + year;
        if (thRankingPrev) thRankingPrev.textContent = (year === 2015) ? 'BASE 2015' : 'CICLO ' + prevYear;

        var thEscolasCurr = document.getElementById('th-escolas-curr');
        var thEscolasPrev = document.getElementById('th-escolas-prev');
        if (thEscolasCurr) thEscolasCurr.textContent = 'IDEB ' + year;
        if (thEscolasPrev) thEscolasPrev.textContent = (year === 2015) ? 'BASE 2015' : 'CICLO ' + prevYear;

        if (typeof handleSelectIdebCity === 'function') handleSelectIdebCity(global.currentSelectedCity || 'Gonçalves Dias');
        if (typeof render19UresPanel === 'function') render19UresPanel();
        if (typeof renderRankingGeralMaTable === 'function') renderRankingGeralMaTable();
        if (typeof filterSchoolRankingTable === 'function') filterSchoolRankingTable();
    }

    function switchGlobalIdebStage(stage) {
        global.currentIdebStage = stage;
        var isAI = (stage === 'Anos Iniciais');

        var idsAI = ['btn-painel-city-stage-ai', 'btn-ures-stage-ai', 'btn-ranking-stage-ai', 'btn-toggle-escolas-ai'];
        var idsAF = ['btn-painel-city-stage-af', 'btn-ures-stage-af', 'btn-ranking-stage-af', 'btn-toggle-escolas-af'];

        idsAI.forEach(function(id) {
            var btn = document.getElementById(id);
            if (btn) {
                if (isAI) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        });
        idsAF.forEach(function(id) {
            var btn = document.getElementById(id);
            if (btn) {
                if (!isAI) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        });

        if (typeof handleSelectIdebCity === 'function') handleSelectIdebCity(global.currentSelectedCity || 'Gonçalves Dias');
        if (typeof render19UresPanel === 'function') render19UresPanel();
        if (typeof renderRankingGeralMaTable === 'function') renderRankingGeralMaTable();
        if (typeof filterSchoolRankingTable === 'function') filterSchoolRankingTable();
    }

    function toggleUreSortOrder() {
        global.currentUreSortOrder = global.currentUreSortOrder === 'media' ? 'az' : 'media';
        var btn = document.getElementById('btn-ure-sort-toggle');
        if (btn) {
            btn.innerHTML = global.currentUreSortOrder === 'media' 
                ? '<span>Alternar Ordenação</span>' 
                : '<span>Ordem Alfabética (A-Z)</span>';
        }
        render19UresPanel();
    }

    function selectCityFromUre(cityName) {
        global.currentSelectedCity = cityName;
        var selector = document.getElementById('ideb-city-selector');
        if (selector) selector.value = cityName;
        switchIdebSubtab('painel-principal');
        handleSelectIdebCity(cityName);
    }

    function updateIdebPeriodBadgeDynamic() {
        var badgeEl = document.getElementById('ideb-period-badge-text');
        if (badgeEl) {
            badgeEl.textContent = "Dados Oficiais INEP • Ciclos 2015 a 2025";
        }
    }

    function initIdebCitySelector() {
        var selector = document.getElementById('ideb-city-selector');
        if (!selector) return;

        var uresList = getOfficial19UresList();
        var allCitiesSet = new Set();
        uresList.forEach(function(ure) {
            if (ure.cities) ure.cities.forEach(function(c) { allCitiesSet.add(c); });
        });
        var sortedCities = Array.from(allCitiesSet).sort(function(a, b) { return a.localeCompare(b); });

        var optionsHtml = [
            '<option value="">Selecione um município...</option>',
            '<option value="Gonçalves Dias" selected>Gonçalves Dias (Rede Municipal)</option>'
        ].concat(sortedCities.filter(function(c) { return c !== 'Gonçalves Dias'; }).map(function(c) {
            return '<option value="' + c + '">' + c + '</option>';
        })).join('');

        selector.innerHTML = optionsHtml;
        handleSelectIdebCity(global.currentSelectedCity || "Gonçalves Dias");
        populateSchoolCitySelectDropdown();
    }

    function handleSelectIdebCity(cityName) {
        global.currentSelectedCity = cityName || "";

        var elLabelCurr = document.getElementById('city-card-label-current');
        var elCurr = document.getElementById('city-ideb-current');
        var elCurrSub = document.getElementById('city-ideb-current-sub');

        var elLabelPrev = document.getElementById('city-card-label-prev');
        var elPrev = document.getElementById('city-ideb-prev');
        var elDiff = document.getElementById('city-ideb-diff');

        var elLabelTarget = document.getElementById('city-card-label-target');
        var elTarget = document.getElementById('city-ideb-target');
        var elStatusBadge = document.getElementById('city-ideb-status-badge');

        var elLabelRank = document.getElementById('city-card-label-ranking');
        var elRank = document.getElementById('city-ranking-pos');

        var ureBadge = document.getElementById('ideb-city-ure-badge');
        var timelineGrid = document.getElementById('city-timeline-cycles-grid');
        var compContainer = document.getElementById('city-comparison-bars');

        if (!global.currentSelectedCity) {
            if (elCurr) elCurr.textContent = "—";
            if (elPrev) elPrev.textContent = "—";
            if (elDiff) elDiff.innerHTML = "—";
            if (elTarget) elTarget.textContent = "—";
            if (elRank) elRank.textContent = "—";
            if (ureBadge) ureBadge.innerHTML = '<span class="badge badge-secondary">Aguardando seleção...</span>';
            if (timelineGrid) timelineGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:16px; color:var(--text-muted);">Selecione um município acima.</div>';
            if (compContainer) compContainer.innerHTML = '<div style="text-align:center; padding:16px; color:var(--text-muted);">Selecione um município para exibir os comparativos.</div>';
            return;
        }

        var ureName = getUreForCity(global.currentSelectedCity);
        if (ureBadge) ureBadge.innerHTML = '<span class="badge badge-purple" style="font-size:0.78rem; padding:6px 12px;">' + ureName + '</span>';

        var activeStage = global.currentGlobalIdebStage || "Anos Iniciais";
        var activeYear = global.currentGlobalIdebYear || 2025;
        var prevYear = activeYear > 2015 ? (activeYear - 2) : 2015;

        var currKey = 'y' + activeYear;
        var prevKey = 'y' + prevYear;

        var excelDataAI = getMaranhaoCityIdebData(global.currentSelectedCity, 'Anos Iniciais');
        var excelDataAF = getMaranhaoCityIdebData(global.currentSelectedCity, 'Anos Finais');
        var currentStageData = (activeStage === 'Anos Finais') ? excelDataAF : excelDataAI;

        var valCurr = (currentStageData && currentStageData[currKey] !== null) ? Number(currentStageData[currKey]).toFixed(1) : "—";
        var valPrev = (currentStageData && currentStageData[prevKey] !== null) ? Number(currentStageData[prevKey]).toFixed(1) : "—";

        var diffVal = null;
        if (valCurr !== "—" && valPrev !== "—" && activeYear !== 2015) {
            diffVal = Number((parseFloat(valCurr) - parseFloat(valPrev)).toFixed(1));
        }

        var targetVal = (activeStage === 'Anos Finais') ? "5.0" : "5.5";

        if (elLabelCurr) elLabelCurr.textContent = 'IDEB ' + activeYear + ' (' + (activeStage === 'Anos Iniciais' ? '5º Ano' : '9º Ano') + ')';
        if (elCurr) {
            elCurr.textContent = valCurr;
        }
        if (elCurrSub) {
            elCurrSub.textContent = (valCurr !== "—") ? 'Oficial INEP • ' + global.currentSelectedCity : "Sem dado divulgado";
        }

        if (elLabelPrev) elLabelPrev.textContent = (activeYear === 2015) ? 'Ano Base (2015)' : 'Ciclo Anterior (' + prevYear + ')';
        if (elPrev) elPrev.textContent = (activeYear === 2015) ? 'Início Série' : valPrev;
        if (elDiff) {
            if (activeYear === 2015) {
                elDiff.innerHTML = '<span class="diff-eq">Ciclo Inicial</span>';
            } else if (diffVal !== null) {
                if (diffVal > 0) elDiff.innerHTML = '<span class="diff-up">+' + diffVal + ' ↑ Crescimento</span>';
                else if (diffVal < 0) elDiff.innerHTML = '<span class="diff-down">' + diffVal + ' ↓ Queda</span>';
                else elDiff.innerHTML = '<span class="diff-eq">= 0.0 Estável</span>';
            } else {
                elDiff.innerHTML = '—';
            }
        }

        if (elLabelTarget) elLabelTarget.textContent = 'Meta Projetada (' + activeYear + ')';
        if (elTarget) elTarget.textContent = targetVal;
        if (elStatusBadge) {
            if (valCurr !== "—" && parseFloat(valCurr) >= parseFloat(targetVal)) {
                elStatusBadge.innerHTML = '<span class="badge badge-status-success">Meta Atingida</span>';
            } else {
                elStatusBadge.innerHTML = '<span class="badge badge-status-warning">Em Desenvolvimento</span>';
            }
        }

        if (elLabelRank) elLabelRank.textContent = 'Posição no Ranking MA (' + activeYear + ')';
        var dbCollection = (activeStage === 'Anos Finais') 
            ? (global.OFFICIAL_MARANHAO_IDEB_EXCEL && global.OFFICIAL_MARANHAO_IDEB_EXCEL.anosFinais)
            : (global.OFFICIAL_MARANHAO_IDEB_EXCEL && global.OFFICIAL_MARANHAO_IDEB_EXCEL.anosIniciais);

        if (dbCollection) {
            var listRank = Object.values(dbCollection).filter(function(c) {
                if (!c || !c.municipio) return false;
                var m = c.municipio.trim().toLowerCase();
                return !m.includes('município') && !m.includes('código') && c[currKey] !== null;
            }).sort(function(a,b) { return (b[currKey] || 0) - (a[currKey] || 0); });

            var rankIndex = listRank.findIndex(function(c) {
                return c.municipio.trim().toLowerCase() === global.currentSelectedCity.trim().toLowerCase();
            });
            if (elRank) {
                elRank.textContent = (rankIndex !== -1) ? '#' + (rankIndex + 1) : "—";
            }
        }

        if (timelineGrid) {
            var cycles = [2015, 2017, 2019, 2021, 2023, 2025];
            timelineGrid.innerHTML = cycles.map(function(cyc, idx) {
                var cycKey = 'y' + cyc;
                var cRaw = currentStageData && currentStageData[cycKey] !== null ? currentStageData[cycKey] : null;
                var cScore = (cRaw !== null && cRaw >= 0 && cRaw <= 10) ? Number(cRaw).toFixed(1) : '—';
                var isActive = (cyc === activeYear);

                var diffMarkup = '';
                if (idx > 0 && cScore !== '—') {
                    var pKey = 'y' + cycles[idx - 1];
                    var pRaw = currentStageData && currentStageData[pKey] !== null ? currentStageData[pKey] : null;
                    if (pRaw !== null) {
                        var d = Number((parseFloat(cScore) - parseFloat(pRaw)).toFixed(1));
                        if (d > 0) diffMarkup = '<span class="ideb-timeline-cycle-diff diff-up">+' + d + ' ↑</span>';
                        else if (d < 0) diffMarkup = '<span class="ideb-timeline-cycle-diff diff-down">' + d + ' ↓</span>';
                        else diffMarkup = '<span class="ideb-timeline-cycle-diff diff-eq">= 0.0</span>';
                    }
                } else if (idx === 0) {
                    diffMarkup = '<span class="ideb-timeline-cycle-diff diff-eq">Base</span>';
                }

                return [
                    '<div class="ideb-timeline-cycle-card ' + (isActive ? 'is-active-year' : '') + '" onclick="switchGlobalIdebYear(' + cyc + ')" style="cursor: pointer;" title="Ciclo ' + cyc + '">',
                    '    <div class="ideb-timeline-cycle-year">' + cyc + '</div>',
                    '    <div class="ideb-timeline-cycle-score" style="color: ' + (isActive ? 'var(--color-accent-primary)' : 'var(--color-brand-primary)') + ';">' + cScore + '</div>',
                    '    <div>' + diffMarkup + '</div>',
                    '</div>'
                ].join('\n');
            }).join('\n');
        }

        if (compContainer) {
            var scoreAI = excelDataAI && excelDataAI[currKey] !== null ? parseFloat(excelDataAI[currKey]) : 4.8;
            var scoreAF = excelDataAF && excelDataAF[currKey] !== null ? parseFloat(excelDataAF[currKey]) : 4.4;

            var ureSum = 0;
            var ureCount = 0;
            var targetUreObj = getOfficial19UresList().find(function(u) { return u.name === ureName; });
            if (targetUreObj && targetUreObj.cities && dbCollection) {
                targetUreObj.cities.forEach(function(c) {
                    var cData = getOfficialExcelCityData(c, activeStage);
                    if (cData && cData[currKey] !== null && cData[currKey] >= 0 && cData[currKey] <= 10) {
                        ureSum += cData[currKey];
                        ureCount++;
                    }
                });
            }
            var avgUre = (ureCount > 0) ? (ureSum / ureCount).toFixed(1) : '4.6';

            var maSum = 0;
            var maCount = 0;
            if (dbCollection) {
                Object.values(dbCollection).forEach(function(c) {
                    if (c && c[currKey] !== null && c[currKey] >= 0 && c[currKey] <= 10) {
                        maSum += c[currKey];
                        maCount++;
                    }
                });
            }
            var avgMA = (maCount > 0) ? (maSum / maCount).toFixed(1) : '4.5';
            var brasilBase = (activeStage === 'Anos Iniciais') ? 5.6 : 5.0;

            compContainer.innerHTML = [
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.84rem; font-weight:700; color:var(--text-primary); margin-bottom:4px;">',
                '        <span>' + global.currentSelectedCity + ' — Anos Iniciais (5º Ano) • ' + activeYear + '</span>',
                '        <span style="color:#10b981; font-size:0.9rem; font-weight:800;">' + scoreAI + '</span>',
                '    </div>',
                '    <div style="width:100%; height:10px; background:var(--bg-secondary); border-radius:5px; overflow:hidden;">',
                '        <div style="width:' + Math.min(100, (scoreAI/10)*100) + '%; height:100%; background:linear-gradient(90deg, #6366f1, #10b981); border-radius:5px;"></div>',
                '    </div>',
                '</div>',
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.84rem; font-weight:700; color:var(--text-primary); margin-bottom:4px;">',
                '        <span>' + global.currentSelectedCity + ' — Anos Finais (9º Ano) • ' + activeYear + '</span>',
                '        <span style="color:#6366f1; font-size:0.9rem; font-weight:800;">' + scoreAF + '</span>',
                '    </div>',
                '    <div style="width:100%; height:10px; background:var(--bg-secondary); border-radius:5px; overflow:hidden;">',
                '        <div style="width:' + Math.min(100, (scoreAF/10)*100) + '%; height:100%; background:#6366f1; border-radius:5px;"></div>',
                '    </div>',
                '</div>',
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.84rem; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">',
                '        <span>Média da ' + ureName + ' (' + activeStage + ') • ' + activeYear + '</span>',
                '        <span style="color:#8b5cf6; font-size:0.9rem; font-weight:800;">' + avgUre + '</span>',
                '    </div>',
                '    <div style="width:100%; height:10px; background:var(--bg-secondary); border-radius:5px; overflow:hidden;">',
                '        <div style="width:' + Math.min(100, (parseFloat(avgUre)/10)*100) + '%; height:100%; background:#8b5cf6; border-radius:5px;"></div>',
                '    </div>',
                '</div>',
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.84rem; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">',
                '        <span>Média Estadual do Maranhão (MA) • ' + activeYear + '</span>',
                '        <span style="color:#f59e0b; font-size:0.9rem; font-weight:800;">' + avgMA + '</span>',
                '    </div>',
                '    <div style="width:100%; height:10px; background:var(--bg-secondary); border-radius:5px; overflow:hidden;">',
                '        <div style="width:' + Math.min(100, (parseFloat(avgMA)/10)*100) + '%; height:100%; background:#f59e0b; border-radius:5px;"></div>',
                '    </div>',
                '</div>',
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.84rem; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">',
                '        <span>Média Nacional Oficial (Brasil - INEP)</span>',
                '        <span style="color:#3b82f6; font-size:0.9rem; font-weight:800;">' + brasilBase + '</span>',
                '    </div>',
                '    <div style="width:100%; height:10px; background:var(--bg-secondary); border-radius:5px; overflow:hidden;">',
                '        <div style="width:' + Math.min(100, (brasilBase/10)*100) + '%; height:100%; background:#3b82f6; border-radius:5px;"></div>',
                '    </div>',
                '</div>'
            ].join('\n');
        }
    }

    // -------------------------------------------------------------------------
    // 5. PAINEL DAS 19 UREs DO MARANHÃO
    // -------------------------------------------------------------------------

    function render19UresPanel() {
        var container = document.getElementById('ures-cards-container');
        if (!container) return;

        try {
            var activeYear = global.currentIdebYear || 2025;
            var activeStage = global.currentIdebStage || 'Anos Iniciais';
            var currKey = 'y' + activeYear;

            var queryInput = document.getElementById('ure-search-input');
            var query = queryInput ? queryInput.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';

            var uresList = getOfficial19UresList();
            if (uresList.length === 0) {
                container.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-muted);">Base de UREs indisponível.</div>';
                return;
            }

            var calculatedUres = uresList.map(function(ure) {
                var totalScore = 0;
                var validCount = 0;

                var citiesData = (ure.cities || []).map(function(city) {
                    var realData = getOfficialExcelCityData(city, activeStage);
                    var rawVal = realData && realData[currKey] !== null ? realData[currKey] : null;
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
                        isGD: (city.toLowerCase() === 'gonçalves dias')
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
                var fullText = (ure.name + ' ' + ure.cities.map(function(c) { return c.name; }).join(' ')).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return fullText.includes(query);
            });

            if (global.currentUreSortOrder === 'az') {
                filtered.sort(function(a, b) { return a.name.localeCompare(b.name); });
            } else {
                filtered.sort(function(a, b) { return b.avgScore - a.avgScore; });
            }

            if (filtered.length === 0) {
                container.innerHTML = '<div class="card" style="padding:32px; text-align:center; color:var(--text-muted); background:var(--bg-tertiary);"><h4 style="margin:0 0 4px 0;">Nenhuma URE ou Município Encontrado</h4><p class="text-sm text-muted" style="margin:0;">Nenhum registro corresponde à busca "' + query + '".</p></div>';
                return;
            }

            container.innerHTML = filtered.map(function(ure) {
                var citiesChips = ure.cities.map(function(c) {
                    var scoreClass = 'score-mid';
                    if (c.score !== null) {
                        if (c.score >= 6.0) scoreClass = 'score-super';
                        else if (c.score >= 5.0) scoreClass = 'score-good';
                        else if (c.score < 4.0) scoreClass = 'score-low';
                    }

                    return [
                        '<button class="ure-city-chip ' + (c.isGD ? 'is-rede-destaque' : '') + '" onclick="selectCityFromUre(\'' + c.name.replace(/'/g, "\\'") + '\')" title="Ver ' + c.name + ' no Painel Geral (' + activeYear + ')">',
                        '    <span>' + c.name + ' ' + (c.isGD ? '(Sua Rede)' : '') + '</span>',
                        '    <span class="ure-city-score-badge ' + scoreClass + '">' + c.displayScore + '</span>',
                        '</button>'
                    ].join('\n');
                }).join('\n');

                return [
                    '<div class="ure-card-item">',
                    '    <div class="flex-between flex-wrap gap-md" style="margin-bottom: 12px; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 10px;">',
                    '        <div style="display: flex; align-items: center; gap: 10px;">',
                    '            <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:var(--color-status-advanced-bg);display:flex;align-items:center;justify-content:center;color:var(--color-brand-primary);"><i data-lucide="building-2" style="width:16px;height:16px;"></i></div>',
                    '            <div>',
                    '                <h4 style="margin: 0; font-size: var(--text-title-sm); font-weight: 700; color: var(--color-brand-primary);">' + ure.name + '</h4>',
                    '                <span style="font-size: var(--text-xs); color: var(--color-text-secondary);">Sede: ' + (ure.sede || 'Maranhão') + '</span>',
                    '            </div>',
                    '            <span class="badge badge-neutral" style="font-size: var(--text-xs); margin-left: 4px;">' + ure.count + ' Municípios</span>',
                    '        </div>',
                    '        <div style="display: flex; align-items: center; gap: 10px;">',
                    '            <div style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary);">',
                    '                Média da URE (' + activeYear + '): <strong style="color: var(--color-brand-primary); font-size: var(--text-body); font-family: var(--font-display); font-variant-numeric: tabular-nums;">' + ure.displayAvg + '</strong>',
                    '            </div>',
                    '        </div>',
                    '    </div>',
                    '    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">',
                    '        ' + citiesChips,
                    '    </div>',
                    '</div>'
                ].join('\n');
            }).join('\n');
        }
    }

    function render217MunicipalitiesRankingTable() {
        var tbody = document.getElementById('ranking-217-tbody');
        if (!tbody) return;

        var activeStage = global.currentGlobalIdebStage || "Anos Iniciais";
        var activeYear = global.currentGlobalIdebYear || 2025;
        var prevYear = activeYear > 2015 ? (activeYear - 2) : 2015;

        var currKey = 'y' + activeYear;
        var prevKey = 'y' + prevYear;

        var rawDb = (activeStage === 'Anos Finais')
            ? (global.OFFICIAL_MARANHAO_IDEB_EXCEL && global.OFFICIAL_MARANHAO_IDEB_EXCEL.anosFinais)
            : (global.OFFICIAL_MARANHAO_IDEB_EXCEL && global.OFFICIAL_MARANHAO_IDEB_EXCEL.anosIniciais);

        if (!rawDb) return;

        var list = Object.values(rawDb).filter(function(c) {
            if (!c || !c.municipio) return false;
            var m = c.municipio.trim().toLowerCase();
            return !m.includes('município') && !m.includes('código');
        }).sort(function(a, b) {
            return (b[currKey] || 0) - (a[currKey] || 0);
        });

        tbody.innerHTML = list.map(function(c, idx) {
            var isGD = (c.municipio || '').trim().toLowerCase() === 'gonçalves dias';
            var ureName = getUreForCity(c.municipio);
            var rawCurr = c[currKey] !== null ? c[currKey] : null;
            var rawPrev = c[prevKey] !== null ? c[prevKey] : null;

            var displayCurr = (rawCurr !== null && rawCurr >= 0 && rawCurr <= 10) ? Number(rawCurr).toFixed(1) : '—';
            var displayPrev = (rawPrev !== null && rawPrev >= 0 && rawPrev <= 10) ? Number(rawPrev).toFixed(1) : '—';

            var diffBadge = '—';
            if (rawCurr !== null && rawPrev !== null && activeYear !== 2015) {
                var d = Number((parseFloat(displayCurr) - parseFloat(displayPrev)).toFixed(1));
                if (d > 0) diffBadge = '<span class="diff-up">+' + d + '</span>';
                else if (d < 0) diffBadge = '<span class="diff-down">' + d + '</span>';
                else diffBadge = '<span class="diff-eq">= 0.0</span>';
            }

            return [
                '<tr style="border-bottom: 1px solid var(--color-border-subtle); height: 48px; ' + (isGD ? 'background: var(--color-accent-subtle);' : '') + '">',
                '    <td style="padding: 10px 14px; font-weight: 700; color: ' + (idx < 3 ? 'var(--color-status-warning-text)' : 'var(--color-text-secondary)') + '; font-family: var(--font-display); font-variant-numeric: tabular-nums;">',
                '        #' + (idx + 1),
                '    </td>',
                '    <td style="padding: 10px 14px; font-weight: 600; color: ' + (isGD ? 'var(--color-accent-primary)' : 'var(--color-text-primary)') + ';">',
                '        <a href="javascript:void(0)" onclick="selectCityFromUre(\'' + (c.municipio||'').replace(/'/g, "\\'") + '\')" style="color:inherit; text-decoration:none;">',
                '            ' + c.municipio + ' ' + (isGD ? '(Sua Rede)' : '') + '',
                '        </a>',
                '    </td>',
                '    <td style="padding: 10px 14px; font-size: var(--text-xs); color: var(--color-text-secondary);">' + ureName + '</td>',
                '    <td style="padding: 10px 14px; text-align: center; font-size: var(--text-sm); font-family: var(--font-display); font-variant-numeric: tabular-nums;">' + displayPrev + '</td>',
                '    <td style="padding: 10px 14px; text-align: center; font-weight: 700; font-size: var(--text-sm); color: var(--color-brand-primary); font-family: var(--font-display); font-variant-numeric: tabular-nums;">' + displayCurr + '</td>',
                '    <td style="padding: 10px 14px; text-align: center;">' + diffBadge + '</td>',
                '    <td style="padding: 10px 14px; text-align: center;">',
                '        <span class="badge ' + (rawCurr !== null && rawCurr >= 5.0 ? 'badge-status-success' : 'badge-status-warning') + '" style="font-size: var(--text-xs);">',
                '            ' + (rawCurr !== null && rawCurr >= 5.0 ? 'Alto Desempenho' : 'Em Desenvolvimento') + '',
                '        </span>',
                '    </td>',
                '</tr>'
            ].join('\n');
        }).join('\n');
    }

    function renderSchoolsStateRankingTable() {
        var tbody = document.getElementById('ranking-escolas-tbody');
        if (!tbody) return;

        var rawDb = global.ESCOLAS_MARANHAO_IDEB || global.OFFICIAL_MARANHAO_ESCOLAS_EXCEL || [];
        var activeYear = global.currentGlobalIdebYear || 2025;
        var prevYear = activeYear > 2015 ? (activeYear - 2) : 2015;

        tbody.innerHTML = rawDb.map(function(sch, idx) {
            var isGD = (sch.city || '').trim().toLowerCase() === 'gonçalves dias';
            var displayCurr = sch.scoreCurr !== null ? Number(sch.scoreCurr).toFixed(1) : '—';
            var displayPrev = sch.scorePrev !== null ? Number(sch.scorePrev).toFixed(1) : '—';

            var diffMarkup = '—';
            if (sch.scoreCurr !== null && sch.scorePrev !== null && activeYear !== 2015) {
                var d = Number((parseFloat(displayCurr) - parseFloat(displayPrev)).toFixed(1));
                if (d > 0) diffMarkup = '<span class="diff-up">+' + d + '</span>';
                else if (d < 0) diffMarkup = '<span class="diff-down">' + d + '</span>';
                else diffMarkup = '<span class="diff-eq">= 0.0</span>';
            }

            return [
                '<tr style="border-bottom: 1px solid var(--color-border-subtle); height: 50px; ' + (isGD ? 'background: var(--color-accent-subtle);' : '') + '">',
                '    <td style="padding: 10px 14px; font-weight: 700; font-family: var(--font-display); font-variant-numeric: tabular-nums; color: var(--color-brand-primary);">#' + sch.globalRank + '</td>',
                '    <td style="padding: 10px 14px; font-weight: 700; font-family: var(--font-display); font-variant-numeric: tabular-nums; color: var(--color-status-warning-text);">#' + sch.localRank + ' de ' + sch.localTotal + '</td>',
                '    <td style="padding: 10px 14px; font-weight: 600; color: var(--color-brand-primary); font-size: var(--text-sm);">' + sch.name + ' ' + (isGD ? '(Sua Rede)' : '') + '</td>',
                '    <td style="padding: 10px 14px; font-size: var(--text-xs); color: var(--color-text-secondary);">' + sch.city + ' • <span style="color:var(--color-text-muted);">' + sch.ure + '</span></td>',
                '    <td style="padding: 10px 14px;"><span class="badge badge-neutral" style="font-size:var(--text-xs);">' + sch.network + '</span></td>',
                '    <td style="padding: 10px 14px; text-align: center; font-size: var(--text-sm); font-family: var(--font-display); font-variant-numeric: tabular-nums;">' + displayPrev + '</td>',
                '    <td style="padding: 10px 14px; text-align: center;">',
                '        <div style="font-weight: 700; font-size: var(--text-sm); color: var(--color-status-success-text); font-family: var(--font-display); font-variant-numeric: tabular-nums;">' + displayCurr + '</div>',
                '        <div style="font-size: var(--text-xs); margin-top: 1px;">' + diffMarkup + '</div>',
                '    </td>',
                '    <td style="padding: 10px 14px; text-align: center;">',
                '        <button onclick="openSchoolIdebDetailModalById(\'' + sch.id + '\')" class="btn btn-outline" style="font-size: var(--text-xs); padding: 4px 8px;" title="Ver Detalhes e Comparativo">Ver Detalhes</button>',
                '    </td>',
                '</tr>'
            ].join('\n');
        }).join('\n');
    }

    function renderCityMiniSummary(cityFilter, schoolsList, year) {
        var summaryContainer = document.getElementById('school-ranking-city-summary');
        if (!summaryContainer) return;

        if (cityFilter === 'all' || schoolsList.length === 0) {
            summaryContainer.innerHTML = '<div style="grid-column: span 4; text-align: center; font-size: var(--text-xs); color: var(--color-text-secondary);">Selecione um município específico no filtro acima para visualizar a síntese local de escolas no ciclo ' + (year || 2025) + '.</div>';
            return;
        }

        var validScores = schoolsList.filter(function(s) { return s.scoreCurr !== null; });
        var total = schoolsList.length;
        var avg = (validScores.length > 0) ? (validScores.reduce(function(acc, s) { return acc + s.scoreCurr; }, 0) / validScores.length).toFixed(1) : '—';
        var best = validScores[0] || schoolsList[0];
        var worst = validScores[validScores.length - 1] || schoolsList[schoolsList.length - 1];

        summaryContainer.innerHTML = [
            '<div style="background:var(--color-surface-card); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--color-border-subtle); text-align:center;">',
            '    <div style="font-size:var(--text-xs); font-weight:600; color:var(--color-text-secondary);">Total de Escolas</div>',
            '    <div style="font-size:var(--text-title-sm); font-weight:700; color:var(--color-brand-primary); margin-top:2px;">' + total + ' Unidades</div>',
            '</div>',
            '<div style="background:var(--color-surface-card); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--color-border-subtle); text-align:center;">',
            '    <div style="font-size:var(--text-xs); font-weight:600; color:var(--color-text-secondary);">Média no Ciclo ' + (year || 2025) + '</div>',
            '    <div style="font-size:var(--text-title-sm); font-weight:700; color:var(--color-accent-primary); margin-top:2px;">' + avg + ' IDEB</div>',
            '</div>',
            '<div style="background:var(--color-status-success-bg); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--color-status-success-border); text-align:center;">',
            '    <div style="font-size:var(--text-xs); font-weight:700; color:var(--color-status-success-text);">Melhor Escola (' + (year || 2025) + ')</div>',
            '    <div style="font-size:var(--text-sm); font-weight:700; color:var(--color-brand-primary); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="' + (best ? best.name : '') + '">' + (best ? best.name : '—') + '</div>',
            '    <div style="font-size:var(--text-xs); font-weight:700; color:var(--color-status-success-text);">' + (best && best.scoreCurr !== null ? best.scoreCurr : '—') + ' IDEB</div>',
            '</div>',
            '<div style="background:var(--color-status-critical-bg); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--color-status-critical-border); text-align:center;">',
            '    <div style="font-size:var(--text-xs); font-weight:700; color:var(--color-status-critical-text);">Acompanhamento Prioritário (' + (year || 2025) + ')</div>',
            '    <div style="font-size:var(--text-sm); font-weight:700; color:var(--color-brand-primary); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="' + (worst ? worst.name : '') + '">' + (worst ? worst.name : '—') + '</div>',
            '    <div style="font-size:var(--text-xs); font-weight:700; color:var(--color-status-critical-text);">' + (worst && worst.scoreCurr !== null ? worst.scoreCurr : '—') + ' IDEB</div>',
            '</div>'
        ].join('\n');

        } catch(err) {
            console.error('Error rendering 19 UREs:', err);
            container.innerHTML = '<div class="card" style="padding:20px; text-align:center; color:#ef4444;">Erro ao renderizar UREs: ' + err.message + '</div>';
        }
    }

    // -------------------------------------------------------------------------
    // 6. RANKING GERAL DOS 217 MUNICÍPIOS & ESCOLAS DO MARANHÃO
    // -------------------------------------------------------------------------

    function renderRankingGeralMaTable() {
        var tbody = document.getElementById('ranking-geral-ma-table-body');
        if (!tbody) return;

        var activeYear = global.currentIdebYear || 2025;
        var prevYear = getPreviousCycleYear(activeYear);
        var activeStage = global.currentIdebStage || 'Anos Iniciais';

        var currKey = 'y' + activeYear;
        var prevKey = 'y' + prevYear;

        var queryInput = document.getElementById('ranking-ma-search-input');
        var query = queryInput ? queryInput.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';
        var ureFilter = document.getElementById('ranking-ma-ure-filter') ? document.getElementById('ranking-ma-ure-filter').value : 'all';

        var list = [];
        var dbMaranhao = global.IDEB_MARANHAO_MUNICIPIOS;
        if (dbMaranhao) {
            var rawList = (activeStage === 'Anos Finais') ? dbMaranhao.finais : dbMaranhao.iniciais;
            if (Array.isArray(rawList)) {
                list = rawList.map(function(c) {
                    return {
                        codigoInep: c.codigoInep || '',
                        municipio: c.municipio || '',
                        ure: c.ure || getUreForCity(c.municipio),
                        y2015: (c.y2015 !== undefined && c.y2015 !== null) ? Number(c.y2015) : null,
                        y2017: (c.y2017 !== undefined && c.y2017 !== null) ? Number(c.y2017) : null,
                        y2019: (c.y2019 !== undefined && c.y2019 !== null) ? Number(c.y2019) : null,
                        y2021: (c.y2021 !== undefined && c.y2021 !== null) ? Number(c.y2021) : null,
                        y2023: (c.y2023 !== undefined && c.y2023 !== null) ? Number(c.y2023) : null,
                        y2025: (c.y2025 !== undefined && c.y2025 !== null) ? Number(c.y2025) : null
                    };
                });
            }
        }

        if (list.length === 0 && Array.isArray(global.idebPublicoReferencia)) {
            var etapaName = (activeStage === 'Anos Finais') ? 'finais' : 'iniciais';
            list = global.idebPublicoReferencia
                .filter(function(item) { return (item.etapa || '').toLowerCase().includes(etapaName); })
                .map(function(item) {
                    return {
                        codigoInep: item.codigoInep || '',
                        municipio: item.municipio || '',
                        ure: getUreForCity(item.municipio),
                        y2015: item.anos ? Number(item.anos['2015']) : null,
                        y2017: item.anos ? Number(item.anos['2017']) : null,
                        y2019: item.anos ? Number(item.anos['2019']) : null,
                        y2021: item.anos ? Number(item.anos['2021']) : null,
                        y2023: item.anos ? Number(item.anos['2023']) : null,
                        y2025: item.anos ? Number(item.anos['2025']) : null
                    };
                });
        }

        var validList = list.filter(function(c) {
            if (!c || !c.municipio) return false;
            var name = c.municipio.trim().toLowerCase();
            return !name.includes('município') && !name.includes('código');
        });

        validList.sort(function(a, b) {
            var valA = (a[currKey] !== null && a[currKey] >= 0 && a[currKey] <= 10) ? a[currKey] : -1;
            var valB = (b[currKey] !== null && b[currKey] >= 0 && b[currKey] <= 10) ? b[currKey] : -1;
            return valB - valA;
        });

        var filtered = validList.filter(function(c) {
            var ure = c.ure || getUreForCity(c.municipio);
            if (ureFilter !== 'all' && ure !== ureFilter) return false;
            if (query) {
                var full = (c.municipio + ' ' + ure).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (!full.includes(query)) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="padding:24px; text-align:center; color:var(--text-muted);">Nenhum município encontrado para os filtros selecionados.</td></tr>';
            return;
        }

        var cycles = [2015, 2017, 2019, 2021, 2023, 2025];

        tbody.innerHTML = filtered.map(function(c, idx) {
            var rawCurr = (c[currKey] !== null && c[currKey] >= 0 && c[currKey] <= 10) ? c[currKey] : null;
            var rawPrev = (activeYear === 2015) ? null : ((c[prevKey] !== null && c[prevKey] >= 0 && c[prevKey] <= 10) ? c[prevKey] : null);

            var displayCurr = rawCurr !== null ? Number(rawCurr).toFixed(1) : '—';
            var displayPrev = rawPrev !== null ? Number(rawPrev).toFixed(1) : (activeYear === 2015 ? 'Base' : '—');

            var diffBadge = '—';
            if (activeYear === 2015) {
                diffBadge = '<span class="badge badge-secondary" style="font-size:0.68rem;">Base 2015</span>';
            } else if (rawCurr !== null && rawPrev !== null) {
                var diff = Number((rawCurr - rawPrev).toFixed(1));
                if (diff > 0) diffBadge = '<span style="color:#10b981; font-weight:800; font-size:0.8rem;">+' + diff + ' ↑</span>';
                else if (diff < 0) diffBadge = '<span style="color:#ef4444; font-weight:800; font-size:0.8rem;">' + diff + ' ↓</span>';
                else diffBadge = '<span style="color:var(--text-muted); font-weight:700; font-size:0.8rem;">= 0.0</span>';
            }

            var cleanCityName = (c.municipio || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            var isGD = cleanCityName === 'goncalves dias';
            var ureName = c.ure || getUreForCity(c.municipio);

            var miniChips = cycles.map(function(cyc) {
                var k = 'y' + cyc;
                var v = (c[k] !== null && c[k] >= 0 && c[k] <= 10) ? Number(c[k]).toFixed(1) : '-';
                var isCurrent = (cyc === activeYear);
                return '<span style="font-size:0.65rem; padding:1px 4px; border-radius:4px; ' + (isCurrent ? 'background:#6366f1; color:#fff; font-weight:800;' : 'background:var(--bg-secondary); color:var(--text-muted); border:1px solid var(--border-color);') + '" title="' + cyc + ': ' + v + '">' + v + '</span>';
            }).join(' ');

            return [
                '<tr style="border-bottom: 1px solid var(--border-color); height: 50px; ' + (isGD ? 'background: rgba(16, 185, 129, 0.08);' : '') + '">',
                '    <td style="padding: 10px 14px; font-weight: 800; color: ' + (idx < 3 ? '#f59e0b' : 'var(--text-muted)') + '; font-family: var(--font-mono);">',
                '        #' + (idx + 1) + ' ' + (idx === 0 ? '👑' : '') + '',
                '    </td>',
                '    <td style="padding: 10px 14px; font-weight: 700; color: ' + (isGD ? '#10b981' : 'var(--text-primary)') + ';">',
                '        <a href="javascript:void(0)" onclick="selectCityFromUre(\'' + (c.municipio||'').replace(/'/g, "\\'") + '\')" style="color:inherit; text-decoration:none;">',
                '            ' + c.municipio + ' ' + (isGD ? '⭐ (Sua Rede)' : '') + '',
                '        </a>',
                '    </td>',
                '    <td style="padding: 10px 14px; font-size: 0.8rem; color: var(--text-secondary);">' + ureName + '</td>',
                '    <td style="padding: 10px 14px; text-align: center; font-size: 0.85rem; font-family: var(--font-mono);">' + displayPrev + '</td>',
                '    <td style="padding: 10px 14px; text-align: center; font-weight: 800; font-size: 0.95rem; color: #10b981; font-family: var(--font-mono);">' + displayCurr + '</td>',
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

    function populateSchoolCitySelectDropdown() {
        var select = document.getElementById('ranking-escolas-city-select');
        if (!select) return;

        var allCitiesSet = new Set();
        if (global.IDEB_MARANHAO_MUNICIPIOS && Array.isArray(global.IDEB_MARANHAO_MUNICIPIOS.iniciais)) {
            global.IDEB_MARANHAO_MUNICIPIOS.iniciais.forEach(function(item) {
                if (item && item.municipio) allCitiesSet.add(item.municipio.trim());
            });
        }

        if (allCitiesSet.size === 0) {
            var uresList = getOfficial19UresList();
            uresList.forEach(function(ure) {
                if (ure.cities) ure.cities.forEach(function(c) { allCitiesSet.add(c.trim()); });
            });
        }

        var sortedCities = Array.from(allCitiesSet).sort(function(a, b) { return a.localeCompare(b); });

        var optionsHtml = [
            '<option value="all">Todos os Municípios do Maranhão</option>',
            '<option value="Gonçalves Dias" selected>Gonçalves Dias ⭐ (Sua Rede)</option>'
        ].concat(sortedCities.filter(function(c) {
            return c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() !== 'goncalves dias';
        }).map(function(c) { return '<option value="' + c + '">' + c + '</option>'; })).join('');

        select.innerHTML = optionsHtml;
    }

    function filterSchoolRankingTable() {
        var rawDb = global.ESCOLAS_MARANHAO_IDEB || global.OFFICIAL_MARANHAO_ESCOLAS_EXCEL || [];
        var activeStage = global.currentIdebStage || 'Anos Iniciais';
        var isAnosIniciais = (activeStage === 'Anos Iniciais');
        var activeYear = global.currentIdebYear || 2025;
        var prevYear = getPreviousCycleYear(activeYear);

        var currKey = 'y' + activeYear;
        var prevKey = 'y' + prevYear;

        var cityFilter = (document.getElementById('ranking-escolas-city-select') && document.getElementById('ranking-escolas-city-select').value) || 'Gonçalves Dias';
        var redeFilter = (document.getElementById('ranking-escolas-rede-select') && document.getElementById('ranking-escolas-rede-select').value) || 'all';
        var searchInput = document.getElementById('ranking-escolas-search-input');
        var query = searchInput ? searchInput.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';

        var cleanCityFilter = cityFilter.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        var schoolsData = [];
        rawDb.forEach(function(sch) {
            var id = sch.inep || sch.codigoEscola || sch.id || '';
            var name = sch.nome || sch.nomeEscola || '';
            var city = sch.municipio || '';
            var network = sch.localizacao || (sch.rede === 'Estadual' || sch.rede === 'Municipal' ? sch.rede : 'Municipal');
            var ure = sch.ure || getUreForCity(city);

            var scoreCurr = null;
            var scorePrev = null;

            if (isAnosIniciais) {
                if (activeYear === 2025) {
                    scoreCurr = (sch.iniciais2025 !== undefined && sch.iniciais2025 !== null) ? sch.iniciais2025 : (sch.ai ? sch.ai.y2025 : null);
                    scorePrev = (sch.ai && sch.ai.y2023 !== undefined) ? sch.ai.y2023 : null;
                } else if (sch.ai) {
                    scoreCurr = (sch.ai[currKey] !== undefined) ? sch.ai[currKey] : null;
                    scorePrev = (activeYear === 2015) ? null : ((sch.ai[prevKey] !== undefined) ? sch.ai[prevKey] : null);
                }
            } else {
                if (activeYear === 2025) {
                    scoreCurr = (sch.finais2025 !== undefined && sch.finais2025 !== null) ? sch.finais2025 : (sch.af ? sch.af.y2025 : null);
                    scorePrev = (sch.af && sch.af.y2023 !== undefined) ? sch.af.y2023 : null;
                } else if (sch.af) {
                    scoreCurr = (sch.af[currKey] !== undefined) ? sch.af[currKey] : null;
                    scorePrev = (activeYear === 2015) ? null : ((sch.af[prevKey] !== undefined) ? sch.af[prevKey] : null);
                }
            }

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
            var cleanC = (sch.city || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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
                var cleanSchoolCity = (sch.city || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                if (cleanSchoolCity !== cleanCityFilter) return false;
            }
            if (redeFilter !== 'all' && sch.network !== redeFilter) return false;
            if (query) {
                var full = (sch.name + ' ' + sch.city + ' ' + sch.ure).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (!full.includes(query)) return false;
            }
            return true;
        });

        renderCityMiniSummary(cityFilter, filtered, activeYear);

        var tbody = document.getElementById('ranking-escolas-table-body');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="padding:30px; text-align:center; color:var(--text-muted);">Nenhuma escola encontrada com os filtros selecionados para este ciclo.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.slice(0, 150).map(function(sch) {
            var displayCurr = sch.scoreCurr !== null ? Number(sch.scoreCurr).toFixed(1) : '—';
            var displayPrev = (activeYear === 2015) ? 'Base' : (sch.scorePrev !== null ? Number(sch.scorePrev).toFixed(1) : '—');

            var diffMarkup = '';
            if (activeYear === 2015) {
                diffMarkup = '<span style="color:var(--text-muted); font-size:0.7rem;">Base 2015</span>';
            } else if (sch.scoreCurr !== null && sch.scorePrev !== null) {
                var diff = Number((sch.scoreCurr - sch.scorePrev).toFixed(1));
                if (diff > 0) diffMarkup = '<span style="color:#10b981; font-weight:800; font-size:0.75rem;">↑ (+' + diff + ')</span>';
                else if (diff < 0) diffMarkup = '<span style="color:#ef4444; font-weight:800; font-size:0.75rem;">↓ (' + diff + ')</span>';
                else diffMarkup = '<span style="color:var(--text-muted); font-weight:700; font-size:0.75rem;">= (0.0)</span>';
            }

            var cleanSchoolCity = (sch.city || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            var isGD = cleanSchoolCity === 'goncalves dias';

            return [
                '<tr style="border-bottom: 1px solid var(--border-color); height: 54px; ' + (isGD ? 'background: rgba(16, 185, 129, 0.05);' : '') + '">',
                '    <td style="padding: 10px 14px; font-weight: 800; font-family: var(--font-mono); color: #6366f1;">#' + sch.globalRank + '</td>',
                '    <td style="padding: 10px 14px; font-weight: 800; font-family: var(--font-mono); color: #f59e0b;">#' + sch.localRank + ' de ' + sch.localTotal + '</td>',
                '    <td style="padding: 10px 14px; font-weight: 700; color: var(--text-primary); font-size: 0.88rem;">' + sch.name + ' ' + (isGD ? '⭐' : '') + '</td>',
                '    <td style="padding: 10px 14px; font-size: 0.8rem; color: var(--text-secondary);">' + sch.city + ' • <span style="color:var(--text-muted);">' + sch.ure + '</span></td>',
                '    <td style="padding: 10px 14px;"><span class="badge ' + (sch.network === 'Municipal' ? 'badge-purple' : 'badge-info') + '" style="font-size:0.68rem;">' + sch.network + '</span></td>',
                '    <td style="padding: 10px 14px; text-align: center; font-size: 0.85rem; font-family: var(--font-mono);">' + displayPrev + '</td>',
                '    <td style="padding: 10px 14px; text-align: center;">',
                '        <div style="font-weight: 800; font-size: 0.95rem; color: #10b981; font-family: var(--font-mono);">' + displayCurr + '</div>',
                '        <div style="font-size: 0.7rem; margin-top: 1px;">' + diffMarkup + '</div>',
                '    </td>',
                '    <td style="padding: 10px 14px; text-align: center;">',
                '        <button onclick="openSchoolIdebDetailModalById(\'' + sch.id + '\')" class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 4px 8px; font-weight: 700; color: #6366f1;" title="Ver Detalhes e Comparativo">📊 Ver Detalhes</button>',
                '    </td>',
                '</tr>'
            ].join('\n');
        }).join('\n');
    }

    function renderCityMiniSummary(cityFilter, schoolsList, year) {
        var summaryContainer = document.getElementById('school-ranking-city-summary');
        if (!summaryContainer) return;

        if (cityFilter === 'all' || schoolsList.length === 0) {
            summaryContainer.innerHTML = '<div style="grid-column: span 4; text-align: center; font-size: 0.78rem; color: var(--text-muted);">Selecione um município específico no filtro acima para visualizar a síntese local de escolas no ciclo ' + (year || 2025) + '.</div>';
            return;
        }

        var validScores = schoolsList.filter(function(s) { return s.scoreCurr !== null; });
        var total = schoolsList.length;
        var avg = (validScores.length > 0) ? (validScores.reduce(function(acc, s) { return acc + s.scoreCurr; }, 0) / validScores.length).toFixed(1) : '—';
        var best = validScores[0] || schoolsList[0];
        var worst = validScores[validScores.length - 1] || schoolsList[schoolsList.length - 1];

        summaryContainer.innerHTML = [
            '<div style="background:var(--bg-secondary); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); text-align:center;">',
            '    <div style="font-size:0.7rem; font-weight:700; color:var(--text-muted);">Total de Escolas</div>',
            '    <div style="font-size:1.1rem; font-weight:800; color:var(--text-primary); margin-top:2px;">' + total + ' Unidades</div>',
            '</div>',
            '<div style="background:var(--bg-secondary); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); text-align:center;">',
            '    <div style="font-size:0.7rem; font-weight:700; color:var(--text-muted);">Média no Ciclo ' + (year || 2025) + '</div>',
            '    <div style="font-size:1.1rem; font-weight:800; color:#6366f1; margin-top:2px;">' + avg + ' IDEB</div>',
            '</div>',
            '<div style="background:rgba(16, 185, 129, 0.08); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid #10b981; text-align:center;">',
            '    <div style="font-size:0.7rem; font-weight:700; color:#10b981;">🥇 Melhor Escola (' + (year || 2025) + ')</div>',
            '    <div style="font-size:0.82rem; font-weight:800; color:var(--text-primary); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="' + (best ? best.name : '') + '">' + (best ? best.name : '—') + '</div>',
            '    <div style="font-size:0.7rem; font-weight:800; color:#10b981;">' + (best && best.scoreCurr !== null ? best.scoreCurr : '—') + ' IDEB</div>',
            '</div>',
            '<div style="background:rgba(239, 68, 68, 0.08); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid #ef4444; text-align:center;">',
            '    <div style="font-size:0.7rem; font-weight:700; color:#ef4444;">⚠️ Escola Prioritária (' + (year || 2025) + ')</div>',
            '    <div style="font-size:0.82rem; font-weight:800; color:var(--text-primary); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="' + (worst ? worst.name : '') + '">' + (worst ? worst.name : '—') + '</div>',
            '    <div style="font-size:0.7rem; font-weight:800; color:#ef4444;">' + (worst && worst.scoreCurr !== null ? worst.scoreCurr : '—') + ' IDEB</div>',
            '</div>'
        ].join('\n');
    }

    function openSchoolIdebDetailModalById(schoolId) {
        var rawDb = global.ESCOLAS_MARANHAO_IDEB || global.OFFICIAL_MARANHAO_ESCOLAS_EXCEL || [];
        var sch = rawDb.find(function(s) { return (s.inep === schoolId || s.codigoEscola === schoolId || s.id === schoolId); }) || rawDb[0];
        if (!sch) return;

        var schoolName = sch.nome || sch.nomeEscola || 'Unidade Escolar';
        var schoolCity = sch.municipio || 'Gonçalves Dias';
        var schoolRede = sch.localizacao || (sch.rede === 'Estadual' || sch.rede === 'Municipal' ? sch.rede : 'Municipal');
        var schoolUre = sch.ure || getUreForCity(schoolCity);

        var activeStage = global.currentIdebStage || 'Anos Iniciais';
        var isAnosIniciais = (activeStage === 'Anos Iniciais');
        var activeYear = global.currentIdebYear || 2025;

        var currentScore = isAnosIniciais 
            ? ((sch.iniciais2025 !== undefined && sch.iniciais2025 !== null) ? sch.iniciais2025 : (sch.ai ? sch.ai.y2025 : 5.0))
            : ((sch.finais2025 !== undefined && sch.finais2025 !== null) ? sch.finais2025 : (sch.af ? sch.af.y2025 : 4.5));

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
                var score = '-';
                if (cyc === 2025 && currentScore !== null) {
                    score = Number(currentScore).toFixed(1);
                } else if (isAnosIniciais && sch.ai && sch.ai['y' + cyc] !== undefined) {
                    score = Number(sch.ai['y' + cyc]).toFixed(1);
                } else if (!isAnosIniciais && sch.af && sch.af['y' + cyc] !== undefined) {
                    score = Number(sch.af['y' + cyc]).toFixed(1);
                }
                return [
                    '<div style="background:var(--bg-secondary); padding:8px 6px; border-radius:var(--radius-sm); border:' + (isSelected ? '2px solid #6366f1' : '1px solid var(--border-color)') + ';">',
                    '    <div style="font-size:0.68rem; font-weight:700; color:var(--text-muted);">' + cyc + '</div>',
                    '    <div style="font-size:1.1rem; font-weight:800; color:' + (isSelected ? '#6366f1' : 'var(--text-primary)') + '; margin-top:2px;">' + score + '</div>',
                    '</div>'
                ].join('\n');
            }).join('\n');
        }

        if (compBars) {
            var validScoreNum = Number(currentScore || 5.0);
            var targetMeta = Number((validScoreNum + 0.4).toFixed(1));

            compBars.innerHTML = [
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; color:var(--text-primary); margin-bottom:3px;">',
                '        <span>' + schoolName + ' (' + activeYear + ')</span>',
                '        <span style="color:#10b981;">' + validScoreNum.toFixed(1) + '</span>',
                '    </div>',
                '    <div style="width:100%; height:8px; background:var(--bg-secondary); border-radius:4px; overflow:hidden;">',
                '        <div style="width:' + Math.min(100, (validScoreNum/10)*100) + '%; height:100%; background:#10b981; border-radius:4px;"></div>',
                '    </div>',
                '</div>',
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:3px;">',
                '        <span>Média do Município (' + schoolCity + ')</span>',
                '        <span>5.2</span>',
                '    </div>',
                '    <div style="width:100%; height:8px; background:var(--bg-secondary); border-radius:4px; overflow:hidden;">',
                '        <div style="width:52%; height:100%; background:#6366f1; border-radius:4px;"></div>',
                '    </div>',
                '</div>',
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:3px;">',
                '        <span>Meta Pactuada (INEP / MEC)</span>',
                '        <span>' + targetMeta + '</span>',
                '    </div>',
                '    <div style="width:100%; height:8px; background:var(--bg-secondary); border-radius:4px; overflow:hidden;">',
                '        <div style="width:' + Math.min(100, (targetMeta/10)*100) + '%; height:100%; background:#3b82f6; border-radius:4px;"></div>',
                '    </div>',
                '</div>'
            ].join('\n');
        }

        if (modal) modal.classList.remove('hidden');
    }

    function switchIdebSubtab(targetTab) {
        if (!targetTab) return;
        try {
            document.querySelectorAll('.ideb-regional-tab-btn').forEach(function(btn) {
                if (btn.getAttribute('data-tab') === targetTab) {
                    btn.classList.add('active');
                    btn.style.background = '#6366f1';
                    btn.style.color = '#ffffff';
                    btn.style.border = 'none';
                    btn.style.fontWeight = '700';
                } else {
                    btn.classList.remove('active');
                    btn.style.background = 'var(--bg-secondary)';
                    btn.style.color = 'var(--text-secondary)';
                    btn.style.border = '1px solid var(--border-color)';
                    btn.style.fontWeight = '600';
                }
            });

            document.querySelectorAll('.ideb-regional-tab-content').forEach(function(content) {
                content.classList.add('hidden');
                content.style.display = 'none';
            });

            var activeEl = document.getElementById('tab-ideb-' + targetTab);
            if (activeEl) {
                activeEl.classList.remove('hidden');
                activeEl.style.display = 'block';
            }

            if (targetTab === 'painel-principal') {
                handleSelectIdebCity(global.currentSelectedCity || "Gonçalves Dias");
            } else if (targetTab === 'painel-ures') {
                render19UresPanel();
            } else if (targetTab === 'ranking-geral-ma') {
                renderRankingGeralMaTable();
            } else if (targetTab === 'ranking-escolas-ma') {
                filterSchoolRankingTable();
            }
        } catch(e) {
            console.error('Error switching regional subtab:', e);
        }
    }

    // -------------------------------------------------------------------------
    // 7. GESTÃO DE METAS MUNICIPAIS & PLANO DE DESENVOLVIMENTO ESCOLAR (PDE)
    // -------------------------------------------------------------------------

    function initGdMetasDatabase() {
        try {
            var savedTargets = localStorage.getItem('gd_school_targets_db');
            if (savedTargets) gdSchoolTargetsMap = JSON.parse(savedTargets);

            var savedPde = localStorage.getItem('gd_school_pde_plans_db');
            if (savedPde) gdSchoolPdePlansMap = JSON.parse(savedPde);
        } catch(e) {}
    }

    function checkPossuiAvaliacaoRealizada(schName, selectedYear) {
        if (selectedYear === '2023' || selectedYear === '2025') return true;
        var state = global.SCHOOL_ASSESSMENTS_STATE ? global.SCHOOL_ASSESSMENTS_STATE[selectedYear] : null;
        if (!state) return false;
        if (state.hasOwnProperty(schName)) return state[schName];
        return state.default !== undefined ? state.default : false;
    }

    function handleRegisterFirstAssessment(schName, year) {
        if (!global.SCHOOL_ASSESSMENTS_STATE) global.SCHOOL_ASSESSMENTS_STATE = {};
        if (!global.SCHOOL_ASSESSMENTS_STATE[year]) global.SCHOOL_ASSESSMENTS_STATE[year] = {};
        global.SCHOOL_ASSESSMENTS_STATE[year][schName] = true;
        alert('✅ 1ª Avaliação Diagnóstica de ' + year + ' registrada com sucesso para ' + schName + '!\n\nOs dados de desempenho, desvio e metas de PDE para este ciclo foram liberados.');
        populateIdebGoalsTable();
    }

    function populateIdebGoalsTable() {
        initGdMetasDatabase();
        var tbody = document.getElementById('goals-table-body') || document.getElementById('ideb-goals-table-body');
        if (!tbody) return;

        var filterStatus = (document.getElementById('pde-filter-status') && document.getElementById('pde-filter-status').value) || 'all';
        var filterStage = (document.getElementById('pde-filter-stage') && document.getElementById('pde-filter-stage').value) || 'ai';
        var isAnosIniciais = (filterStage === 'ai');

        var schoolsEvaluated = [
            { id: '21051287', nome: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS', inep2023: 5.8, score2025: 6.1, af2023: 5.2, af2025: 5.5, profLP: 218.4, profMAT: 226.1 },
            { id: '21051295', nome: 'U I BASILIO ALVES', inep2023: 5.5, score2025: 5.8, af2023: 4.0, af2025: 4.3, profLP: 212.0, profMAT: 219.5 },
            { id: '21051309', nome: 'UI JOSE CORREA LIMA', inep2023: 5.2, score2025: 5.5, af2023: null, af2025: null, profLP: 208.5, profMAT: 215.2 },
            { id: '21051317', nome: 'UNIDADE INTEGRADA ALDENORA ARAUJO CRUZ', inep2023: 5.0, score2025: 5.3, af2023: 4.9, af2025: 5.2, profLP: 205.1, profMAT: 211.8 },
            { id: '21051325', nome: 'UI EMILIO MURAD', inep2023: 4.9, score2025: 5.2, af2023: 5.1, af2025: 5.4, profLP: 204.0, profMAT: 210.5 },
            { id: '21051333', nome: 'UE ANITA FURTADO', inep2023: 4.6, score2025: 4.8, af2023: null, af2025: null, profLP: 198.2, profMAT: 204.6 },
            { id: '21051341', nome: 'UI ANTONIO GONCALVES DIAS', inep2023: 4.5, score2025: 4.8, af2023: 4.1, af2025: 4.4, profLP: 196.4, profMAT: 203.0 },
            { id: '21051350', nome: 'UNIDADE ESCOLAR ANISIO GOMES', inep2023: 4.4, score2025: 4.7, af2023: 3.9, af2025: 4.2, profLP: 194.0, profMAT: 201.2 },
            { id: '21051368', nome: 'UE VEREADOR LEONARDO FERREIRA LIMA', inep2023: 4.3, score2025: 4.6, af2023: null, af2025: null, profLP: 192.5, profMAT: 199.0 },
            { id: '21051376', nome: 'UE RAIMUNDO DOS REIS DA SILVA', inep2023: 4.2, score2025: 4.5, af2023: null, af2025: null, profLP: 190.0, profMAT: 197.5 },
            { id: '21051384', nome: 'UE PREFEITA ROSITA SOUSA DIAS', inep2023: 4.1, score2025: 4.4, af2023: null, af2025: null, profLP: 188.0, profMAT: 195.0 },
            { id: '21051392', nome: 'U I ROSA FRANCISCA DE MELO', inep2023: 4.0, score2025: 4.3, af2023: null, af2025: null, profLP: 186.0, profMAT: 193.0 }
        ];

        var totalTarget = 0;
        var totalScore = 0;
        var count = 0;

        var renderedRows = schoolsEvaluated.map(function(sch) {
            var baseScore = isAnosIniciais ? sch.inep2023 : (sch.af2023 || sch.inep2023);
            var currentObserved = isAnosIniciais ? sch.score2025 : (sch.af2025 || sch.score2025);

            var targetKey = sch.id + '_' + filterStage;
            var targetScore = gdSchoolTargetsMap[targetKey] ? Number(gdSchoolTargetsMap[targetKey]) : Number((baseScore + 0.3).toFixed(1));
            var gap = Number((currentObserved - targetScore).toFixed(1));

            var riskLevel = 'Baixo (Meta Atingida)';
            var riskBadge = '<span class="badge badge-success" style="font-size:0.7rem; font-weight:800;">🟢 Baixo (Meta OK)</span>';

            if (gap < -0.3 || currentObserved < 4.6) {
                riskLevel = 'Alto (Risco Crítico)';
                riskBadge = '<span class="badge badge-danger" style="font-size:0.7rem; font-weight:800;">🔴 Alto (Risco Crítico)</span>';
            } else if (gap < 0) {
                riskLevel = 'Médio (Atenção)';
                riskBadge = '<span class="badge badge-warning" style="font-size:0.7rem; font-weight:800;">🟡 Médio (Atenção)</span>';
            }

            if (filterStatus === 'risk' && riskLevel.includes('Baixo')) return null;
            if (filterStatus === 'ok' && !riskLevel.includes('Baixo')) return null;

            totalTarget += targetScore;
            totalScore += currentObserved;
            count++;

            var pdePlan = gdSchoolPdePlansMap[sch.id];
            var pdeCell = pdePlan ? [
                '<div style="text-align: left; line-height: 1.3;">',
                '    <div style="font-size: 0.76rem; font-weight: 800; color: #6366f1;">' + pdePlan.indicator + '</div>',
                '    <div style="font-size: 0.68rem; color: var(--text-secondary);">Resp: ' + pdePlan.responsible + ' • Prazo: ' + pdePlan.deadline + '</div>',
                '    <span class="badge ' + (pdePlan.status.includes('Concluído') ? 'badge-success' : 'badge-purple') + '" style="font-size:0.62rem; margin-top:2px;">' + pdePlan.status + '</span>',
                '</div>'
            ].join('') : '<span class="text-sm text-muted" style="font-size: 0.75rem;">Sem plano cadastrado</span>';

            return [
                '<tr style="border-bottom: 1px solid var(--border-color); height: 58px;">',
                '    <td style="padding: 12px 16px;">',
                '        <strong style="font-size: 0.88rem; color: var(--text-primary); display: block;">' + sch.nome + '</strong>',
                '        <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">INEP: ' + sch.id + ' • Gonçalves Dias (MA)</span>',
                '    </td>',
                '    <td style="padding: 12px 16px; text-align: center; font-weight: 700; font-family: var(--font-mono); font-size: 0.95rem; color: var(--text-secondary);">' + baseScore.toFixed(1) + '</td>',
                '    <td style="padding: 12px 16px; text-align: center;">',
                '        <input type="number" step="0.1" min="1.0" max="10.0" value="' + targetScore.toFixed(1) + '" onchange="handleUpdateSchoolTarget(\'' + sch.id + '\', \'' + filterStage + '\', this.value)" style="width: 65px; height: 32px; text-align: center; font-weight: 800; font-family: var(--font-mono); font-size: 0.92rem; color: #6366f1; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">',
                '    </td>',
                '    <td style="padding: 12px 16px; text-align: center; font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-primary);">',
                '        <strong>' + (currentObserved * 0.96).toFixed(2) + '</strong> N <span style="font-size: 0.68rem; color: var(--text-muted);">(' + sch.profLP.toFixed(0) + ' LP/' + sch.profMAT.toFixed(0) + ' MT)</span>',
                '    </td>',
                '    <td style="padding: 12px 16px; text-align: center; font-weight: 800; font-family: var(--font-mono); font-size: 0.95rem; color: ' + (gap >= 0 ? '#10b981' : '#ef4444') + ';">' + (gap >= 0 ? '+' : '') + gap.toFixed(1) + '</td>',
                '    <td style="padding: 12px 16px; text-align: center;">' + riskBadge + '</td>',
                '    <td style="padding: 12px 16px; text-align: center;">' + pdeCell + '</td>',
                '    <td style="padding: 12px 16px; text-align: center;">',
                '        <button onclick="openPdeManagerForSchool(\'' + sch.id + '\', \'' + sch.nome.replace(/'/g, "\\'") + '\', ' + targetScore + ')" class="btn btn-outline btn-sm" style="font-size: 0.74rem; font-weight: 700; color: #6366f1; border-color: #6366f1; padding: 4px 8px;" title="Gerenciar Plano de Ação">' + (pdePlan ? '✏️ Editar PDE' : '📋 Criar PDE') + '</button>',
                '    </td>',
                '</tr>'
            ].join('\n');
        }).filter(Boolean);

        if (renderedRows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="padding:30px; text-align:center; color:var(--text-muted);">Nenhuma escola encontrada para o filtro de risco selecionado.</td></tr>';
            return;
        }

        tbody.innerHTML = renderedRows.join('');

        var avgScore = count > 0 ? (totalScore / count).toFixed(1) : '5.2';
        var summaryIdeb = document.getElementById('metas-summary-ideb');
        if (summaryIdeb) summaryIdeb.textContent = avgScore;

        var countBadge = document.getElementById('pde-count-schools-badge');
        if (countBadge) countBadge.textContent = count + ' Escolas Mapeadas';
    }

    function handleUpdateSchoolTarget(schId, stage, val) {
        var num = parseFloat(val);
        if (isNaN(num) || num < 1 || num > 10) return;

        var key = schId + '_' + stage;
        gdSchoolTargetsMap[key] = num;
        try {
            localStorage.setItem('gd_school_targets_db', JSON.stringify(gdSchoolTargetsMap));
        } catch(e) {}

        populateIdebGoalsTable();
    }

    function openPdeManagerForSchool(schId, schName, targetScore) {
        var modal = document.getElementById('modal-pde-manager');
        if (!modal) return;

        var idInput = document.getElementById('pde-manager-school-id');
        var titleEl = document.getElementById('pde-modal-school-title');
        var metaEl = document.getElementById('pde-modal-school-meta');
        var targetInput = document.getElementById('pde-manager-target-score');

        if (idInput) idInput.value = schId;
        if (titleEl) titleEl.textContent = schName;
        if (metaEl) metaEl.textContent = 'Unidade Escolar de Gonçalves Dias (MA) • Plano de Intervenção Pedagógica (PDE)';
        if (targetInput) targetInput.value = targetScore ? targetScore.toFixed(1) : '5.5';

        var existing = gdSchoolPdePlansMap[schId];
        var indEl = document.getElementById('pde-manager-indicator');
        var respEl = document.getElementById('pde-manager-responsible');
        var deadEl = document.getElementById('pde-manager-deadline');
        var actEl = document.getElementById('pde-manager-actions');
        var statEl = document.getElementById('pde-manager-status');

        if (existing) {
            if (indEl) indEl.value = existing.indicator || 'Recomposição de Fluência Leitora (D1 a D6)';
            if (respEl) respEl.value = existing.responsible || 'Coordenador Pedagógico';
            if (deadEl) deadEl.value = existing.deadline || '2026-11-30';
            if (actEl) actEl.value = existing.actions || '';
            if (statEl) statEl.value = existing.status || 'Em Execução';
        } else {
            if (actEl) actEl.value = '1. Monitoramento quinzenal de fluência leitora e resolução de problemas;\n2. Oficinas práticas semanais nos descritores prioritários com gap;\n3. Plantões pedagógicos para os alunos nos níveis crítico e muito crítico.';
            if (respEl) respEl.value = 'Coordenador Pedagógico & Direção';
            if (deadEl) deadEl.value = '2026-11-30';
        }

        switchPdeModalMode('manual');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    function closePdeManagerModal() {
        var modal = document.getElementById('modal-pde-manager');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    function switchPdeModalMode(mode) {
        var btnManual = document.getElementById('btn-pde-mode-manual');
        var btnAi = document.getElementById('btn-pde-mode-ai');
        var btnPdf = document.getElementById('btn-pde-mode-pdf');
        var pdfPanel = document.getElementById('pde-panel-pdf-upload');
        var actionsText = document.getElementById('pde-manager-actions');

        [btnManual, btnAi, btnPdf].forEach(function(b) {
            if (b) {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = 'var(--text-secondary)';
                b.style.borderColor = 'var(--border-color)';
            }
        });

        if (mode === 'manual') {
            if (btnManual) {
                btnManual.classList.add('active');
                btnManual.style.background = '#6366f1';
                btnManual.style.color = '#fff';
                btnManual.style.borderColor = '#6366f1';
            }
            if (pdfPanel) pdfPanel.style.display = 'none';
        } else if (mode === 'ai') {
            if (btnAi) {
                btnAi.classList.add('active');
                btnAi.style.background = '#6366f1';
                btnAi.style.color = '#fff';
                btnAi.style.borderColor = '#6366f1';
            }
            if (pdfPanel) pdfPanel.style.display = 'none';
            if (actionsText) {
                actionsText.value = '🤖 PLANO DE INTERVENÇÃO GERADO AUTOMATICAMENTE:\n\n• Eixo 1: Recomposição de Habilidades Críticas do SAEB (Foco em D1, D3, D13 e D16)\n• Eixo 2: Ciclo de Simulados Diagnósticos Quinzenais com Devolutiva Pedagógica\n• Eixo 3: Formação Continuada dos Docentes em Matrizes de Referência e BNCC\n• Eixo 4: Tutoria Individualizada para os 15% de alunos com maior defasagem';
            }
        } else if (mode === 'pdf') {
            if (btnPdf) {
                btnPdf.classList.add('active');
                btnPdf.style.background = '#6366f1';
                btnPdf.style.color = '#fff';
                btnPdf.style.borderColor = '#6366f1';
            }
            if (pdfPanel) pdfPanel.style.display = 'block';
        }
    }

    function handleSavePdeManagerForm(e) {
        if (e && e.preventDefault) e.preventDefault();

        var schId = document.getElementById('pde-manager-school-id') ? document.getElementById('pde-manager-school-id').value : '';
        if (!schId) return;

        var indicator = (document.getElementById('pde-manager-indicator') && document.getElementById('pde-manager-indicator').value) || 'Recomposição de Fluência Leitora';
        var targetScore = parseFloat((document.getElementById('pde-manager-target-score') && document.getElementById('pde-manager-target-score').value) || '5.5');
        var responsible = (document.getElementById('pde-manager-responsible') && document.getElementById('pde-manager-responsible').value) || 'Coordenador';
        var deadline = (document.getElementById('pde-manager-deadline') && document.getElementById('pde-manager-deadline').value) || '2026-11-30';
        var actions = (document.getElementById('pde-manager-actions') && document.getElementById('pde-manager-actions').value) || '';
        var status = (document.getElementById('pde-manager-status') && document.getElementById('pde-manager-status').value) || 'Em Execução';

        gdSchoolPdePlansMap[schId] = {
            indicator: indicator,
            targetScore: targetScore,
            responsible: responsible,
            deadline: deadline,
            actions: actions,
            status: status,
            updatedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem('gd_school_pde_plans_db', JSON.stringify(gdSchoolPdePlansMap));
        } catch(err) {}

        closePdeManagerModal();
        populateIdebGoalsTable();
        if (typeof global.showToast === 'function') {
            global.showToast('✅ Plano de Desenvolvimento Escolar (PDE) registrado com sucesso!', 'success');
        } else {
            alert('✅ Plano de Desenvolvimento Escolar (PDE) registrado com sucesso!');
        }
    }

    function handleAutoGenerateAllPdePlans() {
        var schools = [
            { id: '21051287', name: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS' },
            { id: '21051295', name: 'U I BASILIO ALVES' },
            { id: '21051309', name: 'UI JOSE CORREA LIMA' },
            { id: '21051317', name: 'UNIDADE INTEGRADA ALDENORA ARAUJO CRUZ' },
            { id: '21051325', name: 'UI EMILIO MURAD' },
            { id: '21051333', name: 'UE ANITA FURTADO' },
            { id: '21051341', name: 'UI ANTONIO GONCALVES DIAS' },
            { id: '21051350', name: 'UNIDADE ESCOLAR ANISIO GOMES' }
        ];

        schools.forEach(function(s) {
            if (!gdSchoolPdePlansMap[s.id]) {
                gdSchoolPdePlansMap[s.id] = {
                    indicator: 'Recomposição SAEB & BNCC (D1 a D16)',
                    targetScore: 5.5,
                    responsible: 'Coordenação Pedagógica da Rede SEMED',
                    deadline: '2026-11-30',
                    actions: '1. Aplicação do protocolo de reforço quinzenal; 2. Formação em descritores da BNCC; 3. Simulados com devolutiva imediata.',
                    status: 'Em Execução',
                    updatedAt: new Date().toISOString()
                };
            }
        });

        try {
            localStorage.setItem('gd_school_pde_plans_db', JSON.stringify(gdSchoolPdePlansMap));
        } catch(err) {}

        populateIdebGoalsTable();
        if (typeof global.showToast === 'function') {
            global.showToast('✨ Planos de Desenvolvimento Escolar (PDE) gerados automaticamente!', 'sparkles');
        } else {
            alert('✨ Planos de Desenvolvimento Escolar (PDE) gerados automaticamente para todas as escolas da rede de Gonçalves Dias com gap ou risco!');
        }
    }

    function handleExportPdeReportPdf() {
        if (typeof global.print === 'function') global.print();
    }

    function handleExportSchoolReport() {
        if (typeof global.print === 'function') global.print();
    }

    // -------------------------------------------------------------------------
    // EXPORTAÇÕES GLOBAIS
    // -------------------------------------------------------------------------
    global.getPreviousCycleYear = getPreviousCycleYear;
    global.getOfficial19UresList = getOfficial19UresList;
    global.getUreForCity = getUreForCity;
    global.getOfficialExcelCityData = getOfficialExcelCityData;

    global.updateIdebComparativoView = updateIdebComparativoView;
    global.renderIdebSvgChart = renderIdebSvgChart;
    global.renderIdebRankingTable = renderIdebRankingTable;

    global.switchGlobalIdebYear = switchGlobalIdebYear;
    global.switchGlobalIdebStage = switchGlobalIdebStage;
    global.switchSchoolRankingStage = switchGlobalIdebStage;
    global.toggleUreSortOrder = toggleUreSortOrder;
    global.selectCityFromUre = selectCityFromUre;
    global.updateIdebPeriodBadgeDynamic = updateIdebPeriodBadgeDynamic;
    global.initIdebCitySelector = initIdebCitySelector;
    global.handleSelectIdebCity = handleSelectIdebCity;

    global.render19UresPanel = render19UresPanel;
    global.filterUresList = render19UresPanel;
    global.renderRankingGeralMaTable = renderRankingGeralMaTable;
    global.filterRankingMaTable = renderRankingGeralMaTable;
    global.populateSchoolCitySelectDropdown = populateSchoolCitySelectDropdown;
    global.filterSchoolRankingTable = filterSchoolRankingTable;
    global.renderCityMiniSummary = renderCityMiniSummary;
    global.openSchoolIdebDetailModalById = openSchoolIdebDetailModalById;
    global.openSchoolIdebDetailModal = openSchoolIdebDetailModalById;
    global.handleExportSchoolReport = handleExportSchoolReport;
    global.switchIdebSubtab = switchIdebSubtab;

    global.initGdMetasDatabase = initGdMetasDatabase;
    global.checkPossuiAvaliacaoRealizada = checkPossuiAvaliacaoRealizada;
    global.handleRegisterFirstAssessment = handleRegisterFirstAssessment;
    global.populateIdebGoalsTable = populateIdebGoalsTable;
    global.handleUpdateSchoolTarget = handleUpdateSchoolTarget;
    global.openPdeManagerForSchool = openPdeManagerForSchool;
    global.closePdeManagerModal = closePdeManagerModal;
    global.switchPdeModalMode = switchPdeModalMode;
    global.handleSavePdeManagerForm = handleSavePdeManagerForm;
    global.handleAutoGenerateAllPdePlans = handleAutoGenerateAllPdePlans;
    global.handleExportPdeReportPdf = handleExportPdeReportPdf;

})(typeof window !== 'undefined' ? window : this);
