// =============================================================================
// SERVIÇO: VÍNCULO TURMA ↔ PROFESSOR & PLANEJAMENTO PEDAGÓGICO
// =============================================================================

const db = require('../db');
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../local_db_state.json');

function getLocalState() {
    if (!fs.existsSync(STATE_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch(e) {
        return {};
    }
}

function saveLocalState(state) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    } catch(e) {
        console.error('[PlanejamentoTurmasService saveLocalState Error]:', e);
    }
}

let dbInitialized = false;
async function ensureDbSchema() {
    if (db.useLocalFallback || dbInitialized) return;
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS public.turma_professor (
                id SERIAL PRIMARY KEY,
                turma_id VARCHAR(100) NOT NULL,
                professor_id VARCHAR(100) NOT NULL,
                papel VARCHAR(50) DEFAULT 'titular',
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (turma_id, professor_id)
            );
            CREATE TABLE IF NOT EXISTS public.planejamento (
                id SERIAL PRIMARY KEY,
                turma_id VARCHAR(100) NOT NULL,
                aluno_id VARCHAR(100) NULL,
                professor_id VARCHAR(100) NOT NULL,
                professor_nome VARCHAR(255),
                titulo VARCHAR(255) NOT NULL,
                descricao TEXT,
                disciplina VARCHAR(100) DEFAULT 'Polivalente',
                data_inicio DATE,
                data_fim DATE,
                status VARCHAR(50) DEFAULT 'planejado',
                habilidades_bncc TEXT[] DEFAULT '{}',
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        dbInitialized = true;
    } catch(e) {
        // Fallback gracefully
    }
}

/**
 * Retorna todos os professores vinculados a uma turma
 */
async function getProfessoresByTurma(turmaId) {
    if (!turmaId) return [];
    await ensureDbSchema();

    if (!db.useLocalFallback) {
        try {
            const res = await db.query(`
                SELECT tp.id, tp.turma_id, tp.professor_id, tp.papel, tp.criado_em,
                       COALESCE(u.nome, tp.professor_id) as nome,
                       COALESCE(u.email, '') as email,
                       COALESCE(u.telefone, '') as telefone
                FROM public.turma_professor tp
                LEFT JOIN public.usuarios u ON u.id = tp.professor_id
                WHERE tp.turma_id = $1
                ORDER BY tp.papel ASC, nome ASC
            `, [turmaId.toString()]);

            if (res.rows) return res.rows;
        } catch(e) {
            console.error('[getProfessoresByTurma DB Error]:', e.message);
        }
    }

    const state = getLocalState();
    const links = state.turma_professores || [];
    const matched = links.filter(l => l.turma_id === turmaId || l.turmaId === turmaId);
    
    // Obter dados do usuário/professor
    const usersFile = path.join(__dirname, '../users.json');
    let users = [];
    if (fs.existsSync(usersFile)) {
        try { users = JSON.parse(fs.readFileSync(usersFile, 'utf8')); } catch(e) {}
    }

    return matched.map(m => {
        const u = users.find(x => x.id === m.professor_id || x.email === m.professor_id) || {};
        return {
            id: m.id || `${m.turma_id}_${m.professor_id}`,
            turma_id: m.turma_id,
            professor_id: m.professor_id,
            papel: m.papel || 'titular',
            nome: u.nome || m.professor_nome || m.professor_id,
            email: u.email || '',
            telefone: u.telefone || ''
        };
    });
}

/**
 * Vincula um professor a uma turma
 */
async function linkProfessorToTurma(turmaId, professorId, papel = 'titular', professorNome = null) {
    if (!turmaId || !professorId) {
        const err = new Error('Turma e Professor são obrigatórios');
        err.statusCode = 400;
        throw err;
    }

    await ensureDbSchema();
    const cleanTurmaId = turmaId.toString().trim();
    const cleanProfId = professorId.toString().trim();

    if (!db.useLocalFallback) {
        try {
            await db.query(`
                INSERT INTO public.turma_professor (turma_id, professor_id, papel)
                VALUES ($1, $2, $3)
                ON CONFLICT (turma_id, professor_id) DO UPDATE SET papel = EXCLUDED.papel
            `, [cleanTurmaId, cleanProfId, papel]);
        } catch(e) {
            console.error('[linkProfessorToTurma DB Error]:', e.message);
        }
    }

    const state = getLocalState();
    if (!state.turma_professores) state.turma_professores = [];
    const existsIdx = state.turma_professores.findIndex(l => (l.turma_id === cleanTurmaId || l.turmaId === cleanTurmaId) && l.professor_id === cleanProfId);
    
    if (existsIdx >= 0) {
        state.turma_professores[existsIdx].papel = papel;
    } else {
        state.turma_professores.push({
            id: `tp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            turma_id: cleanTurmaId,
            professor_id: cleanProfId,
            professor_nome: professorNome || cleanProfId,
            papel: papel,
            criado_em: new Date().toISOString()
        });
    }
    saveLocalState(state);

    return { success: true, message: 'Professor vinculado com sucesso à turma.' };
}

/**
 * Remove o vínculo de um professor com a turma
 */
async function unlinkProfessorFromTurma(turmaId, professorId) {
    if (!turmaId || !professorId) {
        const err = new Error('Turma e Professor são obrigatórios');
        err.statusCode = 400;
        throw err;
    }

    await ensureDbSchema();
    const cleanTurmaId = turmaId.toString().trim();
    const cleanProfId = professorId.toString().trim();

    if (!db.useLocalFallback) {
        try {
            await db.query(`
                DELETE FROM public.turma_professor 
                WHERE turma_id = $1 AND professor_id = $2
            `, [cleanTurmaId, cleanProfId]);
        } catch(e) {
            console.error('[unlinkProfessorFromTurma DB Error]:', e.message);
        }
    }

    const state = getLocalState();
    if (state.turma_professores) {
        state.turma_professores = state.turma_professores.filter(l => !( (l.turma_id === cleanTurmaId || l.turmaId === cleanTurmaId) && l.professor_id === cleanProfId ));
        saveLocalState(state);
    }

    return { success: true, message: 'Professor desvinculado com sucesso.' };
}

/**
 * Retorna as turmas vinculadas a um professor
 */
async function getTurmasByProfessor(professorId) {
    if (!professorId) return [];
    await ensureDbSchema();

    const cleanProfId = professorId.toString().trim();

    if (!db.useLocalFallback) {
        try {
            const res = await db.query(`
                SELECT t.id, t.nome, t.serie, t.turno, t.ano_letivo, t.escola_id,
                       esc.nome as escola, esc.codigo_inep,
                       COUNT(DISTINCT a.id)::int as "alunosCount",
                       tp.papel as "papelDocente"
                FROM public.turma_professor tp
                JOIN public.turmas t ON t.id::text = tp.turma_id OR t.nome = tp.turma_id
                JOIN public.escolas esc ON esc.id = t.escola_id
                LEFT JOIN public.alunos a ON a.turma_id = t.id
                WHERE tp.professor_id = $1
                GROUP BY t.id, t.nome, t.serie, t.turno, t.ano_letivo, t.escola_id, esc.nome, esc.codigo_inep, tp.papel
                ORDER BY esc.nome ASC, t.serie ASC, t.nome ASC
            `, [cleanProfId]);

            if (res.rows && res.rows.length > 0) return res.rows;
        } catch(e) {
            console.error('[getTurmasByProfessor DB Error]:', e.message);
        }
    }

    const state = getLocalState();
    const links = state.turma_professores || [];
    const matchedLinks = links.filter(l => l.professor_id === cleanProfId || (l.professor_nome && l.professor_nome.toLowerCase().includes(cleanProfId.toLowerCase())));
    const turmaIds = new Set(matchedLinks.map(l => l.turma_id || l.turmaId));

    const allClasses = state.dbTurmas || [];
    return allClasses.filter(c => turmaIds.has(c.id) || turmaIds.has(c.nome));
}

/**
 * Verifica se um professor tem permissão para acessar uma turma
 */
async function isProfessorLinkedToTurma(professorId, turmaId) {
    if (!professorId || !turmaId) return false;
    const cleanTurmaId = turmaId.toString().trim();
    const cleanProfId = professorId.toString().trim();

    await ensureDbSchema();

    if (!db.useLocalFallback) {
        try {
            const res = await db.query(`
                SELECT id FROM public.turma_professor 
                WHERE (turma_id = $1 OR turma_id IN (SELECT id::text FROM public.turmas WHERE nome = $1 OR id::text = $1)) 
                  AND professor_id = $2
                LIMIT 1
            `, [cleanTurmaId, cleanProfId]);

            if (res.rows && res.rows.length > 0) return true;
        } catch(e) {}
    }

    const state = getLocalState();
    const links = state.turma_professores || [];
    return links.some(l => (l.turma_id === cleanTurmaId || l.turmaId === cleanTurmaId) && (l.professor_id === cleanProfId || l.professor_id.includes(cleanProfId)));
}

// =============================================================================
// MÓDULO DE PLANEJAMENTO PEDAGÓGICO
// =============================================================================

/**
 * Lista planejamentos de uma turma (gerais e/ou por aluno)
 */
async function getPlanejamentosByTurma(turmaId, alunoId = null) {
    if (!turmaId) return [];
    await ensureDbSchema();

    const cleanTurmaId = turmaId.toString().trim();

    if (!db.useLocalFallback) {
        try {
            let sql = `
                SELECT p.*,
                       COALESCE(a.nome, 'Turma Completa') as aluno_nome,
                       COALESCE(u.nome, p.professor_nome) as professor_nome_display
                FROM public.planejamento p
                LEFT JOIN public.alunos a ON a.id::text = p.aluno_id OR a.matricula = p.aluno_id
                LEFT JOIN public.usuarios u ON u.id = p.professor_id
                WHERE p.turma_id = $1
            `;
            const params = [cleanTurmaId];

            if (alunoId) {
                sql += ` AND p.aluno_id = $2`;
                params.push(alunoId.toString().trim());
            }

            sql += ` ORDER BY p.data_inicio DESC NULLS LAST, p.criado_em DESC`;

            const res = await db.query(sql, params);
            if (res.rows) return res.rows;
        } catch(e) {
            console.error('[getPlanejamentosByTurma DB Error]:', e.message);
        }
    }

    const state = getLocalState();
    const plans = state.dbPlanejamentos || [];
    return plans.filter(p => {
        if (p.turma_id !== cleanTurmaId && p.turmaId !== cleanTurmaId) return false;
        if (alunoId) {
            return p.aluno_id === alunoId.toString().trim();
        }
        return true;
    });
}

/**
 * Cria um novo planejamento
 */
async function createPlanejamento(planData) {
    const { turma_id, aluno_id, professor_id, professor_nome, titulo, descricao, disciplina, data_inicio, data_fim, status, habilidades_bncc } = planData;

    if (!turma_id || !titulo || !professor_id) {
        const err = new Error('Turma, título e professor são obrigatórios para registrar o planejamento.');
        err.statusCode = 400;
        throw err;
    }

    await ensureDbSchema();

    const cleanTurmaId = turma_id.toString().trim();
    const cleanAlunoId = aluno_id ? aluno_id.toString().trim() : null;
    const cleanProfId = professor_id.toString().trim();
    const cleanTitulo = titulo.trim();
    const cleanStatus = status || 'planejado';
    const cleanHabilidades = Array.isArray(habilidades_bncc) ? habilidades_bncc : (habilidades_bncc ? [habilidades_bncc] : []);

    let newPlan = null;

    if (!db.useLocalFallback) {
        try {
            const res = await db.query(`
                INSERT INTO public.planejamento (
                    turma_id, aluno_id, professor_id, professor_nome, titulo, descricao, disciplina, data_inicio, data_fim, status, habilidades_bncc
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `, [
                cleanTurmaId,
                cleanAlunoId,
                cleanProfId,
                professor_nome || cleanProfId,
                cleanTitulo,
                descricao || '',
                disciplina || 'Polivalente',
                data_inicio || null,
                data_fim || null,
                cleanStatus,
                cleanHabilidades
            ]);

            if (res.rows && res.rows.length > 0) {
                newPlan = res.rows[0];
            }
        } catch(e) {
            console.error('[createPlanejamento DB Error]:', e.message);
        }
    }

    if (!newPlan) {
        newPlan = {
            id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            turma_id: cleanTurmaId,
            aluno_id: cleanAlunoId,
            professor_id: cleanProfId,
            professor_nome: professor_nome || cleanProfId,
            titulo: cleanTitulo,
            descricao: descricao || '',
            disciplina: disciplina || 'Polivalente',
            data_inicio: data_inicio || null,
            data_fim: data_fim || null,
            status: cleanStatus,
            habilidades_bncc: cleanHabilidades,
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString()
        };
    }

    const state = getLocalState();
    if (!state.dbPlanejamentos) state.dbPlanejamentos = [];
    state.dbPlanejamentos.push(newPlan);
    saveLocalState(state);

    return {
        success: true,
        message: 'Planejamento registrado com sucesso.',
        planejamento: newPlan,
        ...newPlan
    };
}

/**
 * Atualiza um planejamento existente
 */
async function updatePlanejamento(planId, updateData) {
    if (!planId) {
        const err = new Error('ID do planejamento é obrigatório');
        err.statusCode = 400;
        throw err;
    }

    await ensureDbSchema();
    const cleanId = planId.toString().trim();

    let updated = null;

    if (!db.useLocalFallback) {
        try {
            const res = await db.query(`
                UPDATE public.planejamento
                SET 
                    titulo = COALESCE($1, titulo),
                    descricao = COALESCE($2, descricao),
                    disciplina = COALESCE($3, disciplina),
                    data_inicio = COALESCE($4, data_inicio),
                    data_fim = COALESCE($5, data_fim),
                    status = COALESCE($6, status),
                    habilidades_bncc = COALESCE($7, habilidades_bncc),
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE id::text = $8
                RETURNING *
            `, [
                updateData.titulo || null,
                updateData.descricao !== undefined ? updateData.descricao : null,
                updateData.disciplina || null,
                updateData.data_inicio || null,
                updateData.data_fim || null,
                updateData.status || null,
                updateData.habilidades_bncc || null,
                cleanId
            ]);

            if (res.rows && res.rows.length > 0) updated = res.rows[0];
        } catch(e) {
            console.error('[updatePlanejamento DB Error]:', e.message);
        }
    }

    const state = getLocalState();
    if (state.dbPlanejamentos) {
        const idx = state.dbPlanejamentos.findIndex(p => p.id.toString() === cleanId);
        if (idx >= 0) {
            state.dbPlanejamentos[idx] = {
                ...state.dbPlanejamentos[idx],
                ...updateData,
                atualizado_em: new Date().toISOString()
            };
            if (!updated) updated = state.dbPlanejamentos[idx];
            saveLocalState(state);
        }
    }

    if (!updated) {
        const err = new Error('Planejamento não encontrado');
        err.statusCode = 404;
        throw err;
    }

    return {
        success: true,
        message: 'Planejamento atualizado com sucesso.',
        planejamento: updated,
        ...updated
    };
}

/**
 * Remove um planejamento
 */
async function deletePlanejamento(planId, requesterUser) {
    if (!planId) {
        const err = new Error('ID do planejamento é obrigatório');
        err.statusCode = 400;
        throw err;
    }

    await ensureDbSchema();
    const cleanId = planId.toString().trim();

    if (!db.useLocalFallback) {
        try {
            await db.query('DELETE FROM public.planejamento WHERE id::text = $1', [cleanId]);
        } catch(e) {
            console.error('[deletePlanejamento DB Error]:', e.message);
        }
    }

    const state = getLocalState();
    if (state.dbPlanejamentos) {
        state.dbPlanejamentos = state.dbPlanejamentos.filter(p => p.id.toString() !== cleanId);
        saveLocalState(state);
    }

    return { success: true, message: 'Planejamento excluído com sucesso.' };
}

module.exports = {
    getProfessoresByTurma,
    linkProfessorToTurma,
    unlinkProfessorFromTurma,
    getTurmasByProfessor,
    isProfessorLinkedToTurma,
    getPlanejamentosByTurma,
    createPlanejamento,
    updatePlanejamento,
    deletePlanejamento
};
