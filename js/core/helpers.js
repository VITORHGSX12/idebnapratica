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

})(typeof window !== 'undefined' ? window : this);

