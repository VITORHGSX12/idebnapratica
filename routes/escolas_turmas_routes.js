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
        const user = req.user || {};
        const orgId = user.tenant_id || user.org_id || req.tenant?.id || req.tenant?.slug || 'semed_goncalves_dias';

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            const schools = state.dbEscolas || [];
            return res.json(schools);
        }

        const result = await db.query(
            `SELECT esc.*, 
                COUNT(DISTINCT t.id) as total_turmas,
                COUNT(DISTINCT a.id) as total_alunos
             FROM escolas esc
             LEFT JOIN turmas t ON t.escola_id = esc.id
             LEFT JOIN alunos a ON a.turma_id = t.id
             WHERE esc.tenant_id = $1 OR esc.tenant_id = (SELECT id FROM tenants WHERE slug = 'semed_goncalves_dias' LIMIT 1)
             GROUP BY esc.id
             ORDER BY esc.nome ASC`,
            [orgId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /api/schools:', err);
        res.status(500).json({ error: 'Erro ao listar escolas.' });
    }
});

// GET /api/classes - Listar turmas do tenant ativo com contagem de alunos
router.get('/classes', authMiddleware, async (req, res) => {
    try {
        const user = req.user || {};
        const orgId = user.tenant_id || user.org_id || req.tenant?.id || req.tenant?.slug || 'semed_goncalves_dias';

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            const classes = state.dbTurmas || [];
            return res.json(classes);
        }

        const result = await db.query(
            `SELECT 
                t.id, 
                t.nome, 
                t.serie, 
                t.turno, 
                t.ano_letivo, 
                t.escola_id, 
                esc.nome as escola,
                esc.codigo_inep,
                COUNT(a.id)::int as "alunosCount"
             FROM turmas t
             JOIN escolas esc ON esc.id = t.escola_id
             LEFT JOIN alunos a ON a.turma_id = t.id
             WHERE t.tenant_id = $1 OR t.tenant_id = (SELECT id FROM tenants WHERE slug = 'semed_goncalves_dias' LIMIT 1)
             GROUP BY t.id, t.nome, t.serie, t.turno, t.ano_letivo, t.escola_id, esc.nome, esc.codigo_inep
             ORDER BY esc.nome ASC, t.serie ASC, t.nome ASC`,
            [orgId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /api/classes:', err);
        res.status(500).json({ error: 'Erro ao listar turmas.' });
    }
});

// GET /api/classes/:id/students - Listar alunos de uma turma específica
router.get('/classes/:id/students', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user || {};
        const orgId = user.tenant_id || user.org_id || req.tenant?.id || req.tenant?.slug || 'semed_goncalves_dias';

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            const students = (state.dbAlunos || []).filter(a => a.turma_id === id || a.turmaId === id || a.turma === id);
            return res.json(students);
        }

        const result = await db.query(
            `SELECT 
                a.id, 
                a.nome, 
                a.matricula, 
                a.nascimento, 
                a.data_nascimento as "dataNascimento",
                a.cpf,
                a.necessidades_especiais as nee,
                t.id as "turmaId", 
                t.nome as turma, 
                t.serie, 
                t.turno,
                esc.id as "escolaId", 
                esc.nome as escola, 
                esc.codigo_inep as inep
             FROM alunos a
             JOIN turmas t ON t.id = a.turma_id
             JOIN escolas esc ON esc.id = t.escola_id
             WHERE t.id = $1
             ORDER BY a.nome ASC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /api/classes/:id/students:', err);
        res.status(500).json({ error: 'Erro ao listar alunos da turma.' });
    }
});

// POST /api/classes - Criar nova turma
router.post('/classes', authMiddleware, async (req, res) => {
    try {
        const { nome, serie, etapa, turno, escola, escola_id } = req.body || {};
        if (!nome) return res.status(400).json({ error: 'Nome da turma é obrigatório.' });

        // Resolver escola_id e tenant_id
        let targetEscolaId = escola_id;
        let escolaNome = escola || 'Rede Municipal';
        let tenantDbId = req.tenant?.id || req.user?.tenant_id;

        if (targetEscolaId) {
            const escQuery = await db.query('SELECT id, nome, tenant_id FROM escolas WHERE id = $1 LIMIT 1', [targetEscolaId]);
            if (escQuery.rows.length > 0) {
                escolaNome = escQuery.rows[0].nome;
                tenantDbId = escQuery.rows[0].tenant_id;
            }
        } else if (escola) {
            const cleanSearch = escola.trim().toUpperCase();
            const escQuery = await db.query(`
                SELECT id, nome, tenant_id FROM escolas 
                WHERE UPPER(nome) = $1 OR UPPER(nome) ILIKE '%' || $1 || '%'
                LIMIT 1
            `, [cleanSearch]);
            if (escQuery.rows.length > 0) {
                targetEscolaId = escQuery.rows[0].id;
                escolaNome = escQuery.rows[0].nome;
                tenantDbId = escQuery.rows[0].tenant_id;
            }
        }

        if (!targetEscolaId) {
            const firstEsc = await db.query('SELECT id, nome, tenant_id FROM escolas LIMIT 1');
            targetEscolaId = firstEsc.rows[0].id;
            escolaNome = firstEsc.rows[0].nome;
            tenantDbId = firstEsc.rows[0].tenant_id;
        }

        if (!tenantDbId) {
            const tRes = await db.query("SELECT id FROM tenants LIMIT 1");
            tenantDbId = tRes.rows[0]?.id;
        }

        const cleanSerie = serie || etapa || '5º Ano';
        const cleanTurno = turno || 'Matutino';

        const insertRes = await db.query(`
            INSERT INTO turmas (tenant_id, escola_id, nome, serie, turno, ano_letivo)
            VALUES ($1, $2, $3, $4, $5, 2026)
            RETURNING id, nome, serie, turno, ano_letivo, escola_id
        `, [tenantDbId, targetEscolaId, nome.trim(), cleanSerie, cleanTurno]);

        const createdClass = {
            id: insertRes.rows[0].id,
            nome: insertRes.rows[0].nome,
            serie: insertRes.rows[0].serie,
            turno: insertRes.rows[0].turno,
            escola_id: insertRes.rows[0].escola_id,
            escola: escolaNome,
            alunosCount: 0
        };

        return res.status(201).json({ success: true, class: createdClass });
    } catch(err) {
        console.error('Error in POST /api/classes:', err);
        res.status(500).json({ error: 'Falha ao cadastrar turma no banco de dados: ' + err.message });
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
