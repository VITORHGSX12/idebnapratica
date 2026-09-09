/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO DE NOTIFICAÇÕES E ALERTAS
 * Arquivo: js/core/notifications.js
 * Descrição: Gerenciamento reativo de notificações do sistema, sincronização
 *            do badge numérico e limpeza de alertas.
 * ============================================================================
 */

(function (global) {
    'use strict';

    var STORAGE_KEY = 'ideb_system_notifications_v1';

    var defaultNotifications = [
        {
            id: 'notif_1',
            title: 'Sincronização do Censo Escolar',
            message: 'A base de alunos e escolas da rede municipal foi consolidada.',
            time: 'Hoje, 08:30',
            type: 'info',
            read: false,
            icon: 'check-circle'
        },
        {
            id: 'notif_2',
            title: 'Alerta Pedagógico: SAEB 2026',
            message: 'Novo simulado de Língua Portuguesa e Matemática disponível para turmas do 5º e 9º ano.',
            time: 'Ontem, 16:45',
            type: 'warning',
            read: false,
            icon: 'alert-triangle'
        },
        {
            id: 'notif_3',
            title: 'Meta de Fluência Leitora',
            message: '3 escolas da rede atingiram a meta projetada para o 2º ano.',
            time: '2 dias atrás',
            type: 'success',
            read: false,
            icon: 'award'
        }
    ];

    function getStoredNotifications() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {
            console.warn('[Notifications] Falha ao ler storage:', e);
        }
        return defaultNotifications.slice();
    }

    function saveNotifications(notifications) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        } catch (e) {
            console.warn('[Notifications] Falha ao salvar storage:', e);
        }
    }

    var currentNotifications = getStoredNotifications();

    function updateNotificationBadge() {
        var badge = document.getElementById('notification-badge');
        if (!badge) return;

        var unreadCount = currentNotifications.filter(function (n) { return !n.read; }).length;
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'inline-block';
            badge.classList.remove('hidden');
        } else {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }

    function renderNotifications() {
        var listContainer = document.getElementById('notifications-list');
        if (!listContainer) return;

        if (currentNotifications.length === 0) {
            listContainer.innerHTML = [
                '<div style="padding: 16px 8px; text-align: center; color: var(--text-muted); font-size: 0.75rem;">',
                '    <i data-lucide="bell-off" style="width: 24px; height: 24px; margin: 0 auto 6px auto; opacity: 0.5; display: block;"></i>',
                '    <span>Nenhuma notificação no momento.</span>',
                '</div>'
            ].join('');
            if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
                lucide.createIcons({ root: listContainer });
            }
            updateNotificationBadge();
            return;
        }

        var html = '';
        currentNotifications.forEach(function (item) {
            var typeColor = item.type === 'warning' ? 'var(--color-status-warning, #D97706)' : 
                            item.type === 'success' ? 'var(--color-status-success, #059669)' : 
                            'var(--color-brand-primary, #2F6FED)';
            var bgStyle = item.read ? 'background: var(--bg-secondary); opacity: 0.75;' : 'background: var(--bg-primary); border-left: 3px solid ' + typeColor + ';';

            html += [
                '<div class="notification-item-card" data-id="' + item.id + '" style="padding: 9px 10px; border-radius: 6px; ' + bgStyle + ' border-bottom: 1px solid var(--border-color); font-size: 0.72rem; transition: background 0.15s ease;">',
                '    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; margin-bottom: 3px;">',
                '        <strong style="color: var(--text-primary); font-size: 0.75rem;">' + item.title + '</strong>',
                '        <span style="font-size: 0.62rem; color: var(--text-muted); white-space: nowrap;">' + item.time + '</span>',
                '    </div>',
                '    <p style="margin: 0; color: var(--text-secondary); line-height: 1.35;">' + item.message + '</p>',
                '</div>'
            ].join('');
        });

        listContainer.innerHTML = html;
        if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
            lucide.createIcons({ root: listContainer });
        }
        updateNotificationBadge();
    }

    function clearAllNotifications() {
        currentNotifications = currentNotifications.map(function(n) {
            n.read = true;
            return n;
        });
        saveNotifications(currentNotifications);
        renderNotifications();
        updateNotificationBadge();

        if (typeof global.showToast === 'function') {
            global.showToast('Todas as notificações foram marcadas como lidas.', 'check');
        }
    }

    function addNotification(title, message, type) {
        var newNotif = {
            id: 'notif_' + Date.now(),
            title: title || 'Novo Alerta',
            message: message || '',
            time: 'Agora',
            type: type || 'info',
            read: false,
            icon: 'bell'
        };
        currentNotifications.unshift(newNotif);
        if (currentNotifications.length > 20) {
            currentNotifications = currentNotifications.slice(0, 20);
        }
        saveNotifications(currentNotifications);
        renderNotifications();
        updateNotificationBadge();
    }

    function initNotifications() {
        var clearBtn = document.getElementById('btn-clear-notifications');
        if (clearBtn) {
            clearBtn.onclick = function (e) {
                e.stopPropagation();
                clearAllNotifications();
            };
        }

        renderNotifications();
        updateNotificationBadge();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotifications);
    } else {
        initNotifications();
    }

    // Exposição Global
    global.initNotifications = initNotifications;
    global.renderNotifications = renderNotifications;
    global.updateNotificationBadge = updateNotificationBadge;
    global.clearAllNotifications = clearAllNotifications;
    global.addNotification = addNotification;

})(typeof window !== 'undefined' ? window : this);
