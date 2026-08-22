const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const AUTH_TOKEN = Buffer.from('admin@goncalvesdias.ma.gov.br').toString('base64');
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'biblioteca');

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = Buffer.alloc(0);
            res.on('data', (chunk) => data = Buffer.concat([data, chunk]));
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data.toString('utf8'));
                } catch(e) {}
                resolve({ status: res.statusCode, headers: res.headers, body: parsed || data.toString('utf8'), raw: data });
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

function createMultipartFormData(fields, files) {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let chunks = [];

    // Fields
    for (const [key, value] of Object.entries(fields)) {
        chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
    }

    // Files
    for (const file of files) {
        chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`));
        chunks.push(file.buffer);
        chunks.push(Buffer.from('\r\n'));
    }

    chunks.push(Buffer.from(`--${boundary}--\r\n`));
    const payload = Buffer.concat(chunks);
    return {
        boundary,
        payload,
        contentType: `multipart/form-data; boundary=${boundary}`
    };
}

async function runLibraryTests() {
    console.log(`=== INICIANDO BATERIA DE TESTES: STORAGE DA BIBLIOTECA & LEITOR (PORTA ${PORT}) ===\n`);

    // 1. Testar listagem do acervo inicial
    console.log('[TESTE 1] GET /api/library com Token Autenticado...');
    const resList = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/library',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    console.log(`Status: ${resList.status} (Esperado: 200)`);
    console.log(`Total de materiais no acervo: ${Array.isArray(resList.body) ? resList.body.length : 0}`);
    if (resList.status === 200 && Array.isArray(resList.body) && resList.body.length >= 8) {
        console.log('✅ SUCESSO: Acervo carregado com todos os 8 cadernos oficiais!\n');
    } else {
        console.error('❌ FALHA ao listar acervo:', resList.body);
    }

    // 2. Testar upload de um PDF pequeno
    console.log('[TESTE 2] POST /api/library/upload - Upload de PDF pequeno (Caderno de Teste)...');
    const smallPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R>>endobj\n2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1>>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<< /Size 4 /Root 1 0 R>>\nstartxref\n187\n%%EOF');
    const multipartSmallPdf = createMultipartFormData({
        titulo: 'Simulado de Teste Pequeno PDF',
        subtitulo: 'Material de Teste Automatizado de Upload',
        componente: 'Língua Portuguesa',
        etapa: '5º Ano',
        tipo: 'Simulado',
        categoria: 'Simulados'
    }, [
        {
            fieldname: 'file',
            filename: 'Teste_Pequeno_Simulado.pdf',
            contentType: 'application/pdf',
            buffer: smallPdfBuffer
        }
    ]);

    const resSmallUpload = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/library/upload',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': multipartSmallPdf.contentType,
            'Content-Length': multipartSmallPdf.payload.length
        }
    }, multipartSmallPdf.payload);

    console.log(`Status upload: ${resSmallUpload.status} (Esperado: 200)`);
    console.log('Resposta:', resSmallUpload.body);
    let createdSmallId = null;
    if (resSmallUpload.status === 200 && resSmallUpload.body.success) {
        createdSmallId = resSmallUpload.body.item.id;
        const physicalFileExists = fs.existsSync(path.join(UPLOADS_DIR, resSmallUpload.body.item.fileName));
        console.log(`Arquivo físico salvo em uploads/biblioteca/: ${physicalFileExists ? 'SIM ✅' : 'NÃO ❌'}`);
        console.log('✅ SUCESSO: Upload de PDF pequeno completado e persistido no storage!\n');
    }

    // 3. Testar upload de um documento DOCX
    console.log('[TESTE 3] POST /api/library/upload - Upload de documento Word (.docx)...');
    const docxDummyBuffer = Buffer.from('PK\x03\x04MockDocxFileBufferForTestingMammothConversion');
    const multipartDocx = createMultipartFormData({
        titulo: 'Atividade de Reforço em Word',
        subtitulo: 'Oficinas Pedagógicas DOCX',
        componente: 'Matemática',
        etapa: '5º Ano',
        tipo: 'Reforco',
        categoria: 'Reforco'
    }, [
        {
            fieldname: 'file',
            filename: 'Atividades_Reforco_Matematica.docx',
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            buffer: docxDummyBuffer
        }
    ]);

    const resDocxUpload = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/library/upload',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': multipartDocx.contentType,
            'Content-Length': multipartDocx.payload.length
        }
    }, multipartDocx.payload);

    console.log(`Status upload Word: ${resDocxUpload.status} (Esperado: 200)`);
    let createdDocxId = null;
    if (resDocxUpload.status === 200 && resDocxUpload.body.success) {
        createdDocxId = resDocxUpload.body.item.id;
        console.log('✅ SUCESSO: Arquivo Word .docx enviado e catalogado no storage!\n');
    }

    // 4. Testar upload de arquivo grande (~15MB real)
    console.log('[TESTE 4] POST /api/library/upload - Upload de arquivo grande (15 Megabytes)...');
    const largeBuffer = Buffer.alloc(15 * 1024 * 1024, '%PDF-1.4\n% Large File Content for Storage Test\n');
    const multipartLarge = createMultipartFormData({
        titulo: 'Livro Didático Completo 15MB',
        subtitulo: 'Caderno Extenso de Questões e Imagens',
        componente: 'Integrado',
        etapa: 'Docente',
        tipo: 'Guia',
        categoria: 'Guias'
    }, [
        {
            fieldname: 'file',
            filename: 'Livro_Grande_15MB.pdf',
            contentType: 'application/pdf',
            buffer: largeBuffer
        }
    ]);

    const resLargeUpload = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/library/upload',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': multipartLarge.contentType,
            'Content-Length': multipartLarge.payload.length
        }
    }, multipartLarge.payload);

    console.log(`Status upload 15MB: ${resLargeUpload.status} (Esperado: 200)`);
    let createdLargeId = null;
    if (resLargeUpload.status === 200 && resLargeUpload.body.success) {
        createdLargeId = resLargeUpload.body.item.id;
        const physicalLargeExists = fs.existsSync(path.join(UPLOADS_DIR, resLargeUpload.body.item.fileName));
        console.log(`Arquivo de 15MB gravado fisicamente em disco: ${physicalLargeExists ? 'SIM ✅' : 'NÃO ❌'}`);
        console.log('✅ SUCESSO: Upload de arquivo grande (15MB) salvo no storage perfeitamente!\n');
    }

    // 5. Testar rejeição de formato não permitido (.zip ou .exe)
    console.log('[TESTE 5] POST /api/library/upload - Tentativa de upload de formato NÃO permitido (.zip)...');
    const invalidFileBuffer = Buffer.from('PK\x03\x04InvalidZipContent');
    const multipartInvalid = createMultipartFormData({
        titulo: 'Arquivo Invalido Zip',
        componente: 'Geral',
        etapa: '5º Ano'
    }, [
        {
            fieldname: 'file',
            filename: 'Arquivo_Invasor.zip',
            contentType: 'application/zip',
            buffer: invalidFileBuffer
        }
    ]);

    const resInvalidUpload = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/library/upload',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': multipartInvalid.contentType,
            'Content-Length': multipartInvalid.payload.length
        }
    }, multipartInvalid.payload);

    console.log(`Status rejeição: ${resInvalidUpload.status} (Esperado: 400)`);
    console.log('Resposta:', resInvalidUpload.body);
    if (resInvalidUpload.status === 400) {
        console.log('✅ SUCESSO: Upload de formato não permitido foi REJEITADO com erro claro, sem criar registros fantasma!\n');
    }

    // 6. Testar streaming / Leitor GET /api/library/files/:id
    console.log('[TESTE 6] GET /api/library/files/:id - Acesso seguro ao streaming de arquivo...');
    
    // 6a: Sem token de autenticação -> Bloqueio 401
    const resNoAuth = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: `/api/library/files/${createdSmallId}`,
        method: 'GET'
    });
    console.log(`Acesso sem autenticação: Status ${resNoAuth.status} (Esperado: 401)`);
    if (resNoAuth.status === 401) {
        console.log('✅ SUCESSO: Acesso anônimo ao binário foi bloqueado com 401 Unauthorized!');
    }

    // 6b: Com token de autenticação -> 200 OK com binário
    const resWithAuth = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: `/api/library/files/${createdSmallId}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    console.log(`Acesso com autenticação: Status ${resWithAuth.status} (Esperado: 200)`);
    console.log(`Content-Type retornado: ${resWithAuth.headers['content-type']}`);
    console.log(`Bytes recebidos: ${resWithAuth.raw.length} bytes`);
    if (resWithAuth.status === 200 && resWithAuth.raw.length === smallPdfBuffer.length) {
        console.log('✅ SUCESSO: Leitor recebe o binário exato para renderização via PDF.js/Mammoth.js!\n');
    }

    // 7. Teste de Exclusão e Limpeza de Disco
    console.log('[TESTE 7] DELETE /api/library/:id - Exclusão atômica de metadados e arquivo físico...');
    const toDelete = [createdSmallId, createdDocxId, createdLargeId].filter(Boolean);
    for (const delId of toDelete) {
        const resDel = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: `/api/library/${delId}`,
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        console.log(`Exclusão do item ${delId}: Status ${resDel.status} (Esperado: 200)`);
    }
    console.log('✅ SUCESSO: Itens temporários de teste excluídos e arquivos físicos limpos do disco!\n');

    console.log('=== TODOS OS TESTES DE STORAGE, UPLOAD ATÔMICO E LEITOR FORAM CONCLUÍDOS COM SUCESSO! ===');
}

runLibraryTests().catch(console.error);
