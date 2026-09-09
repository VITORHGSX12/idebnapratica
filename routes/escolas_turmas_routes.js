// =============================================================================
// ROTAS DE GESTÃO DE ESCOLAS, TURMAS, PROFESSORES E PLANEJAMENTO (ROUTER)
// =============================================================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const db = require('../db');
const { authMiddleware, authorize } = require('../middleware/auth');
const {
    getProfessoresByTurma,
    linkProfessorToTurma,
    unlinkProfessorFromTurma,
    getTurmasByProfessor,
    isProfessorLinkedToTurma,
    getPlanejamentosByTurma,
    createPlanejamento,
    updatePlanejamento,
    deletePlanejamento
} = require('../services/planejamento_turmas_service');
const { normalizeUppercaseEntity, normalizeEmail } = require('../services/normalization_service');

// Helper para checar se o perfil ativo é estritamente de professor
function isTeacherRole(user) {
    if (!user || !user.role) return false;
    const r = user.role.toLowerCase();
    return r.includes('professor') && !r.includes('admin') && !r.includes('gestor') && !r.includes('semed');
}

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

// GET /api/classes - Listar turmas (escopado por vínculo para docentes)
router.get('/classes', authMiddleware, async (req, res) => {
    try {
        const user = req.user || {};
        const orgId = user.tenant_id || user.org_id || req.tenant?.id || req.tenant?.slug || 'semed_goncalves_dias';

        // Restrição de visão para docentes: apenas turmas vinculadas ao professor
        if (isTeacherRole(user)) {
            const teacherClasses = await getTurmasByProfessor(user.id);
            if (teacherClasses && teacherClasses.length > 0) {
                return res.json(teacherClasses);
            }
            // Fallback para turmas da escola do professor se não houver registros em turma_professor
            if (user.turma) {
                const userTurmaClean = user.turma.toLowerCase();
                const allFromDb = await fetchAllClassesFromDb(orgId);
                const filtered = allFromDb.filter(c => 
                    (c.nome && c.nome.toLowerCase().includes(userTurmaClean)) || 
                    (user.escola && c.escola && c.escola.toLowerCase().includes(user.escola.toLowerCase()))
                );
                return res.json(filtered.length > 0 ? filtered : allFromDb.slice(0, 1));
            }
            return res.json([]);
        }

        const allClasses = await fetchAllClassesFromDb(orgId);
        res.json(allClasses);
    } catch (err) {
        console.error('Error in GET /api/classes:', err);
        res.status(500).json({ error: 'Erro ao listar turmas.' });
    }
});

async function fetchAllClassesFromDb(orgId) {
    if (db.useLocalFallback) {
        const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
        const fileState = JSON.parse(raw);
        const state = fileState[orgId] || fileState['goncalves-dias'] || {};
        return state.dbTurmas || [];
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
    return result.rows;
}

// GET /api/classes/:id/students - Listar alunos de uma turma com validação de permissão
router.get('/classes/:id/students', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user || {};
        const orgId = user.tenant_id || user.org_id || req.tenant?.id || req.tenant?.slug || 'semed_goncalves_dias';

        // Validação estrita de autorização no back-end para professores
        if (isTeacherRole(user)) {
            const hasAccess = await isProfessorLinkedToTurma(user.id, id);
            // Fallback de contingência caso user.turma coincida
            const fallbackAccess = user.turma && (id.includes(user.turma) || user.turma.includes(id));
            if (!hasAccess && !fallbackAccess) {
                return res.status(403).json({ error: 'Acesso negado: Você não possui vínculo com esta turma.' });
            }
        }

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
             WHERE t.id::text = $1 OR t.nome = $1
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
        const rawBody = req.body || {};
        const normalized = normalizeUppercaseEntity(rawBody, 'turma');
        const { nome, serie, etapa, turno, escola, escola_id } = normalized;
        if (!nome) return res.status(400).json({ error: 'Nome da turma é obrigatório.' });

        let targetEscolaId = escola_id;
        let escolaNome = escola || 'REDE MUNICIPAL';
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
            targetEscolaId = firstEsc.rows[0]?.id;
            escolaNome = firstEsc.rows[0]?.nome || 'REDE MUNICIPAL';
            tenantDbId = firstEsc.rows[0]?.tenant_id;
        }

        if (!tenantDbId) {
            const tRes = await db.query("SELECT id FROM tenants LIMIT 1");
            tenantDbId = tRes.rows[0]?.id;
        }

        const cleanSerie = serie || etapa || '5º ANO';
        const cleanTurno = turno || 'MATUTINO';

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

// =============================================================================
// ROTAS DE VÍNCULO PROFESSOR ↔ TURMA (N:N)
// =============================================================================

// GET /api/turmas/:id/professores
router.get(['/turmas/:id/professores', '/api/turmas/:id/professores'], authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const professores = await getProfessoresByTurma(id);
        res.json({ success: true, turmaId: id, professores });
    } catch (err) {
        console.error('Error in GET /turmas/:id/professores:', err);
        res.status(500).json({ error: 'Erro ao listar professores da turma.' });
    }
});

// POST /api/turmas/:id/professores
router.post(['/turmas/:id/professores', '/api/turmas/:id/professores'], authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'Diretor(a) Escolar', 'Coordenador(a)', 'admin', 'gestor', 'diretor', 'semed'), async (req, res) => {
    try {
        const { id } = req.params;
        const { professorId, professor_id, papel, professorNome, professor_nome } = req.body || {};
        const targetProfId = professorId || professor_id;

        if (!targetProfId) {
            return res.status(400).json({ error: 'ID do professor é obrigatório.' });
        }

        await linkProfessorToTurma(id, targetProfId, papel || 'titular', professorNome || professor_nome);
        const updatedList = await getProfessoresByTurma(id);

        res.status(201).json({
            success: true,
            message: 'Professor vinculado à turma com sucesso.',
            professores: updatedList
        });
    } catch (err) {
        console.error('Error in POST /turmas/:id/professores:', err);
        res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao vincular professor.' });
    }
});

// DELETE /api/turmas/:id/professores/:professorId
router.delete(['/turmas/:id/professores/:professorId', '/api/turmas/:id/professores/:professorId'], authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'Diretor(a) Escolar', 'Coordenador(a)', 'admin', 'gestor', 'diretor', 'semed'), async (req, res) => {
    try {
        const { id, professorId } = req.params;
        await unlinkProfessorFromTurma(id, professorId);
        const updatedList = await getProfessoresByTurma(id);

        res.json({
            success: true,
            message: 'Vínculo do professor removido com sucesso.',
            professores: updatedList
        });
    } catch (err) {
        console.error('Error in DELETE /turmas/:id/professores/:professorId:', err);
        res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao remover vínculo do professor.' });
    }
});

// GET /api/professores/:id/turmas
router.get(['/professores/:id/turmas', '/api/professores/:id/turmas'], authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const turmas = await getTurmasByProfessor(id);
        res.json({ success: true, professorId: id, turmas });
    } catch (err) {
        console.error('Error in GET /professores/:id/turmas:', err);
        res.status(500).json({ error: 'Erro ao listar turmas do professor.' });
    }
});

// =============================================================================
// ROTAS DE PLANEJAMENTO PEDAGÓGICO
// =============================================================================

// GET /api/turmas/:id/planejamentos
router.get(['/turmas/:id/planejamentos', '/api/turmas/:id/planejamentos'], authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { aluno_id } = req.query;
        const planejamentos = await getPlanejamentosByTurma(id, aluno_id);
        res.json({ success: true, turmaId: id, planejamentos });
    } catch (err) {
        console.error('Error in GET /turmas/:id/planejamentos:', err);
        res.status(500).json({ error: 'Erro ao listar planejamentos da turma.' });
    }
});

// POST /api/turmas/:id/planejamentos
router.post(['/turmas/:id/planejamentos', '/api/turmas/:id/planejamentos'], authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user || {};
        const { titulo, descricao, aluno_id, data_inicio, data_fim, status, disciplina, habilidades_bncc } = req.body || {};

        if (!titulo) {
            return res.status(400).json({ error: 'Título do planejamento é obrigatório.' });
        }

        const plan = await createPlanejamento({
            turma_id: id,
            aluno_id: aluno_id || null,
            professor_id: user.id || 'usr_professor',
            professor_nome: user.nome || 'Professor(a)',
            titulo,
            descricao,
            disciplina,
            data_inicio,
            data_fim,
            status,
            habilidades_bncc
        });

        res.status(201).json({ success: true, planejamento: plan });
    } catch (err) {
        console.error('Error in POST /turmas/:id/planejamentos:', err);
        res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao registrar planejamento.' });
    }
});

// PUT /api/planejamentos/:id
router.put(['/planejamentos/:id', '/api/planejamentos/:id'], authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await updatePlanejamento(id, req.body || {});
        res.json({ success: true, planejamento: updated });
    } catch (err) {
        console.error('Error in PUT /planejamentos/:id:', err);
        res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao atualizar planejamento.' });
    }
});

// DELETE /api/planejamentos/:id
router.delete(['/planejamentos/:id', '/api/planejamentos/:id'], authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await deletePlanejamento(id, req.user);
        res.json({ success: true, message: 'Planejamento excluído com sucesso.' });
    } catch (err) {
        console.error('Error in DELETE /planejamentos/:id:', err);
        res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao excluir planejamento.' });
    }
});

// =============================================================================
// ROTAS DE PROFESSORES (LEGACY COMPATIBILITY)
// =============================================================================

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

router.post('/teachers', authMiddleware, async (req, res) => {
    try {
        const rawBody = req.body || {};
        const normalized = normalizeUppercaseEntity(rawBody, 'usuario');
        const { nome, disciplina, escola, turmas } = normalized;
        const email = normalizeEmail(rawBody.email);
        if (!nome || !email) return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });

        const activeTenant = req.tenant?.slug || 'gd';
        const tenantDbId = req.tenant?.id || activeTenant;

        const newTeacher = {
            id: `prof_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            nome,
            email,
            disciplina: disciplina || 'POLIVALENTE',
            escola: escola || 'REDE MUNICIPAL',
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
