// =========================================================================
// TRAVA DE CAIXA ALTA (FRONT-END UPPERCASE LOCK)
// Responsabilidade: Forçar transformação de texto em caixa alta em tempo real
// nos formulários de cadastro e edição (Usuários, Escolas, Alunos, Turmas).
// Isenta campos como email, senha, tokens e URLs.
// =========================================================================

(function(global) {
    'use strict';

    // Lista de tipos de input que NUNCA devem ser transformados em maiúsculas
    var EXCLUDED_TYPES = ['password', 'email', 'file', 'hidden', 'checkbox', 'radio', 'date', 'datetime-local', 'time', 'number', 'color', 'range'];
    
    // Lista de substrings seguras para isenção
    var EXCLUDED_SAFE_SUBSTRINGS = [
        'password', 'senha', 'email', 'token', 'jwt', 'api-key', 'apikey',
        'auth-token', 'avatar', 'avatar_url', 'avatar-file', 'force-change'
    ];

    // Regex com limites de palavra/hífen/underscore para evitar falsos positivos (ex: "keyword", "passageiro", "compasso")
    var EXCLUDED_BOUNDED_REGEX = /(?:^|[-_])(password|senha|pwd|pass|current-pass|new-pass|confirm-pass|user-pass|email|api-key|apikey|jwt|token|secret)(?:[-_]|$)/i;

    function isExcludedIdentifier(str) {
        if (!str || typeof str !== 'string') return false;
        var s = str.toLowerCase();
        for (var i = 0; i < EXCLUDED_SAFE_SUBSTRINGS.length; i++) {
            if (s.indexOf(EXCLUDED_SAFE_SUBSTRINGS[i]) !== -1) return true;
        }
        return EXCLUDED_BOUNDED_REGEX.test(s);
    }

    /**
     * Verifica se um elemento de input deve ser bloqueado para caixa alta
     * @param {HTMLElement} el 
     * @returns {boolean}
     */
    function shouldApplyUppercase(el) {
        if (!el || !el.tagName) return false;
        var tag = el.tagName.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') return false;

        // 1. Checagem direta de tipo (propriedade e atributo DOM)
        var type = (el.type || 'text').toLowerCase();
        if (EXCLUDED_TYPES.indexOf(type) !== -1) return false;

        var rawTypeAttr = (typeof el.getAttribute === 'function' ? (el.getAttribute('type') || '') : '').toLowerCase();
        if (rawTypeAttr === 'password' || rawTypeAttr === 'email') return false;

        // 2. Checagem de autocomplete (ex: current-password, new-password, email)
        var autocomplete = (typeof el.getAttribute === 'function' ? (el.getAttribute('autocomplete') || '') : '').toLowerCase();
        if (autocomplete.indexOf('password') !== -1 || autocomplete.indexOf('email') !== -1) return false;

        // 3. Checagem de data attribute explícito (ex: data-no-uppercase="true")
        var dataset = el.dataset || {};
        if (dataset.noUppercase === 'true' || dataset.nouppercase === 'true') return false;
        if (typeof el.getAttribute === 'function') {
            var dataNoUpper = (el.getAttribute('data-no-uppercase') || el.getAttribute('data-nouppercase') || '').toLowerCase();
            if (dataNoUpper === 'true') return false;
        }

        // 4. Checagem por ID, name ou className delimitado
        var id = el.id || '';
        var name = el.name || '';
        var className = el.className || '';

        if (isExcludedIdentifier(id) || isExcludedIdentifier(name) || isExcludedIdentifier(className)) {
            return false;
        }

        return true;
    }

    /**
     * Transforma o valor do input em maiúsculas preservando a posição do cursor
     * @param {HTMLInputElement|HTMLTextAreaElement} el 
     */
    function transformToUppercase(el) {
        if (!shouldApplyUppercase(el)) return;

        var start = el.selectionStart;
        var end = el.selectionEnd;
        var original = el.value;

        if (typeof original === 'string' && original !== original.toUpperCase()) {
            el.value = original.toUpperCase();
            if (start !== null && end !== null && typeof el.setSelectionRange === 'function') {
                try {
                    el.setSelectionRange(start, end);
                } catch(e) {}
            }
        }
    }

    /**
     * Inicializa a delegação global de eventos para captura de digitação e colagem
     */
    function initUppercaseLock() {
        if (typeof document === 'undefined') return;

        // Delegação de evento input global
        document.addEventListener('input', function(e) {
            if (e && e.target) {
                transformToUppercase(e.target);
            }
        }, true);

        // Delegação de evento change global
        document.addEventListener('change', function(e) {
            if (e && e.target) {
                transformToUppercase(e.target);
            }
        }, true);

        // Delegação de evento paste global (com defer para capturar o valor colado)
        document.addEventListener('paste', function(e) {
            if (e && e.target && shouldApplyUppercase(e.target)) {
                setTimeout(function() {
                    transformToUppercase(e.target);
                }, 10);
            }
        }, true);
    }

    // Inicialização automática ao carregar o DOM
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initUppercaseLock);
        } else {
            initUppercaseLock();
        }
    }

    // Exposição global
    global.shouldApplyUppercase = shouldApplyUppercase;
    global.transformToUppercase = transformToUppercase;
    global.initUppercaseLock = initUppercaseLock;

})(typeof window !== 'undefined' ? window : this);
