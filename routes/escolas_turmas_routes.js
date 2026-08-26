// =============================================================================
// ROTAS DE GESTÃO DE ESCOLAS, TURMAS E PROFESSORES (ROUTER)
// =============================================================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const db = require('../db');
const { authMiddleware, authorize } = require('../middleware/auth');

// GET /api/schools - Listar escolas do tenant ativo
router.get('/schools', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.org_id || req.tenant?.slug || 'semed_goncalves_dias';

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            const schools = state.dbEscolas || [];
            return res.json(schools);
        }

        const result = await db.query(
            'SELECT * FROM escolas WHERE tenant_id = $1 ORDER BY nome ASC',
            [orgId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /api/schools:', err);
        res.status(500).json({ error: 'Erro ao listar escolas.' });
    }
});

// GET /api/classes - Listar turmas do tenant ativo
router.get('/classes', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.org_id || req.tenant?.slug || 'semed_goncalves_dias';

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            const classes = state.dbTurmas || [];
            return res.json(classes);
        }

        const result = await db.query(
            'SELECT * FROM turmas WHERE tenant_id = $1 ORDER BY nome ASC',
            [orgId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /api/classes:', err);
        res.status(500).json({ error: 'Erro ao listar turmas.' });
    }
});

// POST /api/classes - Criar nova turma
router.post('/classes', authMiddleware, async (req, res) => {
    try {
        const { nome, serie, etapa, turno, escola, escola_id } = req.body || {};
        if (!nome) return res.status(400).json({ error: 'Nome da turma é obrigatório.' });

        const activeTenant = req.tenant?.slug || 'gd';
        const tenantDbId = req.tenant?.id || activeTenant;

        const newClass = {
            id: `tur_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            nome,
            serie: serie || etapa || 'Ensino Fundamental',
            etapa: etapa || serie || 'Ensino Fundamental',
            turno: turno || 'Matutino',
            escola: escola || 'Rede Municipal',
            escola_id: escola_id || 'esc_1',
            ano_letivo: 2026,
            created_at: new Date().toISOString()
        };

        if (db.useLocalFallback) {
            let fileState = {};
            if (fs.existsSync(db.LOCAL_DB_FILE)) {
                try { fileState = JSON.parse(fs.readFileSync(db.LOCAL_DB_FILE, 'utf8')); } catch(e) {}
            }
            if (!fileState[activeTenant]) fileState[activeTenant] = {};
            if (!fileState[activeTenant].dbTurmas) fileState[activeTenant].dbTurmas = [];
            fileState[activeTenant].dbTurmas.push(newClass);
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
        } else {
            await db.queryWithTenant(tenantDbId, `
                INSERT INTO turmas (tenant_id, escola_id, nome, serie, turno, ano_letivo)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [tenantDbId, newClass.escola_id, newClass.nome, newClass.serie, newClass.turno, 2026]);
        }

        return res.status(201).json({ success: true, class: newClass });
    } catch(err) {
        console.error('Error in POST /api/classes:', err);
        res.status(500).json({ error: 'Falha ao sincronizar turma na nuvem.' });
    }
});

// GET /api/teachers - Listar professores
router.get('/teachers', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.org_id || req.tenant?.slug || 'semed_goncalves_dias';

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            const teachers = state.dbProfessores || [];
            return res.json(teachers);
        }

        const result = await db.query(
            'SELECT * FROM professores WHERE tenant_id = $1 ORDER BY nome ASC',
            [orgId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /api/teachers:', err);
        res.status(500).json({ error: 'Erro ao listar professores.' });
    }
});

// POST /api/teachers - Criar / Vincular Professor
router.post('/teachers', authMiddleware, async (req, res) => {
    try {
        const { nome, email, disciplina, escola, turmas } = req.body || {};
        if (!nome || !email) return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });

        const activeTenant = req.tenant?.slug || 'gd';
        const tenantDbId = req.tenant?.id || activeTenant;

        const newTeacher = {
            id: `prof_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            nome,
            email,
            disciplina: disciplina || 'Polivalente',
            escola: escola || 'Rede Municipal',
            turmas: turmas || [],
            created_at: new Date().toISOString()
        };

        if (db.useLocalFallback) {
            let fileState = {};
            if (fs.existsSync(db.LOCAL_DB_FILE)) {
                try { fileState = JSON.parse(fs.readFileSync(db.LOCAL_DB_FILE, 'utf8')); } catch(e) {}
            }
            if (!fileState[activeTenant]) fileState[activeTenant] = {};
            if (!fileState[activeTenant].dbProfessores) fileState[activeTenant].dbProfessores = [];
            fileState[activeTenant].dbProfessores.push(newTeacher);
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
        } else {
            await db.queryWithTenant(tenantDbId, `
                INSERT INTO professores (tenant_id, nome, email, disciplina)
                VALUES ($1, $2, $3, $4)
            `, [tenantDbId, newTeacher.nome, newTeacher.email, newTeacher.disciplina]);
        }

        return res.status(201).json({ success: true, teacher: newTeacher });
    } catch(err) {
        console.error('Error in POST /api/teachers:', err);
        res.status(500).json({ error: 'Falha ao sincronizar professor na nuvem.' });
    }
});

module.exports = router;
