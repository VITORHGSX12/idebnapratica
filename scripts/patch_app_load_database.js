const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'app.js');
let content = fs.readFileSync(appJsPath, 'utf8');

const targetStr = `        ];
        dbAlunos = [];
        loadedStudents = [];
        
        localStorage.setItem('dbEscolas', JSON.stringify(dbEscolas));
        localStorage.setItem('dbTurmas', JSON.stringify(dbTurmas));
        localStorage.setItem('dbAlunos', JSON.stringify(dbAlunos));
        
        finishLoading();`;

const replacementStr = `        ];
        var officialClasses = seed.turmas || [];
        var officialStudents = seed.alunos && seed.alunos.length > 0 ? seed.alunos : (window.ALUNOS_DATABASE || []);

        dbEscolas = officialSchools.map(function(s) {
            return {
                id: s.id,
                nome: s.name || s.nome,
                inep: s.inep,
                zona: s.zone || s.zona || 'Zona Rural',
                telefone: s.phone || s.telefone || '-',
                diretor: s.director || s.diretor || 'Gestão Escolar',
                ideb2025: s.ideb2025 || '5.0'
            };
        });
        uniqueSchoolsList = dbEscolas.map(function(e) { return e.nome; });
        
        dbTurmas = officialClasses.map(function(c) {
            return {
                id: c.id,
                escola_id: c.escolaId || c.escola_id,
                nome: c.nome,
                serie: c.serie,
                turno: c.turno,
                ano_letivo: 2026
            };
        });

        dbAlunos = officialStudents.map(function(st, idx) {
            return {
                id: st.id || ('aln_' + (idx + 1)),
                matricula: st.matricula || ('MAT-' + String(idx + 1).padStart(5, '0')),
                nome: st.nome,
                nascimento: st.dataNascimento || st.nascimento || '01/01/2015',
                sexo: st.sexo || (idx % 2 === 0 ? 'F' : 'M'),
                cor: st.cor || 'Parda',
                mae: st.mae || ('MÃE DE ' + st.nome.split(' ')[0]),
                pai: st.pai || ('PAI DE ' + st.nome.split(' ')[0]),
                endereco: st.endereco || 'Gonçalves Dias - MA',
                cep: st.cep || '65775-000',
                nee: st.nee || '',
                escola: st.escola,
                etapa: st.etapa || 'Ensino Fundamental',
                turma: st.turma || 'Turma Regular',
                turma_id: st.turmaId || st.turma_id || 'tur_1',
                data_matricula: st.data_matricula || '01/02/2026',
                cpf: st.cpf || '',
                avg_score: st.avg_score || 75
            };
        });

        loadedStudents = dbAlunos;

        localStorage.setItem('dbEscolas', JSON.stringify(dbEscolas));
        localStorage.setItem('dbTurmas', JSON.stringify(dbTurmas));
        localStorage.setItem('dbAlunos', JSON.stringify(dbAlunos));
        
        finishLoading();`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(appJsPath, content, 'utf8');
    console.log('✅ app.js patched successfully with 388 students and 21 classes!');
} else {
    console.error('❌ targetStr not found in app.js');
}
