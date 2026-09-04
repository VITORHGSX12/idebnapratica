// =========================================================================
// DIRETÓRIO DE EQUIPE & DADOS INICIAIS DA ADMINISTRAÇÃO (SEMED)
// Responsabilidade: Catálogo estruturado da equipe gestora e docente municipal.
// =========================================================================

(function(global) {
    'use strict';

    var DEFAULT_STAFF_USERS = [
        {
            id: 'USR-001',
            nome: 'Secretaria Municipal de Educação (SEMED)',
            cpf: '012.345.678-00',
            email: 'semed@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Gestor SEMED',
            role: 'Gestor SEMED',
            escola: 'Todas as Escolas (SEMED)',
            turma: 'Todas as Turmas',
            telefone: '(99) 3662-1100',
            status: 'Ativo'
        },
        {
            id: 'USR-002',
            nome: 'Administrador TI / DPO',
            cpf: '987.654.321-99',
            email: 'admin@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Master Admin',
            role: 'Master Admin',
            escola: 'Todas as Escolas (SEMED)',
            turma: 'Todas as Redes',
            telefone: '(99) 98111-2233',
            status: 'Ativo'
        },
        {
            id: 'USR-003',
            nome: 'Profa. Antonia Silva (Diretora)',
            cpf: '234.567.890-11',
            email: 'diretor@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Diretor(a)',
            role: 'Diretor(a)',
            escola: 'UI JOSE CORREA LIMA',
            turma: 'Gestão da Unidade Escolar',
            telefone: '(99) 98455-1234',
            status: 'Ativo'
        },
        {
            id: 'USR-004',
            nome: 'Prof. Marcos Paulo Ferreira',
            cpf: '345.678.901-22',
            email: 'coord.correa@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Coordenador(a)',
            role: 'Coordenador(a)',
            escola: 'UI JOSE CORREA LIMA',
            turma: 'Coordenação Pedagógica 1º ao 9º',
            telefone: '(99) 98455-5678',
            status: 'Ativo'
        },
        {
            id: 'USR-005',
            nome: 'Prof. Carlos Eduardo (5º Ano)',
            cpf: '456.789.012-33',
            email: 'professor@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Professor(a)',
            role: 'Professor(a)',
            escola: 'UI JOSE CORREA LIMA',
            turma: '5º Ano A',
            telefone: '(99) 98234-5678',
            status: 'Ativo'
        },
        {
            id: 'USR-006',
            nome: 'Profª. Ana Lúcia Santos (2º Ano)',
            cpf: '567.890.123-44',
            email: 'prof.2ano@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Professor(a)',
            role: 'Professor(a)',
            escola: 'UI JOSE CORREA LIMA',
            turma: '2º Ano A',
            telefone: '(99) 98234-9988',
            status: 'Ativo'
        },
        {
            id: 'USR-007',
            nome: 'Profª. Juliana Silva (9º Ano)',
            cpf: '678.901.234-55',
            email: 'prof.9ano@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Professor(a)',
            role: 'Professor(a)',
            escola: 'UI JOSE CORREA LIMA',
            turma: '9º Ano A',
            telefone: '(99) 98234-1122',
            status: 'Ativo'
        },
        {
            id: 'USR-008',
            nome: 'Profa. Raimunda Nonata Costa',
            cpf: '789.012.345-66',
            email: 'diretor.emilio@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Diretor(a)',
            role: 'Diretor(a)',
            escola: 'UI EMILIO MURAD',
            turma: 'Gestão da Unidade Escolar',
            telefone: '(99) 98122-3344',
            status: 'Ativo'
        },
        {
            id: 'USR-009',
            nome: 'Prof. José Ribamar Viana',
            cpf: '890.123.456-77',
            email: 'diretor.leonardo@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Diretor(a)',
            role: 'Diretor(a)',
            escola: 'UE VEREADOR LEONARDO FERREIRA LIMA',
            turma: 'Gestão da Unidade Escolar',
            telefone: '(99) 98133-4455',
            status: 'Ativo'
        },
        {
            id: 'USR-010',
            nome: 'Profa. Francisca Alencar Gomes',
            cpf: '901.234.567-88',
            email: 'diretor.basilio@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Diretor(a)',
            role: 'Diretor(a)',
            escola: 'U I BASILIO ALVES',
            turma: 'Gestão da Unidade Escolar',
            telefone: '(99) 98144-5566',
            status: 'Ativo'
        },
        {
            id: 'USR-011',
            nome: 'Prof. João Batista Lima',
            cpf: '012.987.654-11',
            email: 'diretor.aldenora@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Diretor(a)',
            role: 'Diretor(a)',
            escola: 'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ',
            turma: 'Gestão da Unidade Escolar',
            telefone: '(99) 98155-6677',
            status: 'Ativo'
        },
        {
            id: 'USR-012',
            nome: 'Profa. Maria do Socorro Pereira',
            cpf: '123.876.543-22',
            email: 'diretor.reis@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Diretor(a)',
            role: 'Diretor(a)',
            escola: 'UE RAIMUNDO DOS REIS DA SILVA',
            turma: 'Gestão da Unidade Escolar',
            telefone: '(99) 98166-7788',
            status: 'Ativo'
        },
        {
            id: 'USR-013',
            nome: 'Prof. Antonio Carlos Gonçalves',
            cpf: '234.765.432-33',
            email: 'diretor.jgd@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Diretor(a)',
            role: 'Diretor(a)',
            escola: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS',
            turma: 'Gestão da Unidade Escolar',
            telefone: '(99) 98177-8899',
            status: 'Ativo'
        },
        {
            id: 'USR-014',
            nome: 'Profa. Teresa Cristina Nogueira',
            cpf: '345.654.321-44',
            email: 'diretor.anisio@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Diretor(a)',
            role: 'Diretor(a)',
            escola: 'UNIDADE ESCOLAR ANISIO GOMES',
            turma: 'Gestão da Unidade Escolar',
            telefone: '(99) 98188-9900',
            status: 'Ativo'
        },
        {
            id: 'USR-015',
            nome: 'Profa. Cleonice Martins Rocha',
            cpf: '456.543.210-55',
            email: 'diretor.anita@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            tipo: 'Diretor(a)',
            role: 'Diretor(a)',
            escola: 'UE ANITA FURTADO',
            turma: 'Gestão da Unidade Escolar',
            telefone: '(99) 98199-0011',
            status: 'Ativo'
        }
    ];

    global.DEFAULT_STAFF_USERS = DEFAULT_STAFF_USERS;

})(typeof window !== 'undefined' ? window : this);
