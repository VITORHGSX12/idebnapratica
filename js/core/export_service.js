/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — SERVIÇO UNIFICADO DE EXPORTAÇÃO (CSV / EXCEL / PDF)
 * Arquivo: js/core/export_service.js
 * Descrição: Exportação confiável de datasets pedagógicos, listas de alunos,
 *            escolas, relatórios diagnósticos e matrizes sem travamentos.
 * ============================================================================
 */

(function (global) {
    'use strict';

    /**
     * Exporta um array de objetos para arquivo CSV formatado com BOM UTF-8 (compatível com Excel)
     * @param {string} filename - Nome do arquivo (ex: 'alunos_rede.csv')
     * @param {Array<{ key: string, label: string }>} columns - Definição de colunas
     * @param {Array<Object>} data - Dados a serem exportados
     */
    function exportToCSV(filename, columns, data) {
        if (!Array.isArray(data) || data.length === 0) {
            if (typeof global.showToast === 'function') {
                global.showToast('Nenhum dado disponível para exportação.', 'alert-triangle');
            }
            return false;
        }

        try {
            var cols = columns;
            if (!cols || cols.length === 0) {
                var firstItem = data[0] || {};
                cols = Object.keys(firstItem).map(function(k) {
                    return { key: k, label: k.toUpperCase() };
                });
            }

            var csvContent = '\uFEFF'; // BOM UTF-8 para Excel
            
            // Cabeçalho
            var headerRow = cols.map(function (c) {
                var label = (c.label || c.key || '').replace(/"/g, '""');
                return '"' + label + '"';
            }).join(';');
            csvContent += headerRow + '\r\n';

            // Linhas de dados
            data.forEach(function (row) {
                var rowData = cols.map(function (c) {
                    var val = row[c.key];
                    if (val === null || val === undefined) val = '';
                    var str = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
                    return '"' + str + '"';
                }).join(';');
                csvContent += rowData + '\r\n';
            });

            var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', filename.endsWith('.csv') ? filename : filename + '.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(function () { URL.revokeObjectURL(url); }, 500);

            if (typeof global.showToast === 'function') {
                global.showToast('Relatório exportado com sucesso (CSV)!', 'check-circle');
            }
            return true;
        } catch (err) {
            console.error('[ExportService] Erro ao exportar CSV:', err);
            if (typeof global.showToast === 'function') {
                global.showToast('Erro ao gerar arquivo de exportação.', 'alert-triangle');
            }
            return false;
        }
    }

    /**
     * Exporta a lista de alunos atualmente carregada ou filtrada
     * @param {Array<Object>} [studentsList] - Lista opcional de estudantes
     */
    function exportStudentsDataset(studentsList) {
        var list = studentsList || global.loadedStudents || [];
        if (!list || list.length === 0) {
            var dbAln = global.dbAlunos || [];
            if (dbAln.length > 0) list = dbAln;
        }

        if (!list || list.length === 0) {
            if (typeof global.showToast === 'function') {
                global.showToast('Nenhum aluno encontrado para exportar.', 'alert-triangle');
            }
            return;
        }

        var columns = [
            { key: 'matricula', label: 'MATRÍCULA' },
            { key: 'nome', label: 'NOME DO ALUNO' },
            { key: 'escola', label: 'ESCOLA' },
            { key: 'etapa', label: 'ETAPA / ANO' },
            { key: 'sexo', label: 'SEXO' },
            { key: 'nascimento', label: 'DATA NASCIMENTO' },
            { key: 'cpf', label: 'CPF' },
            { key: 'mae', label: 'NOME DA MÃE' },
            { key: 'pai', label: 'NOME DO PAI' },
            { key: 'nee', label: 'NECESSIDADES ESPECIAIS (NEE)' },
            { key: 'avg_score', label: 'MÉDIA / DESEMPENHO' }
        ];

        var dateStamp = new Date().toISOString().slice(0, 10);
        exportToCSV('relatorio_alunos_rede_' + dateStamp + '.csv', columns, list);
    }

    /**
     * Dispara a impressão/exportação para PDF de relatórios na tela
     */
    function exportReportToPrintPDF(title) {
        if (typeof global.showToast === 'function') {
            global.showToast('Preparando relatório para exportação / impressão...', 'printer');
        }
        setTimeout(function() {
            window.print();
        }, 300);
    }

    // Exposição Global
    global.exportToCSV = exportToCSV;
    global.exportStudentsDataset = exportStudentsDataset;
    global.exportReportToPrintPDF = exportReportToPrintPDF;

})(typeof window !== 'undefined' ? window : this);
