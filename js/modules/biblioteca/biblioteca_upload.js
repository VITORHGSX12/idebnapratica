/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — UPLOAD ATÔMICO DE MATERIAIS (BIBLIOTECA)
 * Arquivo: js/modules/biblioteca/biblioteca_upload.js
 * Descrição: Upload atômico de arquivos (PDF e Word até 100MB) com acompanhamento
 *            de progresso em tempo real via XHR e capa personalizada.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var uploadedMainFile = null;
    var uploadedCoverFile = null;

    function getAuthToken() {
        return sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || (function() {
            var email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail') || 'admin@goncalvesdias.ma.gov.br';
            try { return btoa(email); } catch(e) { return ''; }
        })();
    }

    function openUploadPedagogicModal() {
        var modal = document.getElementById('upload-pedagogic-modal');
        if (!modal) return;

        uploadedMainFile = null;
        uploadedCoverFile = null;

        var form = document.getElementById('upload-pedagogic-form');
        if (form) form.reset();

        var filePreview = document.getElementById('file-upload-preview');
        if (filePreview) filePreview.innerHTML = '';

        var coverPreview = document.getElementById('cover-upload-preview');
        if (coverPreview) {
            coverPreview.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">Nenhuma capa personalizada enviada (será gerada automaticamente).</span>';
        }

        var progressContainer = document.getElementById('upload-progress-container');
        if (progressContainer) {
            progressContainer.classList.add('hidden');
            progressContainer.style.display = 'none';
        }

        var btnSubmit = document.getElementById('btn-submit-upload-pedagogic');
        if (btnSubmit) btnSubmit.disabled = false;

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function closeUploadPedagogicModal() {
        var modal = document.getElementById('upload-pedagogic-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    function handleMainFileUpload(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;

        var MAX_SIZE = 100 * 1024 * 1024; // 100MB
        if (file.size > MAX_SIZE) {
            var sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            alert('⚠️ O arquivo selecionado possui ' + sizeMb + ' MB e excede o limite máximo permitido de 100 MB.');
            e.target.value = '';
            return;
        }

        var ext = file.name.split('.').pop().toLowerCase();
        var allowed = ['pdf', 'doc', 'docx'];
        if (!allowed.includes(ext)) {
            alert('⚠️ Formato não permitido (. ' + ext + '). Selecione um arquivo em formato PDF (.pdf) ou Word (.doc, .docx).');
            e.target.value = '';
            return;
        }

        uploadedMainFile = file;
        var fileSizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        var isWord = ext === 'docx' || ext === 'doc';

        var titleInput = document.getElementById('new-material-title');
        if (titleInput && !titleInput.value) {
            var rawTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
            titleInput.value = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
        }

        var preview = document.getElementById('file-upload-preview');
        if (preview) {
            preview.innerHTML = '<div class="attached-file-badge" style="display:flex; align-items:center; gap:12px; background:var(--color-surface-card); border:1px solid var(--color-border-subtle); padding:10px 14px; border-radius:var(--radius-sm); margin-top:8px;">' +
                '<div style="width:36px;height:36px;border-radius:var(--radius-xs);background:var(--color-status-advanced-bg);display:flex;align-items:center;justify-content:center;color:var(--color-brand-primary);"><i data-lucide="' + (isWord ? 'file-text' : 'file') + '" style="width:18px;height:18px;"></i></div>' +
                '<div style="flex:1; min-width:0;">' +
                    '<strong style="font-size:var(--text-sm); color:var(--color-brand-primary); display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + file.name + '</strong>' +
                    '<span style="font-size:var(--text-xs); color:var(--color-accent-primary); font-weight:600;">' + fileSizeMb + ' • Formato ' + ext.toUpperCase() + ' pronto para upload</span>' +
                '</div>' +
                '<button type="button" class="btn btn-icon btn-xs" onclick="clearAttachedFile();" title="Remover arquivo" style="color:var(--color-status-critical-text);">✕</button>' +
            '</div>';
            if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
        }
    }

    function clearAttachedFile() {
        uploadedMainFile = null;
        var fileInput = document.getElementById('new-material-file-input');
        if (fileInput) fileInput.value = '';
        var preview = document.getElementById('file-upload-preview');
        if (preview) preview.innerHTML = '';
    }

    function handleCoverFileUpload(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        uploadedCoverFile = file;

        var preview = document.getElementById('cover-upload-preview');
        var reader = new FileReader();
        reader.onload = function(evt) {
            if (preview) {
                preview.innerHTML = '<div style="display:flex; align-items:center; gap:12px; margin-top:8px;">' +
                    '<img src="' + evt.target.result + '" style="width:54px; height:72px; object-fit:cover; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.15); border:1px solid var(--border-color);">' +
                    '<div>' +
                        '<strong style="font-size:0.8rem; color:var(--text-primary); display:block;">Capa personalizada carregada</strong>' +
                        '<button type="button" onclick="clearCoverFile();" class="btn btn-outline btn-xs" style="margin-top:4px; font-size:0.68rem; color:#ef4444; border-color:#fca5a5;">Remover Capa</button>' +
                    '</div>' +
                '</div>';
            }
        };
        reader.readAsDataURL(file);
    }

    function clearCoverFile() {
        uploadedCoverFile = null;
        var coverInput = document.getElementById('new-material-cover-input');
        if (coverInput) coverInput.value = '';
        var preview = document.getElementById('cover-upload-preview');
        if (preview) {
            preview.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">Nenhuma capa personalizada enviada (será gerada automaticamente).</span>';
        }
    }

    function saveNewPedagogicMaterial(e) {
        if (e) e.preventDefault();

        if (!uploadedMainFile) {
            alert('Por favor, selecione um arquivo (PDF ou Word) do seu computador.');
            return;
        }

        var title = (document.getElementById('new-material-title') || {}).value || '';
        if (!title.trim()) {
            alert('Por favor, informe o título do material.');
            return;
        }

        var subtitulo = (document.getElementById('new-material-sub') || {}).value || '';
        var comp = (document.getElementById('new-material-comp') || {}).value || 'Língua Portuguesa';
        var etapa = (document.getElementById('new-material-etapa') || {}).value || '5º Ano';
        var tipo = (document.getElementById('new-material-tipo') || {}).value || 'Simulado';
        var desc = (document.getElementById('new-material-desc') || {}).value || '';
        var corTema = (document.getElementById('new-material-color') || {}).value || '#4f46e5';

        var categoria = 'Simulados';
        if (tipo === 'Reforco' || tipo === 'Intervencao') categoria = 'Reforco';
        else if (tipo === 'Matriz') categoria = 'Matrizes';
        else if (tipo === 'Guia' || tipo === 'Gabarito') categoria = 'Guias';

        var formData = new FormData();
        formData.append('file', uploadedMainFile);
        if (uploadedCoverFile) formData.append('cover', uploadedCoverFile);
        formData.append('titulo', title.trim());
        formData.append('subtitulo', subtitulo.trim());
        formData.append('componente', comp);
        formData.append('etapa', etapa);
        formData.append('tipo', tipo);
        formData.append('categoria', categoria);
        formData.append('corTema', corTema);
        formData.append('descricao', desc.trim());

        // UI Progresso
        var progressContainer = document.getElementById('upload-progress-container');
        var progressBar = document.getElementById('upload-progress-bar');
        var progressPercent = document.getElementById('upload-progress-percent');
        var progressBytes = document.getElementById('upload-progress-bytes');
        var btnSubmit = document.getElementById('btn-submit-upload-pedagogic');

        if (progressContainer) {
            progressContainer.classList.remove('hidden');
            progressContainer.style.display = 'flex';
        }
        if (btnSubmit) btnSubmit.disabled = true;

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/library/upload', true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + getAuthToken());

        xhr.upload.onprogress = function(evt) {
            if (evt.lengthComputable) {
                var percentComplete = Math.round((evt.loaded / evt.total) * 100);
                var loadedMb = (evt.loaded / (1024 * 1024)).toFixed(1);
                var totalMb = (evt.total / (1024 * 1024)).toFixed(1);

                if (progressBar) progressBar.style.width = percentComplete + '%';
                if (progressPercent) progressPercent.textContent = percentComplete + '%';
                if (progressBytes) progressBytes.textContent = loadedMb + ' MB de ' + totalMb + ' MB transferidos';
            }
        };

        xhr.onload = function() {
            if (btnSubmit) btnSubmit.disabled = false;
            if (xhr.status === 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if (res.success && res.item) {
                        var libraryItems = global.PEDAGOGIC_LIBRARY_DATABASE || [];
                        libraryItems.unshift(res.item);
                        closeUploadPedagogicModal();
                        if (typeof global.renderPedagogicLibrary === 'function') {
                            global.renderPedagogicLibrary();
                        }
                        if (typeof global.showToast === 'function') {
                            global.showToast('Material "' + res.item.titulo + '" salvo no acervo com sucesso!', 'check');
                        }
                        return;
                    }
                } catch(e) {}
            }

            var errMessage = 'Erro no envio do arquivo.';
            try {
                var errObj = JSON.parse(xhr.responseText);
                if (errObj.error) errMessage = errObj.error;
            } catch(e) {}
            alert('❌ ' + errMessage);
        };

        xhr.onerror = function() {
            if (btnSubmit) btnSubmit.disabled = false;
            alert('❌ Erro de conexão durante o upload do arquivo.');
        };

        xhr.send(formData);
    }

    // Exposição no Escopo Global
    global.openUploadPedagogicModal = openUploadPedagogicModal;
    global.closeUploadPedagogicModal = closeUploadPedagogicModal;
    global.handleMainFileUpload = handleMainFileUpload;
    global.clearAttachedFile = clearAttachedFile;
    global.handleCoverFileUpload = handleCoverFileUpload;
    global.clearCoverFile = clearCoverFile;
    global.saveNewPedagogicMaterial = saveNewPedagogicMaterial;

})(typeof window !== 'undefined' ? window : this);
