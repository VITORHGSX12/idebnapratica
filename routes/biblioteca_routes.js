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
            if (Array.isArray(data) && data.length > 0) return data;
        }
    } catch(e) {
        console.error('[Library DB Error]', e);
    }
    const initialAcervo = [
        {
            id: 'BOOK_01',
            titulo: 'Caderno de Simulado Oficial SAEB • 5º Ano EF',
            subtitulo: 'Língua Portuguesa (Leitura) & Matemática (Problemas)',
            etapa: '5º Ano',
            componente: 'Integrado',
            categoria: 'Simulados',
            tipo: 'Simulado',
            descritores: ['D01', 'D03', 'D04', 'D13', 'D14', 'D28'],
            formato: 'Caderno A4 com Gabarito',
            formatoArquivo: 'PDF',
            paginas: 28,
            ano: 2026,
            versao: 'v2.4 (2026)',
            data_publicacao: 'Fev/2026',
            viewsCount: 512,
            downloadsCount: 245,
            corTema: '#4f46e5',
            capaBadge: 'Simulado Oficial',
            fileName: 'Simulado_Oficial_SAEB_5Ano.pdf',
            fileSize: '3.5 MB',
            fileType: 'application/pdf',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-02-15T10:00:00Z',
            descricao: 'Caderno completo de 44 itens padrão SAEB/INEP diagramado para aplicação em sala de aula, com folha de respostas e gabarito desmembrável.'
        },
        {
            id: 'BOOK_07',
            titulo: 'Simulado Diagnóstico 5º Ano • Língua Portuguesa (Foco D1, D3, D4)',
            subtitulo: 'Caderno Específico de Inferência e Informações Explícitas',
            etapa: '5º Ano',
            componente: 'Língua Portuguesa',
            categoria: 'Simulados',
            tipo: 'Simulado',
            descritores: ['D01', 'D03', 'D04', 'D06'],
            formato: 'Caderno A4 com Gabarito',
            formatoArquivo: 'PDF',
            paginas: 16,
            ano: 2026,
            versao: 'v1.2 (2026)',
            data_publicacao: 'Mar/2026',
            viewsCount: 425,
            downloadsCount: 210,
            corTema: '#3b82f6',
            capaBadge: 'Simulado Língua Portuguesa',
            fileName: 'Simulado_5Ano_Portugues_SEMED_2026.pdf',
            fileSize: '2.4 MB',
            fileType: 'application/pdf',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-03-01T10:00:00Z',
            descricao: 'Avaliação direcionada aos descritores de maior defasagem apurados no 1º Simulado Diagnóstico da rede municipal.'
        },
        {
            id: 'BOOK_08',
            titulo: 'Simulado Diagnóstico 5º Ano • Matemática (Foco D13, D26, D28)',
            subtitulo: 'Caderno Específico de Geometria, Espaço & Forma e Operações',
            etapa: '5º Ano',
            componente: 'Matemática',
            categoria: 'Simulados',
            tipo: 'Simulado',
            descritores: ['D13', 'D19', 'D26', 'D28'],
            formato: 'Caderno A4 com Gabarito',
            formatoArquivo: 'PDF',
            paginas: 18,
            ano: 2026,
            versao: 'v1.2 (2026)',
            data_publicacao: 'Mar/2026',
            viewsCount: 395,
            downloadsCount: 188,
            corTema: '#2563eb',
            capaBadge: 'Simulado Matemática',
            fileName: 'Simulado_5Ano_Matematica_SEMED_2026.pdf',
            fileSize: '2.8 MB',
            fileType: 'application/pdf',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-03-01T10:00:00Z',
            descricao: '20 itens calibrados de resolução de problemas cotidianos com frações, áreas, perímetros e gráficos.'
        },
        {
            id: 'BOOK_06',
            titulo: 'Oficinas de Cálculo Mental & Resolução de Problemas',
            subtitulo: 'Caderno de Atividades Práticas para 4º e 5º Anos',
            etapa: '5º Ano',
            componente: 'Matemática',
            categoria: 'Reforco',
            tipo: 'Reforco',
            descritores: ['D13', 'D14', 'D16', 'D20'],
            formato: 'Caderno de Atividades',
            formatoArquivo: 'DOCX',
            paginas: 24,
            ano: 2026,
            versao: 'v2.0 (2026)',
            data_publicacao: 'Mar/2026',
            viewsCount: 340,
            downloadsCount: 155,
            corTema: '#f59e0b',
            capaBadge: 'Matemática Prática',
            fileName: 'Oficinas_Calculo_Mental_Atividades.docx',
            fileSize: '1.6 MB',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-03-05T10:00:00Z',
            descricao: 'Jogos matemáticos, desafios relâmpago e situações cotidianas contextualizadas na realidade de Gonçalves Dias.'
        },
        {
            id: 'BOOK_03',
            titulo: 'Caderno de Simulado Prova Brasil • 9º Ano EF',
            subtitulo: 'Língua Portuguesa & Matemática (Anos Finais)',
            etapa: '9º Ano',
            componente: 'Integrado',
            categoria: 'Simulados',
            tipo: 'Simulado',
            descritores: ['D01', 'D05', 'D07', 'D16', 'D19', 'D35'],
            formato: 'Caderno A4 com Gabarito',
            formatoArquivo: 'PDF',
            paginas: 36,
            ano: 2026,
            versao: 'v2.1 (2026)',
            data_publicacao: 'Fev/2026',
            viewsCount: 380,
            downloadsCount: 190,
            corTema: '#3b82f6',
            capaBadge: 'Simulado Oficial',
            fileName: 'Simulado_9Ano_Prova_Brasil.pdf',
            fileSize: '4.1 MB',
            fileType: 'application/pdf',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-02-20T10:00:00Z',
            descricao: '52 questões calibradas nos descritores críticos do 9º ano, incluindo álgebra, geometria e interpretação de gêneros diversos.'
        },
        {
            id: 'BOOK_05',
            titulo: 'Matriz Curricular de Descritores Comentada • SAEB 2026',
            subtitulo: 'Escala de Proficiência, Habilidades BNCC e Exemplos de Itens',
            etapa: 'Docente',
            componente: 'Integrado',
            categoria: 'Matrizes',
            tipo: 'Matriz',
            descritores: ['Todos os Descritores SAEB/SEAMA'],
            formato: 'Documento Técnico PDF',
            formatoArquivo: 'PDF',
            paginas: 52,
            ano: 2026,
            versao: 'v1.5 (2026)',
            data_publicacao: 'Fev/2026',
            viewsCount: 290,
            downloadsCount: 115,
            corTema: '#8b5cf6',
            capaBadge: 'Matriz Oficial',
            fileName: 'Matriz_Curricular_Descritores_Comentada_2026.pdf',
            fileSize: '5.2 MB',
            fileType: 'application/pdf',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-02-01T10:00:00Z',
            descricao: 'Detalhamento técnico de todos os níveis de proficiência (0 a 5) do SAEB e correspondência com as matrizes BNCC e SEAMA.'
        },
        {
            id: 'BOOK_02',
            titulo: 'Caderno de Fluência Leitora & Alfabetização • 2º Ano EF',
            subtitulo: 'Avaliação Diagnóstica SEAMA / Compromisso Criança Alfabetizada',
            etapa: '2º Ano',
            componente: 'Língua Portuguesa',
            categoria: 'Reforco',
            tipo: 'Reforco',
            descritores: ['EF02LP01', 'EF02LP04', 'EF02LP08'],
            formato: 'Guia de Aplicação & Fichas',
            formatoArquivo: 'DOCX',
            paginas: 20,
            ano: 2026,
            versao: 'v1.8 (2026)',
            data_publicacao: 'Jan/2026',
            viewsCount: 420,
            downloadsCount: 165,
            corTema: '#f59e0b',
            capaBadge: 'Fluência & Leitura',
            fileName: 'Guia_Fluencia_Leitora_2Ano.docx',
            fileSize: '1.9 MB',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-01-20T10:00:00Z',
            descricao: 'Conjunto de textos curtos, parlendas e itens de consciência fonológica para monitoramento individual da leitura no 2º ano.'
        },
        {
            id: 'BOOK_04',
            titulo: 'Guia de Intervenção Pedagógica & Nivelamento (SEMED)',
            subtitulo: 'Orientações Práticas para Gestores e Professores de Gonçalves Dias',
            etapa: 'Docente',
            componente: 'Integrado',
            categoria: 'Guias',
            tipo: 'Guia',
            descritores: ['D01', 'D03', 'D13', 'D28'],
            formato: 'Manual do Professor',
            formatoArquivo: 'PDF',
            paginas: 44,
            ano: 2026,
            versao: 'v3.0 (Oficial)',
            data_publicacao: 'Jan/2026',
            viewsCount: 310,
            downloadsCount: 125,
            corTema: '#0d9488',
            capaBadge: 'Guia do Professor',
            fileName: 'Guia_Intervencao_Pedagogica_SEMED.pdf',
            fileSize: '3.8 MB',
            fileType: 'application/pdf',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-01-10T10:00:00Z',
            descricao: 'Sequências didáticas ativas para recuperação de descritores críticos com rotinas semanais estruturadas e oficinas em grupo.'
        }
    ];
    saveLibraryAcervo(initialAcervo);
    return initialAcervo;
}

function saveLibraryAcervo(items) {
    try {
        fs.writeFileSync(LIBRARY_DB_FILE, JSON.stringify(items, null, 2), 'utf8');
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
