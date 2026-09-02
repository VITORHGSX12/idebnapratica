/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — DIRETÓRIO OFICIAL DE USUÁRIOS E PERFIS INSTITUCIONAIS
 * Arquivo: js/data/official_users_directory.js
 * Descrição: Catálogo de referência de perfis e e-mails institucionais da rede.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var OFFICIAL_REGISTERED_USERS = [
        {
            email: 'semed@goncalvesdias.ma.gov.br',
            nome: 'Secretaria Municipal de Educação',
            role: 'Gestor da Rede',
            subRole: 'Gestão Executiva SEMED',
            escola: 'Rede Municipal Oficial',
            turma: 'Todas as Turmas',
            avatar: '🧑‍💼'
        },
        {
            email: 'admin@goncalvesdias.ma.gov.br',
            nome: 'Administrador TI / DPO',
            role: 'Master Admin',
            subRole: 'Administrador(a) do Sistema & TI',
            escola: 'Administração TI / DPO',
            turma: 'Todas as Redes',
            avatar: '👨‍💻'
        },
        {
            email: 'diretor@goncalvesdias.ma.gov.br',
            nome: 'Profa. Antonia Silva (Diretora)',
            role: 'Diretor Escola',
            subRole: 'Diretora Escolar • UI JOSE CORREA LIMA',
            escola: 'UI JOSE CORREA LIMA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.correa@goncalvesdias.ma.gov.br',
            nome: 'Direção UI José Corrêa Lima',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UI JOSE CORREA LIMA',
            escola: 'UI JOSE CORREA LIMA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.benta@goncalvesdias.ma.gov.br',
            nome: 'Direção UE Benta Vilanova',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UNIDADE ESCOLAR BENTA VILANOVA',
            escola: 'UNIDADE ESCOLAR BENTA VILANOVA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.veloso@goncalvesdias.ma.gov.br',
            nome: 'Direção UI Raimundo Veloso Barros',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UI RAIMUNDO VELOSO BARROS',
            escola: 'UI RAIMUNDO VELOSO BARROS',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.afonso@goncalvesdias.ma.gov.br',
            nome: 'Direção UI Afonso Pena',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UNIDADE INTEGRADA AFONSO PENA',
            escola: 'UNIDADE INTEGRADA AFONSO PENA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.diogo@goncalvesdias.ma.gov.br',
            nome: 'Direção UI Gov Diogo Nogueira',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UI GOV DIOGO NOGUEIRA',
            escola: 'UI GOV DIOGO NOGUEIRA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.deocleciano@goncalvesdias.ma.gov.br',
            nome: 'Direção UI Deocleciano F. Braga',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UI DEOCLECIANO FERREIRA BRAGA',
            escola: 'UI DEOCLECIANO FERREIRA BRAGA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.nonato@goncalvesdias.ma.gov.br',
            nome: 'Direção UI Nonato Araújo',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UI NONATO ARAUJO',
            escola: 'UI NONATO ARAUJO',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.saovicente@goncalvesdias.ma.gov.br',
            nome: 'Direção EM São Vicente de Paula',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • EM SAO VICENTE DE PAULA',
            escola: 'EM SAO VICENTE DE PAULA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.santoantonio@goncalvesdias.ma.gov.br',
            nome: 'Direção EM Santo Antônio',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • EM SANTO ANTONIO',
            escola: 'EM SANTO ANTONIO',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'professor@goncalvesdias.ma.gov.br',
            nome: 'Prof. Carlos Eduardo (Docente)',
            role: 'Professor',
            subRole: 'Professor(a) • 5º Ano A',
            escola: 'UI JOSE CORREA LIMA',
            turma: '5º Ano A',
            avatar: '👨‍🏫'
        },
        {
            email: 'prof.2ano@goncalvesdias.ma.gov.br',
            nome: 'Profª. Ana Lúcia (Alfabetização)',
            role: 'Professor',
            subRole: 'Professor(a) • 2º Ano Alfabetização',
            escola: 'UI JOSE CORREA LIMA',
            turma: '2º Ano A',
            avatar: '👩‍🏫'
        },
        {
            email: 'prof.5ano@goncalvesdias.ma.gov.br',
            nome: 'Prof. Carlos Eduardo (5º Ano)',
            role: 'Professor',
            subRole: 'Professor(a) • 5º Ano Fundamental I',
            escola: 'UI JOSE CORREA LIMA',
            turma: '5º Ano A',
            avatar: '👨‍🏫'
        },
        {
            email: 'prof.9ano@goncalvesdias.ma.gov.br',
            nome: 'Profª. Juliana Silva (9º Ano)',
            role: 'Professor',
            subRole: 'Professor(a) • 9º Ano Fundamental II',
            escola: 'UI JOSE CORREA LIMA',
            turma: '9º Ano A',
            avatar: '👩‍🏫'
        }
    ];

    global.OFFICIAL_REGISTERED_USERS = OFFICIAL_REGISTERED_USERS;

})(typeof window !== 'undefined' ? window : this);
