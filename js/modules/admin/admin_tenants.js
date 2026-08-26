// =========================================================================
// GESTÃO MULTI-TENANT & CONFIGURAÇÃO INSTITUCIONAL (MODULAR ENGINE)
// Responsabilidade: Identificação automática de rede por subdomínio/URL,
// dados cadastrais da SEMED, metas pactuadas e isolamento multi-tenant.
// =========================================================================

(function(global) {
    'use strict';

    var MUNICIPALITY_TENANTS = {
        'gd': {
            slug: 'gd',
            nome: 'Gonçalves Dias',
            uf: 'MA',
            orgao: 'Secretaria Municipal de Educação (SEMED)',
            secretario: 'Prof. Coordenador SEMED',
            cnpj: '01.612.982/0001-00',
            anoLetivo: 2026,
            metaIdebIniciais: 5.4,
            metaIdebFinais: 4.8,
            temaCor: '#8b5cf6',
            escolasTotal: 9
        },
        'pd': {
            slug: 'pd',
            nome: 'Presidente Dutra',
            uf: 'MA',
            orgao: 'Secretaria Municipal de Educação',
            secretario: 'Gestão SEMED',
            cnpj: '06.123.456/0001-99',
            anoLetivo: 2026,
            metaIdebIniciais: 5.6,
            metaIdebFinais: 5.0,
            temaCor: '#3b82f6',
            escolasTotal: 18
        },
        'caxias': {
            slug: 'caxias',
            nome: 'Caxias',
            uf: 'MA',
            orgao: 'Secretaria Municipal de Educação',
            secretario: 'Gestão SEMED',
            cnpj: '05.987.654/0001-11',
            anoLetivo: 2026,
            metaIdebIniciais: 5.8,
            metaIdebFinais: 5.2,
            temaCor: '#10b981',
            escolasTotal: 42
        }
    };

    /**
     * Extrai o slug do município a partir do subdomínio ou parâmetros de URL
     */
    function getTenantSlugFromHostname() {
        if (typeof window === 'undefined') return 'gd';
        var host = window.location.hostname;
        var parts = host.split('.');

        if (host === 'localhost' || host === '127.0.0.1' || parts.length < 3) {
            var params = new URLSearchParams(window.location.search);
            return params.get('tenant') || params.get('tenantId') || 'gd';
        }

        return parts[0];
    }

    /**
     * Retorna a configuração do município ativo
     */
    function getCurrentTenantConfig() {
        var slug = getTenantSlugFromHostname();
        return MUNICIPALITY_TENANTS[slug] || MUNICIPALITY_TENANTS['gd'];
    }

    /**
     * Aplica o branding do município ativo nos headers e metadados
     */
    function applyTenantBranding() {
        var config = getCurrentTenantConfig();
        var badgeMunicipio = document.getElementById('header-municipio-badge');
        var titleMunicipio = document.getElementById('header-municipio-nome');

        if (badgeMunicipio) badgeMunicipio.textContent = config.nome + ' - ' + config.uf;
        if (titleMunicipio) titleMunicipio.textContent = config.orgao;
    }

    // Exposição Global
    global.MUNICIPALITY_TENANTS = MUNICIPALITY_TENANTS;
    global.getTenantSlugFromHostname = getTenantSlugFromHostname;
    global.getCurrentTenantConfig = getCurrentTenantConfig;
    global.applyTenantBranding = applyTenantBranding;

    // Auto-inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTenantBranding);
    } else {
        setTimeout(applyTenantBranding, 100);
    }

})(typeof window !== 'undefined' ? window : this);
