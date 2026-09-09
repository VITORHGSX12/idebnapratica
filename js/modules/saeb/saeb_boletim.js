/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO SAEB (BOLETIM SAEB & EXPORTAÇÃO)
 * Arquivo: js/modules/saeb/saeb_boletim.js
 * Descrição: Exportação e impressão segura do Boletim SAEB da Rede/Escola,
 *            com travas de segurança quando não há lançamentos reais.
 * ============================================================================
 */

(function (global) {
    'use strict';

    function desabilitarBoletimSaebBtn(desabilitar) {
        var btn = document.getElementById('btn-export-saeb-report');
        if (btn) {
            btn.disabled = desabilitar;
            btn.style.opacity = desabilitar ? '0.5' : '1';
            btn.title = desabilitar ? 'Aguardando lançamentos de notas para emissão do Boletim' : 'Imprimir Boletim SAEB';
        }
    }

    function handleExportBoletimSaeb() {
        var respostasDb = typeof global.getRespostasState === 'function' ? global.getRespostasState() : {};
        var hasLoadedData = (global.loadedStudents && global.loadedStudents.length > 0) || (global.dbAlunos && global.dbAlunos.length > 0);

        if (Object.keys(respostasDb).length === 0 && !hasLoadedData) {
            if (typeof global.showToast === 'function') {
                global.showToast('Não é possível emitir Boletim SAEB sem dados de turmas e alunos cadastrados.', 'alert-triangle');
            }
            return;
        }

        if (typeof global.showToast === 'function') {
            global.showToast('Preparando Boletim SAEB para exportação / PDF...', 'printer');
        }

        setTimeout(function () {
            window.print();
        }, 300);
    }

    function bindBoletimEvents() {
        var btn = document.getElementById('btn-export-saeb-report');
        if (btn) {
            btn.onclick = handleExportBoletimSaeb;
        }
    }

    // Exposição Global
    global.desabilitarBoletimSaebBtn = desabilitarBoletimSaebBtn;
    global.handleExportBoletimSaeb = handleExportBoletimSaeb;
    global.bindBoletimEvents = bindBoletimEvents;

})(typeof window !== 'undefined' ? window : this);
