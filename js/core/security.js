// =========================================================================
// SECURITY FIX: [XSS Sanitization & DOM Security]
// Responsabilidade: Funções universais de sanitização e proteção contra XSS (Cross-Site Scripting)
// =========================================================================

(function(global) {
    'use strict';

    /**
     * Função universal de escape de caracteres HTML para prevenir injeção XSS
     * @param {*} str 
     * @returns {string}
     */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Sanitiza todas as propriedades de string de um objeto ou array de objetos
     * @param {Object|Array} obj 
     * @returns {Object|Array}
     */
    function sanitizeObject(obj) {
        if (!obj || typeof obj !== 'object') {
            return typeof obj === 'string' ? escapeHtml(obj) : obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(function(item) { return sanitizeObject(item); });
        }

        var sanitized = {};
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                var value = obj[key];
                if (typeof value === 'string') {
                    sanitized[key] = escapeHtml(value);
                } else if (typeof value === 'object' && value !== null) {
                    sanitized[key] = sanitizeObject(value);
                } else {
                    sanitized[key] = value;
                }
            }
        }
        return sanitized;
    }

    /**
     * Criação segura de elementos DOM (alternativa sem risco de injeção XSS)
     * @param {string} tag 
     * @param {string} textContent 
     * @param {Object} attributes 
     * @returns {HTMLElement}
     */
    function createSafeElement(tag, textContent, attributes) {
        var el = document.createElement(tag);
        if (textContent !== undefined && textContent !== null) {
            el.textContent = String(textContent); // textContent é seguro por padrão
        }
        if (attributes && typeof attributes === 'object') {
            for (var attr in attributes) {
                if (Object.prototype.hasOwnProperty.call(attributes, attr)) {
                    el.setAttribute(attr, attributes[attr]);
                }
            }
        }
        return el;
    }

    /**
     * Valida e higieniza a integridade da sessão do usuário atual
     * Previne injeção ou adulteração de perfis RBAC no client-side
     */
    function sanitizeAndVerifyUserSession() {
        var raw = localStorage.getItem('gd_current_user_profile') || localStorage.getItem('currentUser');
        if (!raw) return null;
        
        var user = (typeof global.safeJsonParse === 'function') 
            ? global.safeJsonParse(raw, null) 
            : null;

        if (!user || typeof user !== 'object') {
            return null;
        }

        var validRoles = [
            'Master Admin', 
            'Gestor SEMED', 
            'Gestor da Rede', 
            'Diretor Escola', 
            'Professor', 
            'Coordenador(a)', 
            'Gestão Executiva SEMED',
            'Professor(a) • UI JOSE CORREA LIMA',
            'Diretora Escolar • UI JOSE CORREA LIMA',
            'Administrador(a) do Sistema & TI'
        ];

        var userRole = user.role || '';
        var isRoleValid = validRoles.some(function(r) { return userRole.indexOf(r) !== -1 || r.indexOf(userRole) !== -1; });

        if (!isRoleValid) {
            console.warn('[Security Warning] Perfil inválido detectado na sessão. Restaurando padrão seguro.');
            user.role = 'Gestor da Rede';
        }

        return sanitizeObject(user);
    }

    // Exportar para escopo global
    global.escapeHtml = escapeHtml;
    global.sanitizeObject = sanitizeObject;
    global.createSafeElement = createSafeElement;
    global.sanitizeAndVerifyUserSession = sanitizeAndVerifyUserSession;

})(typeof window !== 'undefined' ? window : this);
