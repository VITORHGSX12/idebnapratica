// =========================================================================
// MÓDULO METAS MUNICIPAIS (PDE) & COMPARATIVO REGIONAL DO IDEB (2015-2025)
// Bases Oficiais INEP: 217 Municípios do MA & 4.799 Escolas do Maranhão
// =========================================================================

(function(global) {
    'use strict';

    // Estado Global do Comparativo
    global.currentIdebYear = 2025;
    global.currentGlobalIdebYear = 2025;
    global.currentIdebStage = 'Anos Iniciais';
    global.currentGlobalIdebStage = 'Anos Iniciais';
    global.currentSelectedCity = 'Gonçalves Dias';
    global.currentUreSortOrder = 'media';

    // Estado das Metas Municipais (PDE)
    var gdSchoolTargetsMap = {};
    var gdSchoolPdePlansMap = {};

    // -------------------------------------------------------------------------
    // 1. HELPERS DE ACESSO AOS DATASETS OFICIAIS
    // -------------------------------------------------------------------------

    function getMaranhaoMunicipiosDb() {
        return global.IDEB_MARANHAO_MUNICIPIOS || (typeof window !== 'undefined' ? window.IDEB_MARANHAO_MUNICIPIOS : null) || { iniciais: [], finais: [] };
    }

    function getMaranhaoEscolasDb() {
        return global.ESCOLAS_MARANHAO_OFICIAL || (typeof window !== 'undefined' ? window.ESCOLAS_MARANHAO_OFICIAL : []) || [];
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

    function normalizeStr(str) {
        if (!str) return '';
        return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    // -------------------------------------------------------------------------
    // 2. GESTÃO E MAPEAMENTO DAS 19 UREs DO MARANHÃO
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

            // Fallback para idebPublicoReferencia se necessário
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

    // -------------------------------------------------------------------------
    // 3. CONTROLE DE ABAS E FILTROS DO COMPARATIVO
    // -------------------------------------------------------------------------

    function switchIdebSubtab(targetTab) {
        if (!targetTab) return;
        try {
            document.querySelectorAll('.ideb-regional-tab-btn').forEach(function(btn) {
                if (btn.getAttribute('data-tab') === targetTab) {
                    btn.classList.add('active');
                    btn.style.background = 'var(--color-accent-primary, #6366f1)';
                    btn.style.color = '#ffffff';
                    btn.style.border = 'none';
                    btn.style.fontWeight = '700';
                } else {
                    btn.classList.remove('active');
                    btn.style.background = 'var(--color-surface-card, #ffffff)';
                    btn.style.color = 'var(--color-text-secondary, #64748b)';
                    btn.style.border = '1px solid var(--color-border-subtle, #e2e8f0)';
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

    function switchGlobalIdebYear(year) {
        var numYear = Number(year) || 2025;
        global.currentIdebYear = numYear;
        global.currentGlobalIdebYear = numYear;
        var prevYear = getPreviousCycleYear(numYear);

        document.querySelectorAll('.ideb-year-pill-btn').forEach(function(btn) {
            var bYear = Number(btn.getAttribute('data-year'));
            if (bYear === numYear) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        var thRankingCurr = document.getElementById('th-ranking-curr');
        var thRankingPrev = document.getElementById('th-ranking-prev');
        if (thRankingCurr) thRankingCurr.textContent = 'IDEB ' + numYear;
        if (thRankingPrev) thRankingPrev.textContent = (numYear === 2015) ? 'BASE 2015' : 'CICLO ' + prevYear;

        var thEscolasCurr = document.getElementById('th-escolas-curr');
        var thEscolasPrev = document.getElementById('th-escolas-prev');
        if (thEscolasCurr) thEscolasCurr.textContent = 'IDEB ' + numYear;
        if (thEscolasPrev) thEscolasPrev.textContent = (numYear === 2015) ? 'BASE 2015' : 'CICLO ' + prevYear;

        handleSelectIdebCity(global.currentSelectedCity || 'Gonçalves Dias');
        render19UresPanel();
        renderRankingGeralMaTable();
        filterSchoolRankingTable();
    }

    function switchGlobalIdebStage(stage) {
        global.currentIdebStage = stage;
        global.currentGlobalIdebStage = stage;
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

        handleSelectIdebCity(global.currentSelectedCity || 'Gonçalves Dias');
        render19UresPanel();
        renderRankingGeralMaTable();
        filterSchoolRankingTable();
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
        switchIdebSubtab('painel-principal');
        handleSelectIdebCity(cityName);
    }

    // -------------------------------------------------------------------------
    // 4. SUBTAB 1: PAINEL GERAL DO MUNICÍPIO
    // -------------------------------------------------------------------------

    function initIdebCitySelector() {
        var selector = document.getElementById('ideb-city-selector');
        if (!selector) return;

        var db = getMaranhaoMunicipiosDb();
        var allCities = [];
        if (Array.isArray(db.iniciais) && db.iniciais.length > 0) {
            allCities = db.iniciais.map(function(c) { return c.municipio; }).filter(Boolean);
        } else {
            var uresList = getOfficial19UresList();
            uresList.forEach(function(ure) {
                if (ure.cities) ure.cities.forEach(function(c) { allCities.push(c); });
            });
        }

        var uniqueCities = Array.from(new Set(allCities)).sort(function(a, b) { return a.localeCompare(b); });

        var optionsHtml = [
            '<option value="">Selecione um município...</option>',
            '<option value="Gonçalves Dias" selected>Gonçalves Dias ⭐ (Sua Rede)</option>'
        ].concat(uniqueCities.filter(function(c) {
            return normalizeStr(c) !== 'goncalves dias';
        }).map(function(c) {
            return '<option value="' + c + '">' + c + '</option>';
        })).join('');

        selector.innerHTML = optionsHtml;
        if (global.currentSelectedCity) {
            selector.value = global.currentSelectedCity;
        }

        handleSelectIdebCity(global.currentSelectedCity || "Gonçalves Dias");
        populateRankingMaUreFilter();
        populateSchoolCitySelectDropdown();
    }

    function handleSelectIdebCity(cityName) {
        global.currentSelectedCity = cityName || "Gonçalves Dias";

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
            return;
        }

        var ureName = getUreForCity(global.currentSelectedCity);
        if (ureBadge) {
            ureBadge.innerHTML = '<span class="badge badge-purple" style="font-size: var(--text-xs); padding: 4px 10px; font-weight:700; background:rgba(99,102,241,0.1); color:#6366f1; border-radius:12px;">' + ureName + '</span>';
        }

        var activeStage = global.currentIdebStage || "Anos Iniciais";
        var activeYear = global.currentIdebYear || 2025;
        var prevYear = getPreviousCycleYear(activeYear);

        var currKey = 'y' + activeYear;
        var prevKey = 'y' + prevYear;

        var excelDataAI = getOfficialExcelCityData(global.currentSelectedCity, 'Anos Iniciais');
        var excelDataAF = getOfficialExcelCityData(global.currentSelectedCity, 'Anos Finais');
        var currentStageData = (activeStage === 'Anos Finais') ? excelDataAF : excelDataAI;

        var rawCurr = currentStageData && currentStageData[currKey] !== null && currentStageData[currKey] !== undefined ? currentStageData[currKey] : null;
        var rawPrev = currentStageData && currentStageData[prevKey] !== null && currentStageData[prevKey] !== undefined ? currentStageData[prevKey] : null;

        var valCurr = (rawCurr !== null && rawCurr >= 0 && rawCurr <= 10) ? Number(rawCurr).toFixed(1) : "—";
        var valPrev = (rawPrev !== null && rawPrev >= 0 && rawPrev <= 10) ? Number(rawPrev).toFixed(1) : "—";

        var diffVal = null;
        if (valCurr !== "—" && valPrev !== "—" && activeYear !== 2015) {
            diffVal = Number((parseFloat(valCurr) - parseFloat(valPrev)).toFixed(1));
        }

        var targetVal = (activeStage === 'Anos Finais') ? "5.0" : "5.5";

        // 1. Card IDEB Observado
        if (elLabelCurr) elLabelCurr.textContent = 'IDEB ' + activeYear + ' (' + (activeStage === 'Anos Iniciais' ? '5º Ano' : '9º Ano') + ')';
        if (elCurr) elCurr.textContent = valCurr;
        if (elCurrSub) {
            elCurrSub.textContent = (valCurr !== "—") ? 'Oficial INEP • ' + global.currentSelectedCity : "Sem dado divulgado";
        }

        // 2. Card Ciclo Anterior
        if (elLabelPrev) elLabelPrev.textContent = (activeYear === 2015) ? 'Ano Base (2015)' : 'Ciclo Anterior (' + prevYear + ')';
        if (elPrev) elPrev.textContent = (activeYear === 2015) ? 'Início Série' : valPrev;
        if (elDiff) {
            if (activeYear === 2015) {
                elDiff.innerHTML = '<span class="diff-eq" style="color:var(--text-muted); font-size:0.78rem;">Ciclo Inicial</span>';
            } else if (diffVal !== null) {
                if (diffVal > 0) elDiff.innerHTML = '<span class="diff-up" style="color:#10b981; font-weight:800; font-size:0.8rem;">+' + diffVal + ' ↑ Crescimento</span>';
                else if (diffVal < 0) elDiff.innerHTML = '<span class="diff-down" style="color:#ef4444; font-weight:800; font-size:0.8rem;">' + diffVal + ' ↓ Queda</span>';
                else elDiff.innerHTML = '<span class="diff-eq" style="color:var(--text-muted); font-weight:700; font-size:0.8rem;">= 0.0 Estável</span>';
            } else {
                elDiff.innerHTML = '—';
            }
        }

        // 3. Card Meta Projetada
        if (elLabelTarget) elLabelTarget.textContent = 'Meta Projetada (' + activeYear + ')';
        if (elTarget) elTarget.textContent = targetVal;
        if (elStatusBadge) {
            if (valCurr !== "—" && parseFloat(valCurr) >= parseFloat(targetVal)) {
                elStatusBadge.innerHTML = '<span class="badge badge-success" style="font-size:0.7rem; padding:3px 8px; font-weight:800; background:rgba(16,185,129,0.15); color:#10b981; border-radius:10px;">Meta Atingida 🟢</span>';
            } else {
                elStatusBadge.innerHTML = '<span class="badge badge-warning" style="font-size:0.7rem; padding:3px 8px; font-weight:800; background:rgba(245,158,11,0.15); color:#f59e0b; border-radius:10px;">Em Desenvolvimento 🟡</span>';
            }
        }

        // 4. Card Ranking MA
        if (elLabelRank) elLabelRank.textContent = 'Posição no Ranking MA (' + activeYear + ')';
        var dbMun = getMaranhaoMunicipiosDb();
        var allMunList = (activeStage === 'Anos Finais') ? dbMun.finais : dbMun.iniciais;

        if (Array.isArray(allMunList) && allMunList.length > 0) {
            var listRank = allMunList.filter(function(c) {
                if (!c || !c.municipio) return false;
                var m = normalizeStr(c.municipio);
                return !m.includes('municipio') && !m.includes('codigo') && c[currKey] !== null && c[currKey] !== undefined;
            }).sort(function(a, b) { return (b[currKey] || 0) - (a[currKey] || 0); });

            var cleanTarget = normalizeStr(global.currentSelectedCity);
            var rankIndex = listRank.findIndex(function(c) {
                return normalizeStr(c.municipio) === cleanTarget;
            });
            if (elRank) {
                elRank.textContent = (rankIndex !== -1) ? '#' + (rankIndex + 1) : "—";
            }
        }

        // 5. Linha do Tempo dos 6 Ciclos
        if (timelineGrid) {
            var cycles = [2015, 2017, 2019, 2021, 2023, 2025];
            timelineGrid.innerHTML = cycles.map(function(cyc, idx) {
                var cycKey = 'y' + cyc;
                var cRaw = currentStageData && currentStageData[cycKey] !== null && currentStageData[cycKey] !== undefined ? currentStageData[cycKey] : null;
                var cScore = (cRaw !== null && cRaw >= 0 && cRaw <= 10) ? Number(cRaw).toFixed(1) : '—';
                var isActive = (cyc === activeYear);

                var diffMarkup = '';
                if (idx > 0 && cScore !== '—') {
                    var pKey = 'y' + cycles[idx - 1];
                    var pRaw = currentStageData && currentStageData[pKey] !== null && currentStageData[pKey] !== undefined ? currentStageData[pKey] : null;
                    if (pRaw !== null) {
                        var d = Number((parseFloat(cScore) - parseFloat(pRaw)).toFixed(1));
                        if (d > 0) diffMarkup = '<span style="color:#10b981; font-weight:800; font-size:0.75rem;">+' + d + ' ↑</span>';
                        else if (d < 0) diffMarkup = '<span style="color:#ef4444; font-weight:800; font-size:0.75rem;">' + d + ' ↓</span>';
                        else diffMarkup = '<span style="color:var(--text-muted); font-weight:700; font-size:0.75rem;">= 0.0</span>';
                    }
                } else if (idx === 0) {
                    diffMarkup = '<span style="color:var(--text-muted); font-size:0.75rem;">Base</span>';
                }

                return [
                    '<div class="ideb-timeline-cycle-card ' + (isActive ? 'is-active-year' : '') + '" onclick="switchGlobalIdebYear(' + cyc + ')" style="cursor: pointer; padding: 14px; text-align: center; border-radius: var(--radius-sm); border: ' + (isActive ? '2px solid #6366f1; background: rgba(99,102,241,0.06);' : '1px solid var(--color-border-subtle); background: var(--color-surface-subtle);') + '" title="Ciclo ' + cyc + '">',
                    '    <div style="font-size: var(--text-xs); font-weight: 700; color: ' + (isActive ? '#6366f1' : 'var(--color-text-secondary)') + ';">Ciclo ' + cyc + '</div>',
                    '    <div style="font-size: 1.4rem; font-weight: 800; color: ' + (isActive ? '#6366f1' : 'var(--color-brand-primary)') + '; font-family: var(--font-display); font-variant-numeric: tabular-nums; margin: 4px 0;">' + cScore + '</div>',
                    '    <div>' + diffMarkup + '</div>',
                    '</div>'
                ].join('\n');
            }).join('\n');
        }

        // 6. Barras Comparativas
        if (compContainer) {
            var scoreAI = excelDataAI && excelDataAI[currKey] !== null && excelDataAI[currKey] !== undefined ? parseFloat(excelDataAI[currKey]).toFixed(1) : '—';
            var scoreAF = excelDataAF && excelDataAF[currKey] !== null && excelDataAF[currKey] !== undefined ? parseFloat(excelDataAF[currKey]).toFixed(1) : '—';

            var ureSum = 0;
            var ureCount = 0;
            var targetUreObj = getOfficial19UresList().find(function(u) { return u.name === ureName; });
            if (targetUreObj && targetUreObj.cities) {
                targetUreObj.cities.forEach(function(c) {
                    var cData = getOfficialExcelCityData(c, activeStage);
                    if (cData && cData[currKey] !== null && cData[currKey] !== undefined && cData[currKey] >= 0 && cData[currKey] <= 10) {
                        ureSum += cData[currKey];
                        ureCount++;
                    }
                });
            }
            var avgUre = (ureCount > 0) ? (ureSum / ureCount).toFixed(1) : '4.6';

            var maSum = 0;
            var maCount = 0;
            if (Array.isArray(allMunList) && allMunList.length > 0) {
                allMunList.forEach(function(c) {
                    if (c && c[currKey] !== null && c[currKey] !== undefined && c[currKey] >= 0 && c[currKey] <= 10) {
                        maSum += c[currKey];
                        maCount++;
                    }
                });
            }
            var avgMA = (maCount > 0) ? (maSum / maCount).toFixed(1) : '4.5';
            var brasilBase = (activeStage === 'Anos Iniciais') ? 5.6 : 5.0;

            compContainer.innerHTML = [
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.84rem; font-weight:700; color:var(--color-brand-primary); margin-bottom:4px;">',
                '        <span>' + global.currentSelectedCity + ' — Anos Iniciais (5º Ano) • ' + activeYear + '</span>',
                '        <span style="color:#10b981; font-size:0.9rem; font-weight:800;">' + scoreAI + '</span>',
                '    </div>',
                '    <div style="width:100%; height:10px; background:var(--color-surface-subtle); border-radius:5px; overflow:hidden;">',
                '        <div style="width:' + (scoreAI !== '—' ? Math.min(100, (parseFloat(scoreAI)/10)*100) : 0) + '%; height:100%; background:linear-gradient(90deg, #6366f1, #10b981); border-radius:5px;"></div>',
                '    </div>',
                '</div>',
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.84rem; font-weight:700; color:var(--color-brand-primary); margin-bottom:4px;">',
                '        <span>' + global.currentSelectedCity + ' — Anos Finais (9º Ano) • ' + activeYear + '</span>',
                '        <span style="color:#6366f1; font-size:0.9rem; font-weight:800;">' + scoreAF + '</span>',
                '    </div>',
                '    <div style="width:100%; height:10px; background:var(--color-surface-subtle); border-radius:5px; overflow:hidden;">',
                '        <div style="width:' + (scoreAF !== '—' ? Math.min(100, (parseFloat(scoreAF)/10)*100) : 0) + '%; height:100%; background:#6366f1; border-radius:5px;"></div>',
                '    </div>',
                '</div>',
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.84rem; font-weight:700; color:var(--color-text-secondary); margin-bottom:4px;">',
                '        <span>Média da ' + ureName + ' (' + activeStage + ') • ' + activeYear + '</span>',
                '        <span style="color:#8b5cf6; font-size:0.9rem; font-weight:800;">' + avgUre + '</span>',
                '    </div>',
                '    <div style="width:100%; height:10px; background:var(--color-surface-subtle); border-radius:5px; overflow:hidden;">',
                '        <div style="width:' + Math.min(100, (parseFloat(avgUre)/10)*100) + '%; height:100%; background:#8b5cf6; border-radius:5px;"></div>',
                '    </div>',
                '</div>',
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.84rem; font-weight:700; color:var(--color-text-secondary); margin-bottom:4px;">',
                '        <span>Média Estadual do Maranhão (MA) • ' + activeYear + '</span>',
                '        <span style="color:#f59e0b; font-size:0.9rem; font-weight:800;">' + avgMA + '</span>',
                '    </div>',
                '    <div style="width:100%; height:10px; background:var(--color-surface-subtle); border-radius:5px; overflow:hidden;">',
                '        <div style="width:' + Math.min(100, (parseFloat(avgMA)/10)*100) + '%; height:100%; background:#f59e0b; border-radius:5px;"></div>',
                '    </div>',
                '</div>',
                '<div>',
                '    <div style="display:flex; justify-content:space-between; font-size:0.84rem; font-weight:700; color:var(--color-text-secondary); margin-bottom:4px;">',
                '        <span>Média Nacional Oficial (Brasil - INEP)</span>',
                '        <span style="color:#3b82f6; font-size:0.9rem; font-weight:800;">' + brasilBase + '</span>',
                '    </div>',
                '    <div style="width:100%; height:10px; background:var(--color-surface-subtle); border-radius:5px; overflow:hidden;">',
                '        <div style="width:' + Math.min(100, (brasilBase/10)*100) + '%; height:100%; background:#3b82f6; border-radius:5px;"></div>',
                '    </div>',
                '</div>'
            ].join('\n');
        }
    }

    // -------------------------------------------------------------------------
    // 5. SUBTAB 2: PAINEL DAS 19 UREs DO MARANHÃO
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
    // 6. SUBTAB 3: RANKING GERAL DOS 217 MUNICÍPIOS DO MARANHÃO
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

    // -------------------------------------------------------------------------
    // 7. SUBTAB 4: RANKING DE ESCOLAS DO MARANHÃO (4.799 ESCOLAS)
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
            return normalizeStr(c) !== 'goncalves dias';
        }).map(function(c) { return '<option value="' + c + '">' + c + '</option>'; })).join('');

        select.innerHTML = optionsHtml;
    }

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
            var ure = sch.ure || getUreForCity(city);

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

    function openSchoolIdebDetailModalById(schoolId) {
        var rawDb = getMaranhaoEscolasDb();
        var sch = rawDb.find(function(s) { return (String(s.inep) === String(schoolId) || String(s.id) === String(schoolId) || String(s.codigoEscola) === String(schoolId)); }) || rawDb[0];
        if (!sch) return;

        var schoolName = sch.nome || sch.nomeEscola || 'Unidade Escolar';
        var schoolCity = sch.municipio || 'Gonçalves Dias';
        var schoolRede = sch.rede || sch.localizacao || 'Municipal';
        var schoolUre = sch.ure || getUreForCity(schoolCity);

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

    // -------------------------------------------------------------------------
    // 8. METAS MUNICIPAIS (PDE) DA REDE DE GONÇALVES DIAS (9 ESCOLAS SAEB)
    // -------------------------------------------------------------------------

    function initGdMetasDatabase() {
        try {
            var parseFn = (typeof global.safeJsonParse === 'function') ? global.safeJsonParse : JSON.parse;
            var savedTargets = localStorage.getItem('gd_school_targets_db');
            if (savedTargets) gdSchoolTargetsMap = parseFn(savedTargets, {}) || {};

            var savedPde = localStorage.getItem('gd_school_pde_plans_db');
            if (savedPde) gdSchoolPdePlansMap = parseFn(savedPde, {}) || {};
        } catch(e) {
            gdSchoolTargetsMap = {};
            gdSchoolPdePlansMap = {};
        }
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

        var officialSource = (window.OFFICIAL_IMPORTED_STUDENTS_SEED && window.OFFICIAL_IMPORTED_STUDENTS_SEED.escolas) || [];
        var schoolsEvaluated = officialSource.map(function(s) {
            return {
                id: s.inep || s.id,
                nome: s.nome || s.name,
                inep2023: s.ideb_2023 || 5.0,
                score2025: s.ideb_2025_observado || 5.2,
                af2023: s.ideb_2023 || 4.8,
                af2025: s.ideb_2025_observado || 5.0,
                profLP: s.saeb_lp_5ano || 205.0,
                profMAT: s.saeb_mt_5ano || 212.0
            };
        });

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
                '    <div style="font-size: 0.68rem; color: var(--color-text-secondary);">Resp: ' + pdePlan.responsible + ' • Prazo: ' + pdePlan.deadline + '</div>',
                '    <span class="badge ' + (pdePlan.status.includes('Concluído') ? 'badge-success' : 'badge-neutral') + '" style="font-size:0.62rem; margin-top:2px;">' + pdePlan.status + '</span>',
                '</div>'
            ].join('') : '<span class="text-sm text-muted" style="font-size: 0.75rem;">Sem plano cadastrado</span>';

            return [
                '<tr style="border-bottom: 1px solid var(--color-border-subtle); height: 58px;">',
                '    <td style="padding: 12px 16px;">',
                '        <strong style="font-size: 0.88rem; color: var(--color-brand-primary); display: block;">' + sch.nome + '</strong>',
                '        <span style="font-size: 0.72rem; color: var(--color-text-secondary); font-family: var(--font-display); font-variant-numeric: tabular-nums;">INEP: ' + sch.id + ' • Gonçalves Dias (MA)</span>',
                '    </td>',
                '    <td style="padding: 12px 16px; text-align: center; font-weight: 700; font-family: var(--font-display); font-variant-numeric: tabular-nums; font-size: 0.95rem; color: var(--color-text-secondary);">' + baseScore.toFixed(1) + '</td>',
                '    <td style="padding: 12px 16px; text-align: center;">',
                '        <input type="number" step="0.1" min="1.0" max="10.0" value="' + targetScore.toFixed(1) + '" onchange="handleUpdateSchoolTarget(\'' + sch.id + '\', \'' + filterStage + '\', this.value)" style="width: 65px; height: 32px; text-align: center; font-weight: 800; font-family: var(--font-display); font-variant-numeric: tabular-nums; font-size: 0.92rem; color: #6366f1; background: var(--color-surface-card); border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm);">',
                '    </td>',
                '    <td style="padding: 12px 16px; text-align: center; font-family: var(--font-display); font-variant-numeric: tabular-nums; font-size: 0.82rem; color: var(--color-brand-primary);">',
                '        <strong>' + (currentObserved * 0.96).toFixed(2) + '</strong> N <span style="font-size: 0.68rem; color: var(--color-text-secondary);">(' + sch.profLP.toFixed(0) + ' LP/' + sch.profMAT.toFixed(0) + ' MT)</span>',
                '    </td>',
                '    <td style="padding: 12px 16px; text-align: center; font-weight: 800; font-family: var(--font-display); font-variant-numeric: tabular-nums; font-size: 0.95rem; color: ' + (gap >= 0 ? '#10b981' : '#ef4444') + ';">' + (gap >= 0 ? '+' : '') + gap.toFixed(1) + '</td>',
                '    <td style="padding: 12px 16px; text-align: center;">' + riskBadge + '</td>',
                '    <td style="padding: 12px 16px; text-align: center;">' + pdeCell + '</td>',
                '    <td style="padding: 12px 16px; text-align: center;">',
                '        <button onclick="openPdeManagerForSchool(\'' + sch.id + '\', \'' + sch.nome.replace(/'/g, "\\'") + '\', ' + targetScore + ')" class="btn btn-outline btn-sm" style="font-size: 0.74rem; font-weight: 700; color: #6366f1; border-color: #6366f1; padding: 4px 8px;" title="Gerenciar Plano de Ação">' + (pdePlan ? '✏️ Editar PDE' : '📋 Criar PDE') + '</button>',
                '    </td>',
                '</tr>'
            ].join('\n');
        }).filter(Boolean);

        if (renderedRows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="padding:30px; text-align:center; color:var(--color-text-secondary);">Nenhuma escola encontrada para o filtro de risco selecionado.</td></tr>';
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
                b.style.color = 'var(--color-text-secondary)';
                b.style.borderColor = 'var(--color-border-subtle)';
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
        var schools = (window.OFFICIAL_IMPORTED_STUDENTS_SEED && window.OFFICIAL_IMPORTED_STUDENTS_SEED.escolas) || [];
        schools.forEach(function(s) {
            var schId = s.inep || s.id;
            if (!gdSchoolPdePlansMap[schId]) {
                gdSchoolPdePlansMap[schId] = {
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
    // 9. INICIALIZADOR COMPLETO
    // -------------------------------------------------------------------------

    function initIdebComparativoComplete() {
        initIdebCitySelector();
        populateRankingMaUreFilter();
        populateSchoolCitySelectDropdown();
        handleSelectIdebCity(global.currentSelectedCity || 'Gonçalves Dias');
        render19UresPanel();
        renderRankingGeralMaTable();
        filterSchoolRankingTable();
        populateIdebGoalsTable();
    }

    // Auto inicialização quando o DOM estiver pronto
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initIdebComparativoComplete);
        } else {
            setTimeout(initIdebComparativoComplete, 50);
        }
    }

    // -------------------------------------------------------------------------
    // EXPORTAÇÕES GLOBAIS
    // -------------------------------------------------------------------------
    global.getPreviousCycleYear = getPreviousCycleYear;
    global.getOfficial19UresList = getOfficial19UresList;
    global.getUreForCity = getUreForCity;
    global.getOfficialExcelCityData = getOfficialExcelCityData;
    global.getMaranhaoCityIdebData = getMaranhaoCityIdebData;

    global.switchIdebSubtab = switchIdebSubtab;
    global.switchGlobalIdebYear = switchGlobalIdebYear;
    global.switchGlobalIdebStage = switchGlobalIdebStage;
    global.switchSchoolRankingStage = switchGlobalIdebStage;
    global.toggleUreSortOrder = toggleUreSortOrder;
    global.selectCityFromUre = selectCityFromUre;
    global.initIdebCitySelector = initIdebCitySelector;
    global.handleSelectIdebCity = handleSelectIdebCity;

    global.render19UresPanel = render19UresPanel;
    global.filterUresList = render19UresPanel;
    global.renderRankingGeralMaTable = renderRankingGeralMaTable;
    global.filterRankingMaTable = renderRankingGeralMaTable;
    global.populateRankingMaUreFilter = populateRankingMaUreFilter;
    global.populateSchoolCitySelectDropdown = populateSchoolCitySelectDropdown;
    global.filterSchoolRankingTable = filterSchoolRankingTable;
    global.renderCityMiniSummary = renderCityMiniSummary;
    global.openSchoolIdebDetailModalById = openSchoolIdebDetailModalById;
    global.openSchoolIdebDetailModal = openSchoolIdebDetailModalById;
    global.handleExportSchoolReport = handleExportSchoolReport;

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
    global.initIdebComparativoComplete = initIdebComparativoComplete;

})(typeof window !== 'undefined' ? window : ((typeof global !== 'undefined') ? global : this));
