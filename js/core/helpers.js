// =========================================================================
// CORE DOM & STORAGE HELPERS
// Responsabilidade: Utilitários puros de manipulação do DOM e Storage seguro
// =========================================================================

(function(global) {
    'use strict';

    // Memória de fallback caso o localStorage esteja bloqueado / indisponível
    var _memoryStorage = {};

    var safeStorage = {
        getItem: function(key) {
            try { 
                return localStorage.getItem(key); 
            } catch(e) { 
                return _memoryStorage[key] || null; 
            }
        },
        setItem: function(key, val) {
            try { 
                localStorage.setItem(key, val); 
            } catch(e) { 
                _memoryStorage[key] = String(val); 
            }
        },
        removeItem: function(key) {
            try { 
                localStorage.removeItem(key); 
            } catch(e) { 
                delete _memoryStorage[key]; 
            }
        }
    };

    // Safe DOM Element Selector
    function safeEl(id) {
        if (!id) return null;
        return typeof id === 'string' ? document.getElementById(id) : id;
    }

    // Safe Property Setter
    function safeSetProp(id, prop, value) {
        var el = safeEl(id);
        if (el) { el[prop] = value; }
    }

    // Safe Property Getter
    function safeGetProp(id, prop, defaultVal) {
        var el = safeEl(id);
        return el && el[prop] !== undefined ? el[prop] : (defaultVal || '');
    }

    // Safe Style Setter
    function safeSetStyle(id, prop, value) {
        var el = safeEl(id);
        if (el && el.style) { el.style[prop] = value; }
    }

    // Safe Lucide Icons Creator
    function safeCreateIcons() {
        if (global.lucide && typeof global.lucide.createIcons === 'function') {
            try { global.lucide.createIcons(); } catch(e) {}
        }
    }

    // Debounce Helper
    function debounce(func, wait) {
        wait = wait === undefined ? 250 : wait;
        var timeout;
        return function() {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }

    // Safe JSON Parse Helper
    function safeJsonParse(data, fallbackValue) {
        if (data === null || data === undefined || data === '') return fallbackValue;
        if (typeof data !== 'string') return data;
        try {
            var parsed = JSON.parse(data);
            return parsed !== null ? parsed : fallbackValue;
        } catch (err) {
            console.warn('[Safe JSON Parse] Falha ao processar JSON:', err);
            return fallbackValue;
        }
    }

    // Máscara e formatador seguro de CPF
    function formatCPF(cpf) {
        if (!cpf) return '';
        var clean = String(cpf).replace(/\D/g, '');
        if (clean.length !== 11) return cpf;
        return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    // Máscara de Telefone
    function formatPhone(phone) {
        if (!phone) return '';
        var clean = String(phone).replace(/\D/g, '');
        if (clean.length === 11) {
            return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (clean.length === 10) {
            return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    }

    // Normalizador de texto para comparações seguras
    function normalizeStr(str) {
        if (!str) return '';
        return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    /**
     * Retorna exclusivamente as turmas que pertencem à escola especificada
     * @param {string|number} escolaIdentificador (ID, INEP ou Nome da Escola)
     * @param {Array} [classesList] (Opcional: lista pré-carregada de turmas)
     * @returns {Array} Lista estrita de turmas da escola (ou [] se vazia)
     */
    function getTurmasPorEscola(escolaIdentificador, classesList) {
        if (!escolaIdentificador) return [];

        var target = String(escolaIdentificador).trim();
        var targetNorm = normalizeStr(target);

        var allClasses = Array.isArray(classesList) ? classesList : (
            (typeof global.getOfficialClassesState === 'function' ? global.getOfficialClassesState() : null) ||
            global.dbTurmas || []
        );

        if (!Array.isArray(allClasses) || allClasses.length === 0) {
            return [];
        }

        // 1. Obter catálogo de escolas para resolver mapeamentos de ID <-> Nome
        var allSchools = (typeof global.getOfficialSchoolsState === 'function' ? global.getOfficialSchoolsState() : null) || global.dbEscolas || [];
        var matchedSchool = null;
        if (Array.isArray(allSchools)) {
            matchedSchool = allSchools.find(function(esc) {
                if (!esc) return false;
                var escId = String(esc.id || '').trim();
                var escInep = String(esc.codigo_inep || esc.inep || '').trim();
                var escNome = normalizeStr(esc.nome || esc.name || '');
                return escId === target || escInep === target || escNome === targetNorm;
            });
        }

        var validIds = new Set([target]);
        var validNames = new Set([targetNorm]);

        if (matchedSchool) {
            if (matchedSchool.id) validIds.add(String(matchedSchool.id).trim());
            if (matchedSchool.codigo_inep) validIds.add(String(matchedSchool.codigo_inep).trim());
            if (matchedSchool.inep) validIds.add(String(matchedSchool.inep).trim());
            if (matchedSchool.nome) validNames.add(normalizeStr(matchedSchool.nome));
            if (matchedSchool.name) validNames.add(normalizeStr(matchedSchool.name));
        }

        // 2. Filtrar estritamente as turmas que batem com os identificadores ou nomes
        var filtered = allClasses.filter(function(t) {
            if (!t) return false;
            var tEscId = String(t.escola_id || '').trim();
            var tEscNome = normalizeStr(t.escola || t.escola_nome || '');

            var matchById = tEscId && validIds.has(tEscId);
            var matchByName = tEscNome && Array.from(validNames).some(function(vName) {
                return vName && (tEscNome === vName || tEscNome.includes(vName) || vName.includes(tEscNome));
            });

            return matchById || matchByName;
        });

        return filtered;
    }

    /**
     * Popula um elemento <select> com as turmas de uma escola de forma segura e padronizada
     * @param {string|number} escolaIdentificador 
     * @param {HTMLSelectElement|string} selectElement 
     * @param {string} [selectedTurmaId] 
     * @returns {Array} Lista de turmas populadas
     */
    function populateTurmasSelect(escolaIdentificador, selectElement, selectedTurmaId) {
        var el = safeEl(selectElement);
        if (!el) return [];

        var turmas = getTurmasPorEscola(escolaIdentificador);
        el.innerHTML = '';

        if (turmas.length === 0) {
            var emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.disabled = true;
            emptyOpt.selected = true;
            emptyOpt.textContent = 'Nenhuma turma cadastrada nesta escola';
            el.appendChild(emptyOpt);
            return [];
        }

        turmas.forEach(function(t, idx) {
            var opt = document.createElement('option');
            opt.value = t.id || t.turma_id || t.nome;
            var label = t.nome || t.name || ('Turma ' + (idx + 1));
            if (t.serie) label += ' (' + t.serie + (t.turno ? ' - ' + t.turno : '') + ')';
            opt.textContent = label;
            if (selectedTurmaId && (opt.value === selectedTurmaId || t.id === selectedTurmaId)) {
                opt.selected = true;
            }
            el.appendChild(opt);
        });

        // Garante seleção padrão da primeira turma se nenhuma pré-selecionada
        if (!selectedTurmaId || !turmas.some(function(t) { return t.id === selectedTurmaId; })) {
            el.selectedIndex = 0;
        }

        return turmas;
    }

    // Exposição global
    global._memoryStorage = _memoryStorage;
    global.safeStorage = safeStorage;
    global.safeJsonParse = safeJsonParse;
    global.formatCPF = formatCPF;
    global.formatPhone = formatPhone;
    global.safeEl = safeEl;
    global.safeSetProp = safeSetProp;
    global.safeGetProp = safeGetProp;
    global.safeSetStyle = safeSetStyle;
    global.safeCreateIcons = safeCreateIcons;
    global.debounce = debounce;
    global.normalizeStr = normalizeStr;
    global.getTurmasPorEscola = getTurmasPorEscola;
    global.populateTurmasSelect = populateTurmasSelect;

})(typeof window !== 'undefined' ? window : this);

