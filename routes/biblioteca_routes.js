// =============================================================================
// ROTAS DE GESTÃO DO ACERVO DA BIBLIOTECA PEDAGÓGICA (ROUTER)
// =============================================================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { authMiddleware, authorize } = require('../middleware/auth');

const LIBRARY_UPLOADS_DIR = path.join(__dirname, '../uploads', 'biblioteca');
const LIBRARY_DB_FILE = path.join(__dirname, '../data', 'biblioteca_acervo.json');

if (!fs.existsSync(LIBRARY_UPLOADS_DIR)) {
    fs.mkdirSync(LIBRARY_UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(path.dirname(LIBRARY_DB_FILE))) {
    fs.mkdirSync(path.dirname(LIBRARY_DB_FILE), { recursive: true });
}

// Configuração do Multer para armazenamento atômico em disco com limite de 100MB
const libraryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, LIBRARY_UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeBaseName = path.basename(file.originalname, ext)
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 50);
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E6);
        cb(null, `${safeBaseName}_${uniqueSuffix}${ext}`);
    }
});

const libraryFileFilter = (req, file, cb) => {
    const allowedExts = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de arquivo não suportado. Por favor envie arquivos em formato PDF (.pdf) ou Word (.doc, .docx).'), false);
    }
};

const uploadLibraryMiddleware = multer({
    storage: libraryStorage,
    fileFilter: libraryFileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
}).fields([
    { name: 'file', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]);

function getLibraryAcervo() {
    try {
        if (fs.existsSync(LIBRARY_DB_FILE)) {
            const data = JSON.parse(fs.readFileSync(LIBRARY_DB_FILE, 'utf8'));
            if (Array.isArray(data)) return data;
        }
    } catch(e) {
        console.error('[Library DB Error]', e);
    }
    return [];
}

function saveLibraryAcervo(items) {
    try {
        fs.writeFileSync(LIBRARY_DB_FILE, JSON.stringify(items || [], null, 2), 'utf8');
    } catch(e) {
        console.error('[Library DB Save Error]', e);
    }
}

// GET /api/library - Listar acervo da biblioteca pedagógica
router.get('/library', authMiddleware, (req, res) => {
    try {
        const acervo = getLibraryAcervo();
        res.json(acervo);
    } catch (err) {
        console.error('Error in GET /api/library:', err);
        res.status(500).json({ error: 'Erro ao listar acervo da biblioteca.' });
    }
});

// POST /api/library/upload - Upload atômico de material com metadados
router.post('/library/upload', (req, res) => {
    uploadLibraryMiddleware(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Tamanho de arquivo excedido. O limite máximo permitido para upload é de 100MB.' });
            }
            return res.status(400).json({ error: err.message || 'Erro durante o upload do arquivo.' });
        }

        let savedFilePath = null;
        let savedCoverPath = null;

        try {
            const { titulo, subtitulo, etapa, componente, categoria, tipo, descritores, formato, ano, versao, corTema, capaBadge, descricao } = req.body;

            if (!titulo || !titulo.trim()) {
                if (req.files && req.files.file && req.files.file[0]) fs.unlinkSync(req.files.file[0].path);
                return res.status(400).json({ error: 'O título do material é obrigatório.' });
            }

            const mainFile = req.files && req.files.file && req.files.file[0];
            if (!mainFile) {
                return res.status(400).json({ error: 'Nenhum arquivo principal (.pdf, .doc ou .docx) foi anexado.' });
            }

            savedFilePath = mainFile.path;
            const coverFile = req.files && req.files.cover && req.files.cover[0];
            if (coverFile) savedCoverPath = coverFile.path;

            const ext = path.extname(mainFile.originalname).toLowerCase();
            const isWord = ext === '.docx' || ext === '.doc';
            const isPdf = ext === '.pdf';
            const formatoArquivo = isWord ? 'DOCX' : (isPdf ? 'PDF' : ext.replace('.', '').toUpperCase());
            const fileSizeMb = (mainFile.size / (1024 * 1024)).toFixed(2) + ' MB';

            const newBook = {
                id: 'BOOK_' + Date.now(),
                titulo: titulo.trim(),
                subtitulo: (subtitulo || '').trim() || (`Material Pedagógico • ${componente || 'Geral'}`),
                etapa: etapa || '5º Ano',
                componente: componente || 'Língua Portuguesa',
                categoria: categoria || 'Simulados',
                tipo: tipo || 'Simulado',
                descritores: descritores ? (Array.isArray(descritores) ? descritores : [descritores]) : ['Matriz BNCC / SAEB'],
                formato: formato || (formatoArquivo + ' Digital'),
                formatoArquivo: formatoArquivo,
                paginas: req.body.paginas ? parseInt(req.body.paginas) : 12,
                ano: ano ? parseInt(ano) : new Date().getFullYear(),
                versao: versao || `v1.0 (${new Date().getFullYear()})`,
                data_publicacao: 'Recente',
                viewsCount: 1,
                downloadsCount: 0,
                corTema: corTema || (isWord ? '#2563eb' : '#4f46e5'),
                capaBadge: capaBadge || (tipo === 'Simulado' ? 'Simulado Oficial' : (tipo === 'Reforco' ? 'Reforço Escolar' : 'Material Pedagógico')),
                capaUrl: coverFile ? `/api/library/files/${coverFile.filename}` : '',
                fileName: mainFile.filename,
                originalFileName: mainFile.originalname,
                fileSize: fileSizeMb,
                fileSizeBytes: mainFile.size,
                fileType: mainFile.mimetype,
                uploadedBy: req.user?.nome || req.user?.email || 'SEMED Gonçalves Dias',
                uploadedByEmail: req.user?.email || 'gestor@goncalvesdias.ma.gov.br',
                createdAt: new Date().toISOString(),
                descricao: (descricao || '').trim() || 'Material pedagógico adicionado ao acervo municipal da SEMED Gonçalves Dias.'
            };

            const acervo = getLibraryAcervo();
            acervo.unshift(newBook);
            saveLibraryAcervo(acervo);

            res.json({
                success: true,
                message: 'Material pedagógico enviado e catalogado com sucesso!',
                item: newBook
            });
        } catch (saveErr) {
            if (savedFilePath && fs.existsSync(savedFilePath)) {
                try { fs.unlinkSync(savedFilePath); } catch(e) {}
            }
            if (savedCoverPath && fs.existsSync(savedCoverPath)) {
                try { fs.unlinkSync(savedCoverPath); } catch(e) {}
            }
            console.error('Error saving library item:', saveErr);
            res.status(500).json({ error: 'Erro ao persistir material na biblioteca.' });
        }
    });
});

// GET /api/library/files/:id - Download / Streaming de arquivos
router.get('/library/files/:id', (req, res) => {
    try {
        const { id } = req.params;
        const acervo = getLibraryAcervo();
        const book = acervo.find(b => b.id === id || b.fileName === id || (b.originalFileName && b.originalFileName === id));
        
        let targetFileName = id;
        let originalName = id;
        let fileMime = 'application/octet-stream';

        if (book) {
            targetFileName = book.fileName;
            originalName = book.originalFileName || book.fileName || `${book.titulo}.${(book.formatoArquivo || 'pdf').toLowerCase()}`;
            fileMime = book.fileType || (targetFileName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        }

        const physicalPath = path.join(LIBRARY_UPLOADS_DIR, targetFileName);
        if (!fs.existsSync(physicalPath)) {
            return res.status(404).json({ error: 'Arquivo não encontrado no servidor de armazenamento.' });
        }

        if (book) {
            book.viewsCount = (book.viewsCount || 0) + 1;
            saveLibraryAcervo(acervo);
        }

        res.setHeader('Content-Type', fileMime);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(originalName)}"`);
        res.sendFile(physicalPath);
    } catch (err) {
        console.error('Error streaming library file:', err);
        res.status(500).json({ error: 'Erro ao recuperar arquivo do acervo.' });
    }
});

// DELETE /api/library/:id - Remover material
router.delete('/library/:id', authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'admin', 'gestor'), (req, res) => {
    try {
        const { id } = req.params;
        const acervo = getLibraryAcervo();
        const index = acervo.findIndex(b => b.id === id);

        if (index === -1) {
            return res.status(404).json({ error: 'Material não encontrado.' });
        }

        const removed = acervo.splice(index, 1)[0];
        saveLibraryAcervo(acervo);

        if (removed.fileName) {
            const physicalPath = path.join(LIBRARY_UPLOADS_DIR, removed.fileName);
            if (fs.existsSync(physicalPath)) {
                try { fs.unlinkSync(physicalPath); } catch(e) {}
            }
        }

        res.json({ success: true, message: `Material "${removed.titulo}" removido com sucesso.` });
    } catch (err) {
        console.error('Error deleting library item:', err);
        res.status(500).json({ error: 'Erro ao excluir material da biblioteca.' });
    }
});

module.exports = {
    bibliotecaRouter: router,
    getLibraryAcervo,
    saveLibraryAcervo
};
