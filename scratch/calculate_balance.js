const fs = require('fs');
const target = fs.readFileSync('scratch/original_raw_questions_step.txt', 'utf8'); // Wait, let's just write the target content from the search result

const targetStr = `        renderSliders();
        updatePromptsView();
    }

    function renderSliders() {
        slidersContainer.innerHTML = '';
        if (!activeStudent || !activeStudent.habilities) return;
        
        activeStudent.habilities.forEach((hab, idx) => {
            const sliderItem = document.createElement('div');
            sliderItem.className = 'slider-item';
            
            const histText = hab.history.join('% → ') + '%';
            
            sliderItem.innerHTML = \`
                <div class="slider-header">
                    <span class="slider-label" title="\${hab.desc}">\${hab.codigo} <span class="text-muted text-sm">(\${histText})</span></span>
                    <span class="slider-val" id="val-\${hab.codigo}">\${hab.score}%</span>
                </div>
                <input type="range" class="score-slider" data-idx="\${idx}" min="0" max="100" value="\${hab.score}">
            \`;
            
            slidersContainer.appendChild(sliderItem);
        });
        
        const sliders = slidersContainer.querySelectorAll('.score-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const idx = parseInt(slider.getAttribute('data-idx'));
                const val = parseInt(e.target.value);
                const hab = activeStudent.habilities[idx];
                hab.score = val;
                document.getElementById(\`val-\${hab.codigo}\`).textContent = \`\${val}%\`;
                updatePromptsView();
            });
        });
    }

    function getUserPromptText() {
        if (!activeStudent) return 'Nenhum aluno selecionado';
        
        let text = \`ALUNO: \${activeStudent.nome}\\n\`;
        text += \`MATRÍCULA: \${activeStudent.matricula}\\n\`;
        text += \`CPF: \${activeStudent.cpf || 'Não Informado'}\\n\`;
        text += \`MÃE: \${activeStudent.mae || 'Não Informada'}\\n\`;
        if (activeStudent.nee) {
            text += \`ATENÇÃO/ACESSIBILIDADE (NEE): \${activeStudent.nee}\\n\`;
        }
        text += \`ESCOLA: \${activeStudent.escola}\\n\`;
        text += \`ETAPA/SÉRIE: \${activeStudent.etapa}\\n\\n\`;
        text += \`HISTÓRICO LONGITUDINAL DE DESEMPENHO POR HABILIDADE BNCC (Bimestre 1 → Bimestre 2 → Bimestre 3 Atual):\\n\`;
        
        activeStudent.habilities.forEach(hab => {
            const path = [...hab.history, hab.score].join('% → ');
            text += \`- [\${hab.codigo}] \${hab.desc}: Evolução de \${path}%.\n\`;
        });
        
        return text.trim();
    }

    function updatePromptsView() {
        if (activePromptTab === 'system') {
            promptDisplayBox.textContent = systemPromptText;
        } else {
            promptDisplayBox.textContent = getUserPromptText();
        }
    }

    promptTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            promptTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            activePromptTab = btn.getAttribute('data-prompt-tab');
            updatePromptsView();
        });
    });

    function calculatePedagogicalDiagnosis(student) {
        if (!student) return 'Nenhum aluno selecionado';
        
        let strengths = [];
        let attention = [];

        student.habilities.forEach(hab => {
            if (hab.score >= 70) {
                strengths.push(hab);
            } else if (hab.score < 50) {
                attention.push(hab);
            }
        });

        let md = \`# Relatório de Diagnóstico Pedagógico Longitudinal\\n\`;
        md += \`**Aluno(a):** \${student.nome} | **Matrícula:** \underline{\${student.matricula}}\\n\`;
        md += \`**Escola:** \${student.escola} | **Série:** \${student.etapa}\\n\`;
        if (student.nee) {
            md += \`**Atenção/Acessibilidade (NEE):** \${student.nee}\\n\`;
        }
        md += \`\\n\`;
        
        md += \`### 🌟 Pontos Fortes (Desempenho Atual ≥ 70%)\\n\`;
        if (strengths.length > 0) {
            strengths.forEach(s => {
                md += \`* **\${s.codigo} (\${s.score}%):** O estudante demonstra domínio em *\${s.desc}*. \`;
                if (s.codigo.startsWith('EI')) {
                    md += \`Adapta-se bem ao convívio escolar e expressa-se de forma criativa nas dinâmicas corporais.\`;
                } else if (s.codigo.includes('LP')) {
                    md += \`Demonstra proficiência na leitura, localização de informações e interpretação textual conforme descritores de Língua Portuguesa.\`;
                } else if (s.codigo.includes('MA')) {
                    md += \`Mostra domínio no raciocínio lógico-matemático, operações numéricas e cálculo de áreas.\`;
                } else if (s.codigo.includes('CI')) {
                    md += \`Demonstra sólida compreensão dos conceitos científicos e fenômenos da natureza examinados.\`;
                } else if (s.codigo.includes('GE')) {
                    md += \`Compreende adequadamente noções espaciais, cartográficas e dinâmica de paisagens regionais.\`;
                } else {
                    md += \`Mostra consistência nas avaliações e fixação dos conceitos centrais da habilidade.\`;
                }
                md += \`\\n\`;
            });
        } else {
            md += \`*Nenhuma habilidade avaliada atingiu a linha de proficiência de 70% nesta avaliação.\\n\`;
        }
        
        md += \`\\n### ⚠️ Pontos de Atenção (Desempenho Atual < 50%)\\n\`;
        if (attention.length > 0) {
            attention.forEach(a => {
                md += \`* **\${a.codigo} (\${a.score}%):** Defasagem crítica em *\${a.desc}*.\\n\`;
                md += \`  > **Hipótese Cognitiva:** \`;
                if (a.codigo.includes('LP')) {
                    md += \`Dificuldades na decodificação, inferência de sentido ou identificação da tese central de textos, exigindo práticas contínuas de leitura e vocabulário.\`;
                } else if (a.codigo.includes('MA')) {
                    md += \`Defasagens em operações com frações, decomposição posicional ou raciocínio geométrico básico, demandando recursos didáticos manipulativos.\`;
                } else if (a.codigo.includes('CI')) {
                    md += \`Fragilidade na compreensão de estados físicos da matéria ou transformações de energia.\`;
                } else if (a.codigo.includes('GE')) {
                    md += \`Déficits na leitura cartográfica, interpretação de escalas ou compreensão de fenômenos morfoclimáticos.\`;
                } else {
                    md += \`O aluno apresenta dificuldades na fixação do conceito estrutural desta habilidade.\`;
                }
                md += \`\\n\`;
            });
        } else {
            md += \`*Excelente! O estudante não apresentou defasagens críticas (abaixo de 50%) nas habilidades avaliadas.\\n\`;
        }

        md += \`\\n### 📈 Evolução Longitudinal ao Longo do Ano\\n\`;
        student.habilities.forEach(hab => {
            const hPath = [...hab.history, hab.score];
            const diff = hab.score - hab.history[0];
            const trendText = diff > 0 ? \`crescimento de **+\${diff}%**\` : (diff < 0 ? \`declínio de **\${diff}%**\` : \`estagnação em **\${hab.score}%**\`);
            
            md += \`* **\${hab.codigo} (\underline{\${hab.desc}}):** Trajetória de \${trendText} (\${hPath.join('% → ')}%). \`;
            if (diff > 10) {
                md += \`Apresenta evolução gradual decorrente das atividades de reforço, mas exige manutenção do apoio pedagógico.\`;
            } else if (diff <= 0) {
                md += \`A curva de aprendizagem está estagnada/descendente. A metodologia de ensino atual não surtiu efeito, recomendando-se mudança de abordagem.\`;
            } else {
                md += \`Apresenta evolução estável, indicando boa absorção das intervenções em sala.\`;
            }
            md += \`\\n\`;
        });

        md += \`\\n### 🚀 Plano de Ação Pedagógico Sugerido\\n\`;
        if (attention.length > 0) {
            md += \`#### Para o Estudante:\\n\`;
            attention.forEach(a => {
                if (a.codigo === 'EF06MA05') {
                    md += \`* **Materiais Manipulativos:** Praticar frações equivalentes utilizando discos de frações coloridos.\\n\`;
                } else if (a.codigo === 'EF02LP01') {
                    md += \`* **Fichas de Silabação:** Exercícios de ordenação e formação de palavras com jogos silábicos.\\n\`;
                } else {
                    md += \`* **Reforço Direcionado:** Trilhas digitais adaptativas e atividades dirigidas focadas no objeto de estudo.\\n\`;
                }
            });
            
            md += \`\\n#### Para a Intervenção Docente (Professor):\\n\`;
            if (student.nee) {
                md += \`* **Acompanhamento no AEE:** Articular atividades de reforço adaptadas ao laudo de NEE (\${student.nee}) com a coordenação de inclusão.\\n\`;
            }
            md += \`* **Reagrupamento Dinâmico:** Organizar pequenos grupos de estudo no horário de reforço para oficinas práticas.\\n\`;
        } else {
            md += \`* **Enriquecimento Curricular:** Oferecer desafios lógicos avançados e voluntariado de monitoria pedagógica para motivar o estudante.\\n\`;
        }

        return md;
    }

    generateBtn.addEventListener('click', () => {
        if (!activeStudent) return;
        generationStatus.classList.remove('hidden');
        generateBtn.disabled = true;
        diagnosisOutputBox.innerHTML = '';

        const diagnosisMD = calculatePedagogicalDiagnosis(activeStudent);
        const parsedHTML = window.marked ? marked.parse(diagnosisMD) : \`<pre style="white-space: pre-wrap; font-family: var(--font-sans);">\${diagnosisMD}</pre>\`;

        let index = 0;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = parsedHTML;
        const childNodes = Array.from(tempDiv.childNodes);
        
        function streamNextNode() {
            if (index < childNodes.length) {
                diagnosisOutputBox.appendChild(childNodes[index].cloneNode(true));
                index++;
                diagnosisOutputBox.scrollTop = diagnosisOutputBox.scrollHeight;
                setTimeout(streamNextNode, 100);
            } else {
                generationStatus.classList.add('hidden');
                generateBtn.disabled = false;
                showToast('Diagnóstico pedagógico gerado com sucesso!', 'check');
                
                if (window.MathJax) {
                    MathJax.typesetPromise([diagnosisOutputBox]).catch(err => console.log('MathJax error: ', err));
                }
            }
        }

        setTimeout(streamNextNode, 300);
    });`;

let braces = 0;
let parens = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < targetStr.length; i++) {
    const char = targetStr[i];
    const nextChar = targetStr[i + 1] || '';
    if (inString) {
        if (char === '\\\\') {
            i++;
        } else if (char === stringChar) {
            inString = false;
        }
    } else {
        if (char === "'" || char === '"' || char === '\`') {
            inString = true;
            stringChar = char;
        } else {
            if (char === '{') braces++;
            if (char === '}') braces--;
            if (char === '(') parens++;
            if (char === ')') parens--;
        }
    }
}

console.log(`Braces count: \${braces}, Parens count: \${parens}`);
