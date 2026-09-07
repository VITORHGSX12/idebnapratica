/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MANUAL & CALCULADORA OFICIAL IDEB E VAAR (INEP/MEC)
 * Arquivo: js/modules/metas/metas_calculo_manual.js
 * Descrição: Implementação das metodologias oficiais das Notas Técnicas:
 *            - Nota Técnica Conjunta nº 23/2023 / Nota Técnica nº 7/2024 / Errata nº 12/2024 (INEP)
 *            - Metodologia de Cálculo do IDEB = N x P (Fernandes, 2007)
 *            - Indicador de Nível de Desempenho (IND), Avanço (IAD) e Inad do VAAR / FUNDEB
 * ============================================================================
 */

(function(global) {
    'use strict';

    // 1. PONTOS DE CORTE OFICIAIS DO INEP (TABELA 1 - NOTA TÉCNICA 7/2024 E 23/2023)
    var PONTOS_CORTE_SAEB = {
        '5': {
            etapaLabel: '5º Ano do Ensino Fundamental (Anos Iniciais)',
            lp: { corte: 200.0, nivelMin: 4, label: 'Nível 4 ou superior (Proficiente)' },
            mat: { corte: 225.0, nivelMin: 5, label: 'Nível 5 ou superior (Proficiente)' },
            baseProfMin: 100.0,
            baseProfMax: 350.0
        },
        '9': {
            etapaLabel: '9º Ano do Ensino Fundamental (Anos Finais)',
            lp: { corte: 275.0, nivelMin: 4, label: 'Nível 4 ou superior (Proficiente)' },
            mat: { corte: 300.0, nivelMin: 5, label: 'Nível 5 ou superior (Proficiente)' },
            baseProfMin: 150.0,
            baseProfMax: 400.0
        }
    };

    // 2. CENÁRIOS PREDEFINIDOS PARA ANÁLISE RÁPIDA (PRESETS)
    var IDEB_PRESETS = {
        'atual-5ano': {
            label: 'Rede Gonçalves Dias Atual (5º Ano)',
            etapa: '5',
            profLp: 205.0,
            profMat: 215.0,
            pAdeqLp: 58,
            pAdeqMat: 52,
            tap: 96.0,
            part: 88.0,
            indAnt: 4.8
        },
        'meta-pde-2025': {
            label: 'Meta PDE 2025 (Salto de Qualidade)',
            etapa: '5',
            profLp: 225.0,
            profMat: 235.0,
            pAdeqLp: 72,
            pAdeqMat: 68,
            tap: 98.0,
            part: 94.0,
            indAnt: 5.28
        },
        'anos-finais-9ano': {
            label: '9º Ano EF (Anos Finais)',
            etapa: '9',
            profLp: 278.0,
            profMat: 295.0,
            pAdeqLp: 62,
            pAdeqMat: 54,
            tap: 94.5,
            part: 86.0,
            indAnt: 4.5
        },
        'alerta-presenca': {
            label: 'Cenário Alerta VAAR (Presença < 80%)',
            etapa: '5',
            profLp: 210.0,
            profMat: 220.0,
            pAdeqLp: 60,
            pAdeqMat: 55,
            tap: 95.0,
            part: 72.0,
            indAnt: 4.8
        }
    };

    /**
     * 3. CÁLCULO CLÁSSICO DO IDEB (FERNANDES, 2007 - INEP / MEC)
     * Fórmula: IDEB = N x P
     * N = (N_LP + N_MAT) / 2  (Média padronizada do SAEB de 0 a 10)
     * P = Taxa de Aprovação / Rendimento Escolar (de 0 a 1)
     */
    function calcularIdebClassico(profLp, profMat, taxaAprovacaoPct, etapa) {
        var etapaKey = String(etapa || '5');
        var cfg = PONTOS_CORTE_SAEB[etapaKey] || PONTOS_CORTE_SAEB['5'];
        
        // Padronização do SAEB (Escala 0 a 10)
        var divFactor = (etapaKey === '9') ? 27.5 : 25.0;
        var offsetLp = (etapaKey === '9') ? 140.0 : 100.0;
        var offsetMat = (etapaKey === '9') ? 150.0 : 100.0;

        var nLp = Math.max(0.0, Math.min(10.0, (profLp - offsetLp) / divFactor));
        var nMat = Math.max(0.0, Math.min(10.0, (profMat - offsetMat) / divFactor));
        
        var nMedio = (nLp + nMat) / 2.0;
        var pRendimento = Math.max(0.0, Math.min(1.0, taxaAprovacaoPct / 100.0));
        var idebFinal = nMedio * pRendimento;

        return {
            nLp: Number(nLp.toFixed(2)),
            nMat: Number(nMat.toFixed(2)),
            nMedio: Number(nMedio.toFixed(2)),
            pRendimento: Number(pRendimento.toFixed(4)),
            ideb: Number(idebFinal.toFixed(2)),
            formulaN: `(${nLp.toFixed(2)} + ${nMat.toFixed(2)}) / 2 = ${nMedio.toFixed(2)}`,
            formulaIdeb: `${nMedio.toFixed(2)} × ${pRendimento.toFixed(4)} = ${idebFinal.toFixed(2)}`
        };
    }

    /**
     * 4. CÁLCULO DOS INDICADORES DO VAAR / FUNDEB (NOTA TÉCNICA Nº 7/2024 / NT 23/2023)
     * IND = PAdeq_medio * TAp * 10
     * IAD = IND_t - IND_t-1
     * Inad = 0.3 * IND + 0.7 * IAD
     */
    function calcularIndicadoresVaar(pctAdequadoLp, pctAdequadoMat, taxaAprovacaoPct, taxaParticipacaoPct, indAnterior) {
        var pAdeqLp = Math.max(0.0, Math.min(1.0, pctAdequadoLp / 100.0));
        var pAdeqMat = Math.max(0.0, Math.min(1.0, pctAdequadoMat / 100.0));
        var pAdeqMedio = (pAdeqLp + pAdeqMat) / 2.0;

        var tAp = Math.max(0.0, Math.min(1.0, taxaAprovacaoPct / 100.0));
        
        // Fator de Participação no SAEB (Mínimo exigido em lei: 80%)
        var partFactor = 1.0;
        if (taxaParticipacaoPct < 80.0) {
            partFactor = Math.max(0.0, taxaParticipacaoPct / 80.0);
        }

        // Indicador de Nível de Desempenho (IND) com escala 0 a 10
        var indBruto = pAdeqMedio * tAp * 10.0;
        var indAjustado = indBruto * partFactor;

        // Indicador de Avanço de Desempenho (IAD)
        var iad = indAjustado - indAnterior;

        // Índice de Nível e Avanço (Inad: 30% nível + 70% avanço)
        var inad = (0.3 * indAjustado) + (0.7 * iad);

        // Diagnóstico de Habilitação ao VAAR
        var habilitado = (taxaParticipacaoPct >= 80.0) && (iad > 0.0);

        var motivoAlerta = '';
        if (!habilitado) {
            if (taxaParticipacaoPct < 80.0 && iad <= 0.0) {
                motivoAlerta = 'Presença abaixo de 80% e Avanço IAD ≤ 0';
            } else if (taxaParticipacaoPct < 80.0) {
                motivoAlerta = 'Presença no SAEB inferior a 80% (Art. 14)';
            } else {
                motivoAlerta = 'Sem evolução positiva no ciclo (IAD ≤ 0)';
            }
        }

        return {
            pAdeqMedio: Number((pAdeqMedio * 100).toFixed(1)),
            tApPct: Number((tAp * 100).toFixed(1)),
            partFactor: Number(partFactor.toFixed(3)),
            indBruto: Number(indBruto.toFixed(2)),
            ind: Number(indAjustado.toFixed(2)),
            iad: Number(iad.toFixed(2)),
            inad: Number(inad.toFixed(2)),
            habilitado: habilitado,
            motivoAlerta: motivoAlerta,
            formulaInd: `${pAdeqMedio.toFixed(3)} × ${tAp.toFixed(3)} × 10 = ${indBruto.toFixed(2)}`,
            formulaInad: `(0.3 × ${indAjustado.toFixed(2)}) + (0.7 × ${iad.toFixed(2)}) = ${inad.toFixed(2)}`
        };
    }

    /**
     * 5. APLICAÇÃO DE CENÁRIOS PREDEFINIDOS (PRESETS)
     */
    function applyIdebPreset(presetKey) {
        var preset = IDEB_PRESETS[presetKey];
        if (!preset) return;

        // 1. Etapa
        var etapaRadios = document.querySelectorAll('input[name="sim-etapa"]');
        etapaRadios.forEach(function(r) {
            r.checked = (r.value === preset.etapa);
        });

        // 2. Sliders
        var setVal = function(id, val) {
            var el = document.getElementById(id);
            if (el) el.value = val;
        };

        setVal('sim-saeb-lp', preset.profLp);
        setVal('sim-saeb-mat', preset.profMat);
        setVal('sim-padeq-lp', preset.pAdeqLp);
        setVal('sim-padeq-mat', preset.pAdeqMat);
        setVal('sim-tap', preset.tap);
        setVal('sim-part', preset.part);
        setVal('sim-ind-anterior', preset.indAnt);

        // 3. Atualizar Botões de Preset Ativo
        var presetBtns = document.querySelectorAll('.ideb-preset-btn');
        presetBtns.forEach(function(btn) {
            if (btn.getAttribute('data-preset') === presetKey) {
                btn.classList.add('active');
                btn.style.background = '#1A2D42';
                btn.style.color = '#ffffff';
                btn.style.borderColor = '#1A2D42';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'var(--bg-tertiary, #f1f5f9)';
                btn.style.color = 'var(--text-primary, #1e293b)';
                btn.style.borderColor = 'var(--border-color, #cbd5e1)';
            }
        });

        // 4. Executar cálculo
        updateIdebVaarSimulator();
    }

    /**
     * 6. RENDERIZAÇÃO DO SIMULADOR E PAINEL METODOLÓGICO
     */
    function updateIdebVaarSimulator() {
        var etapaEl = document.querySelector('input[name="sim-etapa"]:checked');
        var etapa = etapaEl ? etapaEl.value : '5';

        var lpInput = document.getElementById('sim-saeb-lp');
        var matInput = document.getElementById('sim-saeb-mat');
        var pAdeqLpInput = document.getElementById('sim-padeq-lp');
        var pAdeqMatInput = document.getElementById('sim-padeq-mat');
        var tapInput = document.getElementById('sim-tap');
        var partInput = document.getElementById('sim-part');
        var indAntInput = document.getElementById('sim-ind-anterior');

        if (!lpInput || !matInput || !tapInput) return;

        var profLp = parseFloat(lpInput.value) || 205.0;
        var profMat = parseFloat(matInput.value) || 215.0;
        var pAdeqLp = parseFloat(pAdeqLpInput ? pAdeqLpInput.value : 58);
        var pAdeqMat = parseFloat(pAdeqMatInput ? pAdeqMatInput.value : 52);
        var tap = parseFloat(tapInput.value) || 96.0;
        var part = parseFloat(partInput ? partInput.value : 88.0);
        var indAnt = parseFloat(indAntInput ? indAntInput.value : 4.8);

        // Atualizar textos dos valores dos sliders
        var setTxt = function(id, val, suf) {
            var el = document.getElementById(id);
            if (el) el.textContent = val + (suf || '');
        };
        setTxt('sim-val-lp', profLp.toFixed(1), ' pts');
        setTxt('sim-val-mat', profMat.toFixed(1), ' pts');
        setTxt('sim-val-padeq-lp', pAdeqLp.toFixed(0), '%');
        setTxt('sim-val-padeq-mat', pAdeqMat.toFixed(0), '%');
        setTxt('sim-val-tap', tap.toFixed(1), '%');
        setTxt('sim-val-part', part.toFixed(1), '%');
        setTxt('sim-val-ind-anterior', indAnt.toFixed(1), '');

        // 1. Calcular IDEB Clássico
        var resIdeb = calcularIdebClassico(profLp, profMat, tap, etapa);
        var idebDisp = document.getElementById('sim-out-ideb');
        if (idebDisp) idebDisp.textContent = resIdeb.ideb.toFixed(2);
        var nMedioDisp = document.getElementById('sim-out-n-medio');
        if (nMedioDisp) nMedioDisp.textContent = resIdeb.nMedio.toFixed(2);
        var pRendDisp = document.getElementById('sim-out-p-rend');
        if (pRendDisp) pRendDisp.textContent = (resIdeb.pRendimento * 100).toFixed(1) + '%';

        // Memória de Cálculo Passo a Passo (se presente)
        setTxt('sim-step-nlp', resIdeb.nLp.toFixed(2));
        setTxt('sim-step-nmat', resIdeb.nMat.toFixed(2));
        setTxt('sim-step-nmedio', resIdeb.nMedio.toFixed(2));
        setTxt('sim-step-p', (resIdeb.pRendimento * 100).toFixed(1) + '%');
        setTxt('sim-step-ideb-final', resIdeb.ideb.toFixed(2));

        // 2. Calcular VAAR / FUNDEB
        var resVaar = calcularIndicadoresVaar(pAdeqLp, pAdeqMat, tap, part, indAnt);
        var indDisp = document.getElementById('sim-out-ind');
        if (indDisp) indDisp.textContent = resVaar.ind.toFixed(2);
        var iadDisp = document.getElementById('sim-out-iad');
        if (iadDisp) {
            var sgn = resVaar.iad > 0 ? '+' : '';
            iadDisp.textContent = sgn + resVaar.iad.toFixed(2);
            iadDisp.style.color = resVaar.iad > 0 ? '#10b981' : (resVaar.iad < 0 ? '#ef4444' : 'inherit');
        }
        var inadDisp = document.getElementById('sim-out-inad');
        if (inadDisp) inadDisp.textContent = resVaar.inad.toFixed(2);

        // Status de Habilitação VAAR
        var statusBadge = document.getElementById('sim-out-status-vaar');
        if (statusBadge) {
            if (resVaar.habilitado) {
                statusBadge.className = 'badge badge-success';
                statusBadge.innerHTML = '🟢 HABILITADO À COMPLEMENTAÇÃO VAAR';
            } else {
                statusBadge.className = 'badge badge-warning';
                statusBadge.innerHTML = '🟡 EM ALERTA (' + (resVaar.motivoAlerta || 'Critérios não atingidos') + ')';
            }
        }

        // Atualizar Pontos de Corte Visuais
        var cfg = PONTOS_CORTE_SAEB[etapa] || PONTOS_CORTE_SAEB['5'];
        var infoLp = document.getElementById('sim-info-corte-lp');
        if (infoLp) infoLp.textContent = 'Ponto de Corte Adequado: ' + cfg.lp.corte + ' pts (' + cfg.lp.label + ')';
        var infoMat = document.getElementById('sim-info-corte-mat');
        if (infoMat) infoMat.textContent = 'Ponto de Corte Adequado: ' + cfg.mat.corte + ' pts (' + cfg.mat.label + ')';
    }

    function initIdebVaarCalculator() {
        updateIdebVaarSimulator();
    }

    // Exposição Global
    global.PONTOS_CORTE_SAEB = PONTOS_CORTE_SAEB;
    global.IDEB_PRESETS = IDEB_PRESETS;
    global.calcularIdebClassico = calcularIdebClassico;
    global.calcularIndicadoresVaar = calcularIndicadoresVaar;
    global.applyIdebPreset = applyIdebPreset;
    global.updateIdebVaarSimulator = updateIdebVaarSimulator;
    global.initIdebVaarCalculator = initIdebVaarCalculator;

})(typeof window !== 'undefined' ? window : global);
