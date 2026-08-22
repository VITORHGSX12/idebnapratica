const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'biblioteca');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Simple Helper to create a valid minimal PDF with text
function createMinimalPdf(title, subtitle, pagesCount = 2) {
    let objects = [];
    let xref = [];
    let pos = 0;

    function addObj(content) {
        xref.push(pos);
        const objStr = `${objects.length + 1} 0 obj\n${content}\nendobj\n`;
        pos += Buffer.byteLength(objStr, 'utf8');
        objects.push(objStr);
        return objects.length;
    }

    let header = "%PDF-1.4\n";
    pos += Buffer.byteLength(header, 'utf8');

    // 1: Catalog
    addObj("<< /Type /Catalog /Pages 2 0 R >>");

    // We will build Pages obj later
    let pageObjIds = [];
    let contentObjIds = [];

    // Create contents
    for (let i = 1; i <= pagesCount; i++) {
        const streamContent = 
            `BT\n` +
            `/F1 20 Tf\n` +
            `50 750 Td\n` +
            `(${title.replace(/[()\\]/g, '')}) Tj\n` +
            `/F1 12 Tf\n` +
            `0 -30 Td\n` +
            `(${subtitle.replace(/[()\\]/g, '')}) Tj\n` +
            `/F1 10 Tf\n` +
            `0 -40 Td\n` +
            `(SEMED - Secretaria Municipal de Educacao de Goncalves Dias - MA) Tj\n` +
            `0 -25 Td\n` +
            `(Documento Oficial da Rede Municipal de Ensino - Pagina ${i} de ${pagesCount}) Tj\n` +
            `0 -30 Td\n` +
            `(Descritores Prioritarios: D01, D03, D13, D28 - Foco no IDEB 2026) Tj\n` +
            `0 -40 Td\n` +
            `(1. Questoes de interpretacao de texto e analise de questoes contextualizadas.) Tj\n` +
            `0 -25 Td\n` +
            `(2. Acompanhamento do desenvolvimento das habilidades criticas da matriz SAEB/BNCC.) Tj\n` +
            `ET\n`;

        const streamLen = Buffer.byteLength(streamContent, 'utf8');
        const cId = addObj(`<< /Length ${streamLen} >>\nstream\n${streamContent}endstream`);
        contentObjIds.push(cId);
    }

    // Font obj
    const fontObjId = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

    // Pages objects
    for (let i = 0; i < pagesCount; i++) {
        const pId = addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjId} 0 R >> >> /Contents ${contentObjIds[i]} 0 R >>`);
        pageObjIds.push(pId);
    }

    // Now recreate obj 2 (Pages)
    const kidsStr = pageObjIds.map(id => `${id} 0 R`).join(' ');
    const pagesObjContent = `<< /Type /Pages /Kids [ ${kidsStr} ] /Count ${pagesCount} >>`;
    
    // We update obj 2
    objects[1] = `2 0 obj\n${pagesObjContent}\nendobj\n`;

    // Recalculate offsets
    pos = Buffer.byteLength(header, 'utf8');
    xref = [];
    for (let i = 0; i < objects.length; i++) {
        xref.push(pos);
        pos += Buffer.byteLength(objects[i], 'utf8');
    }

    let xrefStr = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 0; i < xref.length; i++) {
        xrefStr += String(xref[i]).padStart(10, '0') + " 00000 n \n";
    }

    const trailerStr = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF`;

    return Buffer.from(header + objects.join('') + xrefStr + trailerStr, 'utf8');
}

// Simple Helper to create a valid minimal DOCX (Zip container with document.xml)
// We will construct the zip buffer manually or using basic pkzip structure
function createMinimalDocx(title, subtitle, bodyText) {
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="185ABD"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="24"/><w:color w:val="555555"/></w:rPr><w:t>${escapeXml(subtitle)}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="222222"/></w:rPr><w:t>SEMED Gonçalves Dias • Acervo Pedagógico Oficial 2026</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(bodyText)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:sz w:val="20"/><w:color w:val="666666"/></w:rPr><w:t>Orientações para o Professor: Utilize este material nas rotinas semanais de recomposição da aprendizagem e preparação para os simulados do IDEB.</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    return buildZipBuffer([
        { name: '[Content_Types].xml', data: Buffer.from(contentTypesXml, 'utf8') },
        { name: '_rels/.rels', data: Buffer.from(relsXml, 'utf8') },
        { name: 'word/document.xml', data: Buffer.from(documentXml, 'utf8') }
    ]);
}

function escapeXml(str) {
    return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function buildZipBuffer(files) {
    let localHeaders = [];
    let cdHeaders = [];
    let offset = 0;

    for (const file of files) {
        const nameBuf = Buffer.from(file.name, 'utf8');
        const dataBuf = file.data;
        const crc = crc32(dataBuf);
        const size = dataBuf.length;

        // Local Header
        const lh = Buffer.alloc(30 + nameBuf.length);
        lh.writeUInt32LE(0x04034b50, 0);
        lh.writeUInt16LE(20, 4); // version needed
        lh.writeUInt16LE(0, 6);  // flags
        lh.writeUInt16LE(0, 8);  // compression (0 = stored)
        lh.writeUInt16LE(0, 10); // time
        lh.writeUInt16LE(0, 12); // date
        lh.writeUInt32LE(crc, 14);
        lh.writeUInt32LE(size, 18);
        lh.writeUInt32LE(size, 22);
        lh.writeUInt16LE(nameBuf.length, 26);
        lh.writeUInt16LE(0, 28);
        nameBuf.copy(lh, 30);

        localHeaders.push(lh);
        localHeaders.push(dataBuf);

        // Central Directory Header
        const cdh = Buffer.alloc(46 + nameBuf.length);
        cdh.writeUInt32LE(0x02014b50, 0);
        cdh.writeUInt16LE(20, 4); // version made by
        cdh.writeUInt16LE(20, 6); // version needed
        cdh.writeUInt16LE(0, 8);  // flags
        cdh.writeUInt16LE(0, 10); // compression
        cdh.writeUInt16LE(0, 12); // time
        cdh.writeUInt16LE(0, 14); // date
        cdh.writeUInt32LE(crc, 16);
        cdh.writeUInt32LE(size, 20);
        cdh.writeUInt32LE(size, 24);
        cdh.writeUInt16LE(nameBuf.length, 28);
        cdh.writeUInt16LE(0, 30); // extra len
        cdh.writeUInt16LE(0, 32); // comment len
        cdh.writeUInt16LE(0, 34); // disk num
        cdh.writeUInt16LE(0, 36); // internal attr
        cdh.writeUInt32LE(0, 38); // external attr
        cdh.writeUInt32LE(offset, 42); // relative offset
        nameBuf.copy(cdh, 46);

        cdHeaders.push(cdh);

        offset += lh.length + dataBuf.length;
    }

    const cdOffset = offset;
    let cdSize = 0;
    for (const c of cdHeaders) cdSize += c.length;

    // End of central directory record
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4); // disk
    eocd.writeUInt16LE(0, 6); // start disk
    eocd.writeUInt16LE(files.length, 8); // entries on disk
    eocd.writeUInt16LE(files.length, 10); // total entries
    eocd.writeUInt32LE(cdSize, 12);
    eocd.writeUInt32LE(cdOffset, 16);
    eocd.writeUInt16LE(0, 20); // comment len

    return Buffer.concat([...localHeaders, ...cdHeaders, eocd]);
}

function crc32(buf) {
    let crc = ~0;
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ ~0) >>> 0;
}

const crcTable = (() => {
    let table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
        }
        table[i] = c;
    }
    return table;
})();

// Create the files for the initial official library
const initialFiles = [
    {
        filename: 'Simulado_5Ano_Portugues_SEMED_2026.pdf',
        type: 'pdf',
        title: 'Simulado Diagnóstico 5º Ano • Língua Portuguesa',
        subtitle: 'Caderno Específico de Inferência e Informações Explícitas (D1, D3, D4)'
    },
    {
        filename: 'Simulado_5Ano_Matematica_SEMED_2026.pdf',
        type: 'pdf',
        title: 'Simulado Diagnóstico 5º Ano • Matemática',
        subtitle: 'Caderno Específico de Geometria, Espaço & Forma e Operações (D13, D26, D28)'
    },
    {
        filename: 'Oficinas_Calculo_Mental_Atividades.docx',
        type: 'docx',
        title: 'Oficinas de Cálculo Mental & Resolução de Problemas',
        subtitle: 'Caderno de Atividades Práticas para 4º e 5º Anos',
        text: 'Atividades práticas de cálculo mental, situações problema de adição, subtração, multiplicação e raciocínio lógico.'
    },
    {
        filename: 'Simulado_Oficial_SAEB_5Ano.pdf',
        type: 'pdf',
        title: 'Caderno de Simulado Oficial SAEB • 5º Ano EF',
        subtitle: 'Língua Portuguesa (Leitura) & Matemática (Problemas)'
    },
    {
        filename: 'Simulado_9Ano_Prova_Brasil.pdf',
        type: 'pdf',
        title: 'Caderno de Simulado Prova Brasil • 9º Ano EF',
        subtitle: 'Língua Portuguesa & Matemática (Anos Finais)'
    },
    {
        filename: 'Matriz_Curricular_Descritores_Comentada_2026.pdf',
        type: 'pdf',
        title: 'Matriz Curricular de Descritores Comentada • SAEB 2026',
        subtitle: 'Escala de Proficiência, Habilidades BNCC e Exemplos de Itens'
    },
    {
        filename: 'Guia_Fluencia_Leitora_2Ano.docx',
        type: 'docx',
        title: 'Caderno de Fluência Leitora & Alfabetização • 2º Ano EF',
        subtitle: 'Avaliação Diagnóstica SEAMA / Compromisso Criança Alfabetizada',
        text: 'Conjunto estruturado de parlendas, cantigas e textos de fluência leitora para monitoramento no 2º ano.'
    },
    {
        filename: 'Guia_Intervencao_Pedagogica_SEMED.pdf',
        type: 'pdf',
        title: 'Guia de Intervenção Pedagógica & Nivelamento (SEMED)',
        subtitle: 'Orientações Práticas para Gestores e Professores de Gonçalves Dias'
    }
];

for (const item of initialFiles) {
    const dest = path.join(UPLOADS_DIR, item.filename);
    let buf;
    if (item.type === 'pdf') {
        buf = createMinimalPdf(item.title, item.subtitle, 4);
    } else {
        buf = createMinimalDocx(item.title, item.subtitle, item.text || 'Documento pedagógico da rede municipal.');
    }
    fs.writeFileSync(dest, buf);
    console.log(`[Init Library File] Created real file ${item.filename} (${buf.length} bytes)`);
}

console.log('[Init Library Files] All standard library files generated successfully!');
