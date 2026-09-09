// =========================================================================
// TRAVA DE CAIXA ALTA (FRONT-END UPPERCASE LOCK)
// Responsabilidade: Forçar transformação de texto em caixa alta em tempo real
// nos formulários de cadastro e edição (Usuários, Escolas, Alunos, Turmas).
// Isenta campos como email, senha, tokens e URLs.
// =========================================================================

(function(global) {
    'use strict';

    // Lista de tipos de input ou IDs/names que NUNCA devem ser transformados em maiúsculas
    var EXCLUDED_TYPES = ['password', 'email', 'file', 'hidden', 'checkbox', 'radio', 'date', 'datetime-local', 'time', 'number', 'color', 'range'];
    
    var EXCLUDED_NAMES_OR_IDS = [
        'email', 'user-email', 'usuario-email', 'login-email', 'student-email',
        'password', 'senha', 'user-password', 'login-password', 'confirm-password',
        'token', 'jwt', 'auth-token', 'avatar', 'avatar-file', 'url', 'avatar_url'
    ];

    /**
     * Verifica se um elemento de input deve ser bloqueado para caixa alta
     * @param {HTMLElement} el 
     * @returns {boolean}
     */
    function shouldApplyUppercase(el) {
        if (!el || !el.tagName) return false;
        var tag = el.tagName.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') return false;

        var type = (el.type || 'text').toLowerCase();
        if (EXCLUDED_TYPES.indexOf(type) !== -1) return false;

        var id = (el.id || '').toLowerCase();
        var name = (el.name || '').toLowerCase();
        var dataset = el.dataset || {};

        if (dataset.noUppercase === 'true' || dataset.nouppercase === 'true') return false;

        for (var i = 0; i < EXCLUDED_NAMES_OR_IDS.length; i++) {
            var excluded = EXCLUDED_NAMES_OR_IDS[i];
            if (id.indexOf(excluded) !== -1 || name.indexOf(excluded) !== -1) {
                return false;
            }
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
