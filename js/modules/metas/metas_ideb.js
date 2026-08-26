/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — PAINEL GERAL DE METAS IDEB MUNICIPAIS (PDE)
 * Arquivo: js/modules/metas/metas_ideb.js
 * Descrição: Controlador principal de navegação temporal (2015-2025),
 *            seletor municipal, cards de síntese executiva e ciclo de vida.
 * ============================================================================
 */

(function(global) {
    'use strict';

    // Estado Global do Comparativo
    global.currentIdebYear = 2025;
    global.currentGlobalIdebYear = 2025;
    global.currentIdebStage = 'Anos Iniciais';
    global.currentGlobalIdebStage = 'Anos Iniciais';
    global.currentSelectedCity = 'Gonçalves Dias';
    global.currentUreSortOrder = 'media';

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
    // 1. CONTROLE DE ABAS E FILTROS DO COMPARATIVO
    // -------------------------------------------------------------------------

    function switchIdebSubtab(targetTab) {
        if (!targetTab) return;
        try {
            document.querySelectorAll('.ideb-regional-tab-btn').forEach(function(btn) {
                if (btn.getAttribute('data-tab') === targetTab) {
                    btn.classList.add('active');
                    btn.style.background = '#1A2D42';
                    btn.style.color = '#ffffff';
                    btn.style.border = 'none';
                    btn.style.fontWeight = '700';
                } else {
                    btn.classList.remove('active');
                    btn.style.background = '#D4D8DD';
                    btn.style.color = '#1A2D42';
                    btn.style.border = '1px solid #C0C8CA';
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
                if (typeof global.render19UresPanel === 'function') global.render19UresPanel();
            } else if (targetTab === 'ranking-geral-ma') {
                if (typeof global.populateRankingMaUreFilter === 'function') global.populateRankingMaUreFilter();
                if (typeof global.renderRankingGeralMaTable === 'function') global.renderRankingGeralMaTable();
            } else if (targetTab === 'ranking-escolas-ma') {
                if (typeof global.populateSchoolCitySelectDropdown === 'function') global.populateSchoolCitySelectDropdown();
                if (typeof global.filterSchoolRankingTable === 'function') global.filterSchoolRankingTable();
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
        if (typeof global.render19UresPanel === 'function') global.render19UresPanel();
        if (typeof global.renderRankingGeralMaTable === 'function') global.renderRankingGeralMaTable();
        if (typeof global.filterSchoolRankingTable === 'function') global.filterSchoolRankingTable();
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
        if (typeof global.render19UresPanel === 'function') global.render19UresPanel();
        if (typeof global.renderRankingGeralMaTable === 'function') global.renderRankingGeralMaTable();
        if (typeof global.filterSchoolRankingTable === 'function') global.filterSchoolRankingTable();
    }

    // -------------------------------------------------------------------------
    // 2. SUBTAB 1: PAINEL GERAL DO MUNICÍPIO
    // -------------------------------------------------------------------------

    function initIdebCitySelector() {
        var selector = document.getElementById('ideb-city-selector');
        if (!selector) return;

        var db = global.IDEB_MARANHAO_MUNICIPIOS || { iniciais: [], finais: [] };
        var allCities = [];
        if (Array.isArray(db.iniciais) && db.iniciais.length > 0) {
            allCities = db.iniciais.map(function(c) { return c.municipio; }).filter(Boolean);
        } else {
            var uresList = typeof global.getOfficial19UresList === 'function' ? global.getOfficial19UresList() : [];
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
        if (typeof global.populateRankingMaUreFilter === 'function') global.populateRankingMaUreFilter();
        if (typeof global.populateSchoolCitySelectDropdown === 'function') global.populateSchoolCitySelectDropdown();
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

        var ureName = typeof global.getUreForCity === 'function' ? global.getUreForCity(global.currentSelectedCity) : "URE Presidente Dutra";
        if (ureBadge) {
            ureBadge.innerHTML = '<span class="badge badge-purple" style="font-size: var(--text-xs); padding: 4px 10px; font-weight:700; background:rgba(99,102,241,0.1); color:#6366f1; border-radius:12px;">' + ureName + '</span>';
        }

        var activeStage = global.currentIdebStage || "Anos Iniciais";
        var activeYear = global.currentIdebYear || 2025;
        var prevYear = getPreviousCycleYear(activeYear);

        var currKey = 'y' + activeYear;
        var prevKey = 'y' + prevYear;

        var excelDataAI = typeof global.getOfficialExcelCityData === 'function' ? global.getOfficialExcelCityData(global.currentSelectedCity, 'Anos Iniciais') : null;
        var excelDataAF = typeof global.getOfficialExcelCityData === 'function' ? global.getOfficialExcelCityData(global.currentSelectedCity, 'Anos Finais') : null;
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
        var dbMun = global.IDEB_MARANHAO_MUNICIPIOS || { iniciais: [], finais: [] };
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
            var uresList = typeof global.getOfficial19UresList === 'function' ? global.getOfficial19UresList() : [];
            var targetUreObj = uresList.find(function(u) { return u.name === ureName; });
            if (targetUreObj && targetUreObj.cities) {
                targetUreObj.cities.forEach(function(c) {
                    var cData = typeof global.getOfficialExcelCityData === 'function' ? global.getOfficialExcelCityData(c, activeStage) : null;
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
    // 3. INICIALIZADOR GERAL
    // -------------------------------------------------------------------------

    function initIdebComparativoComplete() {
        initIdebCitySelector();
        if (typeof global.populateRankingMaUreFilter === 'function') global.populateRankingMaUreFilter();
        if (typeof global.populateSchoolCitySelectDropdown === 'function') global.populateSchoolCitySelectDropdown();
        handleSelectIdebCity(global.currentSelectedCity || 'Gonçalves Dias');
        if (typeof global.render19UresPanel === 'function') global.render19UresPanel();
        if (typeof global.renderRankingGeralMaTable === 'function') global.renderRankingGeralMaTable();
        if (typeof global.filterSchoolRankingTable === 'function') global.filterSchoolRankingTable();
        if (typeof global.populateIdebGoalsTable === 'function') global.populateIdebGoalsTable();
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initIdebComparativoComplete);
        } else {
            setTimeout(initIdebComparativoComplete, 50);
        }
    }

    // Exposição Global
    global.switchIdebSubtab = switchIdebSubtab;
    global.switchGlobalIdebYear = switchGlobalIdebYear;
    global.switchGlobalIdebStage = switchGlobalIdebStage;
    global.switchSchoolRankingStage = switchGlobalIdebStage;
    global.initIdebCitySelector = initIdebCitySelector;
    global.handleSelectIdebCity = handleSelectIdebCity;
    global.initIdebComparativoComplete = initIdebComparativoComplete;

})(typeof window !== 'undefined' ? window : this);
