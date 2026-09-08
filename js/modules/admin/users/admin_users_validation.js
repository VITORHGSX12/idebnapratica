// =========================================================================
// SUBMÓDULO DE VALIDAÇÃO DE USUÁRIOS (RBAC / DADOS CADASTRAIS)
// SEMED Gonçalves Dias - MA • IDEB na Prática
// Responsabilidade: Validação de CPF (Módulo 11), Duplicidade e Idade
// =========================================================================

(function(global) {
    'use strict';

    /**
     * Valida CPF através do algoritmo matemático oficial da Receita Federal (Módulo 11)
     */
    function isValidCPF(cpf) {
        if (!cpf) return false;
        var clean = String(cpf).replace(/\D/g, '');
        if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;

        var soma = 0;
        for (var i = 0; i < 9; i++) soma += parseInt(clean.charAt(i), 10) * (10 - i);
        var resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(clean.charAt(9), 10)) return false;

        soma = 0;
        for (var j = 0; j < 10; j++) soma += parseInt(clean.charAt(j), 10) * (11 - j);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(clean.charAt(10), 10)) return false;

        return true;
    }

    /**
     * Calcula os 2 dígitos verificadores oficiais para uma base de 9 dígitos
     */
    function calculateValidCPF(rawDigits) {
        var clean = String(rawDigits).replace(/\D/g, '').substring(0, 9);
        if (clean.length < 9) clean = clean.padEnd(9, '1');
        var s = 0;
        for (var i = 0; i < 9; i++) s += parseInt(clean.charAt(i), 10) * (10 - i);
        var d1 = (s * 10) % 11;
        if (d1 === 10 || d1 === 11) d1 = 0;
        s = 0;
        var c10 = clean + d1;
        for (var j = 0; j < 10; j++) s += parseInt(c10.charAt(j), 10) * (11 - j);
        var d2 = (s * 10) % 11;
        if (d2 === 10 || d2 === 11) d2 = 0;
        return clean + d1 + d2;
    }

    /**
     * Verifica duplicidade de CPF na lista de usuários cadastrados
     */
    function isDuplicateCPF(cpf, currentId, usersList) {
        if (!cpf) return false;
        var clean = String(cpf).replace(/\D/g, '');
        if (!clean) return false;
        var users = usersList || (typeof global.getStoredUsers === 'function' ? global.getStoredUsers() : []);
        return users.some(function(u) {
            if (currentId && u.id === currentId) return false;
            var uClean = String(u.cpf || '').replace(/\D/g, '');
            return uClean && uClean === clean;
        });
    }

    /**
     * Verifica duplicidade de E-mail Institucional
     */
    function isDuplicateEmail(email, currentId, usersList) {
        if (!email) return false;
        var norm = String(email).trim().toLowerCase();
        var users = usersList || (typeof global.getStoredUsers === 'function' ? global.getStoredUsers() : []);
        return users.some(function(u) {
            if (currentId && u.id === currentId) return false;
            return String(u.email || '').trim().toLowerCase() === norm;
        });
    }

    /**
     * Validação rigorosa de data de nascimento e faixa etária ativa (18 a 85 anos)
     */
    function validateBirthDate(dateStr) {
        if (!dateStr || !dateStr.trim()) {
            return { valid: false, error: 'A data de nascimento é obrigatória.' };
        }
        var parts = dateStr.trim().split('/');
        if (parts.length !== 3) {
            parts = dateStr.trim().split('-');
            if (parts.length === 3 && parts[0].length === 4) parts = [parts[2], parts[1], parts[0]];
            else return { valid: false, error: 'Data de nascimento deve estar no formato DD/MM/AAAA.' };
        }
        var dia = parseInt(parts[0], 10), mes = parseInt(parts[1], 10), ano = parseInt(parts[2], 10);
        if (isNaN(dia) || isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12 || dia < 1 || dia > 31 || ano < 1920) {
            return { valid: false, error: 'Data de nascimento informada é inválida.' };
        }
        var dateObj = new Date(ano, mes - 1, dia);
        if (dateObj.getFullYear() !== ano || dateObj.getMonth() !== mes - 1 || dateObj.getDate() !== dia) {
            return { valid: false, error: 'Data de calendário inexistente.' };
        }
        var hoje = new Date();
        if (dateObj > hoje) return { valid: false, error: 'Data de nascimento inválida (data futura não permitida).' };
        var idade = hoje.getFullYear() - ano;
        var m = hoje.getMonth() - (mes - 1);
        if (m < 0 || (m === 0 && hoje.getDate() < dia)) idade--;

        if (idade < 18) {
            return { valid: false, error: 'O profissional deve ter idade mínima de 18 anos para cadastro (idade calculada: ' + idade + ' anos).' };
        }
        if (idade >= 90 || idade > 85) {
            return { valid: false, error: 'Data de nascimento irregular: profissionais com ' + idade + ' anos não podem ser cadastrados no sistema.' };
        }
        return { valid: true, idade: idade, formatted: String(dia).padStart(2, '0') + '/' + String(mes).padStart(2, '0') + '/' + ano };
    }

    // Exportação Modular & Global
    var AdminUsersValidation = {
        isValidCPF: isValidCPF,
        calculateValidCPF: calculateValidCPF,
        isDuplicateCPF: isDuplicateCPF,
        isDuplicateEmail: isDuplicateEmail,
        validateBirthDate: validateBirthDate
    };

    global.AdminUsersValidation = AdminUsersValidation;
    global.isValidCPF = isValidCPF;
    global.calculateValidCPF = calculateValidCPF;
    global.isDuplicateCPF = isDuplicateCPF;
    global.isDuplicateEmail = isDuplicateEmail;
    global.validateBirthDate = validateBirthDate;

})(typeof window !== 'undefined' ? window : this);
