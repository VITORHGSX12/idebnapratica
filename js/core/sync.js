// =========================================================================
// DATA SYNCHRONIZATION ENGINE (OFFLINE-FIRST & CLOUD SYNC)
// Responsabilidade: Sincronização assíncrona e resiliente entre LocalStorage
// e o Banco de Dados Central (PostgreSQL / Supabase / Railway API).
// =========================================================================

(function(global) {
    'use strict';

    var SYNC_QUEUE_KEY = 'gd_sync_queue_v1';
    var LAST_SYNC_KEY = 'gd_last_sync_timestamp';
    var isSyncing = false;

    /**
     * Recupera a fila de operações pendentes
     */
    function getSyncQueue() {
        var raw = localStorage.getItem(SYNC_QUEUE_KEY);
        if (!raw) return [];
        return (typeof global.safeJsonParse === 'function') 
            ? global.safeJsonParse(raw, []) 
            : [];
    }

    /**
     * Salva a fila de operações pendentes
     */
    function saveSyncQueue(queue) {
        try {
            localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue || []));
            updateSyncIndicatorUI(queue.length);
        } catch(e) {
            console.warn('[Sync Engine] Erro ao gravar fila de sincronização:', e);
        }
    }

    /**
     * Enfileira uma ação de criação/atualização/remoção para envio à nuvem
     * @param {string} entity 'escola' | 'turma' | 'professor' | 'aluno' | 'meta'
     * @param {string} action 'CREATE' | 'UPDATE' | 'DELETE'
     * @param {Object} payload Dados do registro
     */
    function enqueueSyncAction(entity, action, payload) {
        if (!entity || !action || !payload) return;

        var queue = getSyncQueue();
        var item = {
            id: 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            entity: entity,
            action: action,
            payload: payload,
            timestamp: new Date().toISOString(),
            attempts: 0
        };

        queue.push(item);
        saveSyncQueue(queue);

        // Dispara sincronização em segundo plano imediatamente
        setTimeout(function() {
            processSyncQueue();
        }, 100);
    }

    /**
     * Processa a fila de sincronização enviando para a API central
     */
    async function processSyncQueue() {
        if (isSyncing) return;
        var queue = getSyncQueue();
        if (!queue || queue.length === 0) {
            updateSyncIndicatorUI(0);
            return;
        }

        isSyncing = true;
        updateSyncIndicatorUI(queue.length, true);

        var localToken = (typeof localStorage !== 'undefined') ? localStorage.getItem('authToken') : '';
        var sessionToken = (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem('authToken') : '';
        var token = localToken || sessionToken || '';
        var remainingQueue = [];

        for (var i = 0; i < queue.length; i++) {
            var item = queue[i];
            item.attempts = (item.attempts || 0) + 1;

            try {
                var endpoint = getEndpointForEntity(item.entity, item.action, item.payload);
                var method = item.action === 'CREATE' ? 'POST' : (item.action === 'UPDATE' ? 'PUT' : 'DELETE');

                var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                var timeout = controller ? setTimeout(function() { controller.abort(); }, 6000) : null;

                var response = await fetch(endpoint, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? 'Bearer ' + token : ''
                    },
                    body: JSON.stringify(item.payload),
                    signal: controller ? controller.signal : undefined
                });

                if (timeout) clearTimeout(timeout);

                if (response.ok) {
                    console.log(`[Sync Engine] ✅ Registro ${item.entity} (${item.action}) sincronizado com a nuvem com sucesso.`);
                } else if (response.status >= 400 && response.status < 500) {
                    // Erro de validação 4xx: não retenta para evitar loop
                    console.warn(`[Sync Engine] ⚠️ Validação rejeitada pelo servidor para ${item.entity}:`, response.status);
                } else {
                    // Erro 5xx ou de rede: mantém na fila para retentativa
                    if (item.attempts < 5) remainingQueue.push(item);
                }
            } catch (err) {
                // Falha de rede / offline: mantém na fila
                if (item.attempts < 5) remainingQueue.push(item);
            }
        }

        saveSyncQueue(remainingQueue);
        isSyncing = false;
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
        updateSyncIndicatorUI(remainingQueue.length, false);
    }

    /**
     * Mapeia endpoints da API REST
     */
    function getEndpointForEntity(entity, action, payload) {
        var base = '/api';
        if (entity === 'turma') return `${base}/classes`;
        if (entity === 'professor') return `${base}/teachers`;
        if (entity === 'aluno') return `${base}/students`;
        if (entity === 'escola') return `${base}/schools`;
        return `${base}/sync/${entity}`;
    }

    /**
     * Atualiza indicador visual sutil de status de sincronização no cabeçalho
     */
    function updateSyncIndicatorUI(pendingCount, inProgress) {
        var indicator = document.getElementById('cloud-sync-status-indicator');
        if (!indicator) return;

        if (inProgress) {
            indicator.className = 'badge badge-neutral';
            indicator.innerHTML = '<i data-lucide="refresh-cw" class="animate-spin" style="width:12px; height:12px;"></i> Sincronizando...';
        } else if (pendingCount > 0) {
            indicator.className = 'badge badge-status-warning';
            indicator.innerHTML = `<i data-lucide="cloud-off" style="width:12px; height:12px;"></i> ${pendingCount} pendente(s)`;
        } else {
            indicator.className = 'badge badge-status-success';
            indicator.innerHTML = '<i data-lucide="cloud-check" style="width:12px; height:12px;"></i> Nuvem Sincronizada';
        }

        if (global.lucide && typeof global.lucide.createIcons === 'function') {
            try { global.lucide.createIcons(); } catch(e) {}
        }
    }

    /**
     * Listener para eventos online/offline do navegador
     */
    function initSyncListeners() {
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('online', function() {
                console.log('[Sync Engine] Conexão restabelecida. Processando fila pendente...');
                processSyncQueue();
            });

            // Tenta processar fila a cada 30 segundos se houver pendências
            setInterval(function() {
                var q = getSyncQueue();
                if (q.length > 0) processSyncQueue();
            }, 30000);
        }
    }

    // Inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initSyncListeners();
            processSyncQueue();
        });
    } else {
        initSyncListeners();
        processSyncQueue();
    }

    // Exposição global
    global.enqueueSyncAction = enqueueSyncAction;
    global.processSyncQueue = processSyncQueue;
    global.getSyncQueue = getSyncQueue;

})(typeof window !== 'undefined' ? window : this);
