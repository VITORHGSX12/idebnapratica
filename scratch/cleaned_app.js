document.addEventListener(, () => {
    
    function debounce(func, delay = 300) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    
    function safeCreateIcons() {
        if (window.lucide) {
            try {
                lucide.createIcons({
                    attrs: {
                        : 1.75
                    }
                });
            } catch (e) {
                console.warn(, e);
            }
        }
    }
    safeCreateIcons();

    
    mermaid.initialize({
        startOnLoad: false,
        theme: ,
        securityLevel: ,
        themeVariables: {
            background: ,
            primaryColor: ,
            primaryTextColor: ,
            lineColor: ,
            secondaryColor: ,
            tertiaryColor: 
        }
    });

    
    
    
    const menuItems = document.querySelectorAll();
    const tabContents = document.querySelectorAll();
    const pageTitle = document.getElementById();
    const pageSubtitle = document.getElementById();

    const tabMeta = {
        dashboard: {
            title: ,
            subtitle: 
        },
        : {
            title: ,
            subtitle: 
        },
        : {
            title: ,
            subtitle: 
        },
        : {
            title: ,
            subtitle: 
        },
        : {
            title: ,
            subtitle: 
        },
        : {
            title: ,
            subtitle: 
        },
        : {
            title: ,
            subtitle: 
        },
        : {
            title: ,
            subtitle: 
        },
        : {
            title: ,
            subtitle: 
        },

        questions: {
            title: ,
            subtitle: 
        },
        : {
            title: ,
            subtitle: 
        },
        : {
            title: ,
            subtitle: 
        }
    };

    menuItems.forEach(item => {
        item.addEventListener(, (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute();

            
            menuItems.forEach(i => i.classList.remove());
            item.classList.add();

            
            tabContents.forEach(tab => tab.classList.remove());
            const activeTab = document.getElementById(targetTab);
            if (activeTab) {
                activeTab.classList.add();
            }

            
            if (tabMeta[targetTab]) {
                pageTitle.textContent = tabMeta[targetTab].title;
                pageSubtitle.textContent = tabMeta[targetTab].subtitle;
            }

            
            if (targetTab === ) {
                renderMermaidDiagram();
            } else if (targetTab === ) {
                renderRiskGoalsTable();
            } else if (targetTab === ) {
                updateIdebComparativoView();
            } else if (targetTab === ) {
                populateAiSelectors();
            }
            
            safeCreateIcons();
        });
    });

    
    
    
    const themeToggleBtn = document.getElementById();
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = document.body.classList.contains() ?  : ;
        safeCreateIcons();
        
        themeToggleBtn.addEventListener(, () => {
            document.body.classList.toggle();
            const isDark = document.body.classList.contains();
            
            themeToggleBtn.innerHTML = isDark ?  : ;
            safeCreateIcons();
            
            showToast();

            const activeTab = document.querySelector() ? document.querySelector().getAttribute() : ;
            if (activeTab === ) {
                renderMermaidDiagram(isDark ?  : );
            }
        });
    }

    
    
    
    const toast = document.getElementById();
    const toastMessage = document.getElementById();
    const toastIcon = document.getElementById();

    function showToast(message, iconName = ) {
        toastMessage.textContent = message;
        toastIcon.setAttribute(, iconName);
        safeCreateIcons();
        
        toast.classList.remove();
        setTimeout(() => {
            toast.classList.add();
        }, 3000);
    }

    
    
    
    const moduleBtns = document.querySelectorAll();
    const modulePanels = document.querySelectorAll();

    moduleBtns.forEach(btn => {
        btn.addEventListener(, () => {
            const moduleNum = btn.getAttribute();
            
            moduleBtns.forEach(b => b.classList.remove());
            btn.classList.add();

            modulePanels.forEach(p => p.classList.remove());
            document.getElementById().classList.add();
            
            safeCreateIcons();
        });
    });

    
    
    
    const dbTabBtns = document.querySelectorAll();
    const dbPanels = document.querySelectorAll();

    dbTabBtns.forEach(btn => {
        btn.addEventListener(, () => {
            const targetPanel = btn.getAttribute();

            dbTabBtns.forEach(b => b.classList.remove());
            btn.classList.add();

            dbPanels.forEach(p => p.classList.remove());
            document.getElementById().classList.add();

            if (targetPanel === ) {
                renderMermaidDiagram();
            }
        });
    });

    const ddlSQLCode = ;

    document.getElementById().textContent = ddlSQLCode.trim();

    const copySqlBtn = document.getElementById();
    copySqlBtn.addEventListener(, () => {
        navigator.clipboard.writeText(ddlSQLCode.trim()).then(() => {
            showToast(, );
        });
    });

    const mermaidSyntax = ;

    let erdRendered = false;
    const mermaidContainer = document.getElementById();
    const renderErdBtn = document.getElementById();

    function renderMermaidDiagram(theme = ) {
        if (erdRendered && theme === ) return; 

        mermaidContainer.removeAttribute();
        mermaidContainer.textContent = mermaidSyntax;
        
        try {
            mermaid.init(undefined, mermaidContainer);
            erdRendered = true;
        } catch (err) {
            console.error(, err);
        }
    }

    renderErdBtn.addEventListener(, () => {
        erdRendered = false;
        renderMermaidDiagram(document.body.classList.contains() ?  : );
        showToast(, );
    });

    
    
    
    const apiNavBtns = document.querySelectorAll();
    const endpointBlocks = document.querySelectorAll();

    const apiPayloads = {
        agendamento: {
            request: {
                avaliacao_id: ,
                escola_id: ,
                turma_id: ,
                data_inicio: ,
                data_fim: 
            },
            response: {
                evento_id: ,
                avaliacao_id: ,
                status: ,
                token_aplicacao: ,
                criado_em: 
            }
        },
        : {
            response: [
                {
                    questao_id: ,
                    bncc_code: ,
                    enunciado: ,
                    dificuldade: ,
                    nivel_cognitivo: ,
                    opcoes: [
                        { id: , letra: , texto: , correta: true },
                        { id: , letra: , texto: , correta: false },
                        { id: , letra: , texto: , correta: false },
                        { id: , letra: , texto: , correta: false }
                    ]
                }
            ]
        },
        : {
            request: {
                aluno_id: ,
                evento_id: ,
                dados_desempenho: {
                    habilidades: [
                        { codigo: , total_questoes: 5, acertos: 2, percentual: 40.0 },
                        { codigo: , total_questoes: 4, acertos: 3, percentual: 75.0 },
                        { codigo: , total_questoes: 4, acertos: 4, percentual: 100.0 }
                    ]
                }
            },
            response: {
                diagnostico_id: ,
                aluno_id: ,
                data_geracao: ,
                diagnostico_markdown: 
            }
        }
    };

    document.getElementById().textContent = JSON.stringify(apiPayloads.agendamento.request, null, 4);
    document.getElementById().textContent = JSON.stringify(apiPayloads.agendamento.response, null, 4);
    document.getElementById().textContent = JSON.stringify(apiPayloads[].response, null, 4);
    document.getElementById().textContent = JSON.stringify(apiPayloads[].request, null, 4);
    document.getElementById().textContent = JSON.stringify(apiPayloads[].response, null, 4);

    apiNavBtns.forEach(btn => {
        btn.addEventListener(, () => {
            const endpoint = btn.getAttribute();

            apiNavBtns.forEach(b => b.classList.remove());
            btn.classList.add();

            endpointBlocks.forEach(block => block.classList.remove());
            document.getElementById().classList.add();
        });
    });

    
    
    
    const aiSchoolSelect = document.getElementById();
    const aiGradeSelect = document.getElementById();
    const aiSubjectSelect = document.getElementById();
    const btnGenerateSchoolReport = document.getElementById();
    const aiSchoolReportContainer = document.getElementById();
    const aiReportGenerationStatus = document.getElementById();

    function populateAiSelectors() {
        if (!aiSchoolSelect || !aiGradeSelect) return;

        
        const uniqueSchools = Array.from(new Set(loadedStudents.map(s => s.escola))).sort();
        aiSchoolSelect.innerHTML = ;
        uniqueSchools.forEach(sch => {
            const opt = document.createElement();
            opt.value = sch;
            opt.textContent = sch;
            aiSchoolSelect.appendChild(opt);
        });

        
        aiSchoolSelect.removeEventListener(, updateAiGradeSelector);
        aiSchoolSelect.addEventListener(, updateAiGradeSelector);
        updateAiGradeSelector();
    }

    function updateAiGradeSelector() {
        if (!aiSchoolSelect || !aiGradeSelect) return;
        const selectedSchool = aiSchoolSelect.value;

        aiGradeSelect.innerHTML = ;

        const studentsSource = selectedSchool ===  ? loadedStudents : loadedStudents.filter(s => s.escola === selectedSchool);
        
        const uniqueEtapas = [...new Set(studentsSource.map(s => {
            const match = s.etapa.match(/\d+º\s+Ano/i);
            return match ? match[0] : s.etapa;
        }))].sort();

        uniqueEtapas.forEach(et => {
            const opt = document.createElement();
            opt.value = et;
            opt.textContent = et;
            aiGradeSelect.appendChild(opt);
        });
    }

    let loadedStudents = [];
    let activeStudent = null;
    let activePromptTab = ;

    
    let dbEscolas = [];
    let dbTurmas = [];
    let dbAlunos = [];
    let dbAvaliacoes = [];
    let dbQuestoes = [];
    let dbResultadosAluno = [];

    function saveDatabaseState() {
        localStorage.setItem(, JSON.stringify(dbEscolas));
        localStorage.setItem(, JSON.stringify(dbTurmas));
        localStorage.setItem(, JSON.stringify(dbAlunos));
        localStorage.setItem(, JSON.stringify(dbAvaliacoes));
        localStorage.setItem(, JSON.stringify(dbQuestoes));
        localStorage.setItem(, JSON.stringify(dbResultadosAluno));
        localStorage.setItem(, JSON.stringify(rawQuestions));
        localStorage.setItem(, JSON.stringify(activeEvaluations));
    }

    function loadDatabaseState() {
        const storedEscolas = localStorage.getItem();
        const storedQuestions = localStorage.getItem();
        
        if (storedEscolas) {
            dbEscolas = JSON.parse(storedEscolas);
            dbTurmas = JSON.parse(localStorage.getItem() || );
            dbAlunos = JSON.parse(localStorage.getItem() || );
            dbAvaliacoes = JSON.parse(localStorage.getItem() || );
            dbQuestoes = JSON.parse(localStorage.getItem() || );
            dbResultadosAluno = JSON.parse(localStorage.getItem() || );
            activeEvaluations = JSON.parse(localStorage.getItem() || );
            loadedStudents = dbAlunos;
        } else {
            if (loadedStudents && loadedStudents.length > 0) {
                syncNormalizedTablesFromLoadedData();
            } else {
                dbEscolas = [];
                dbTurmas = [];
                dbAlunos = [];
                dbAvaliacoes = [];
                dbQuestoes = [];
                dbResultadosAluno = [];
                activeEvaluations = [];
            }
            saveDatabaseState();
        }

        if (storedQuestions) {
            rawQuestions = JSON.parse(storedQuestions);
        } else {
            saveDatabaseState();
        }

        recalculateNetworkStats();
        
        
        const metricStud = document.getElementById();
        if (metricStud) {
            metricStud.textContent = ;
        }
        const badgeCount = document.getElementById();
        if (badgeCount) {
            badgeCount.textContent = loadedStudents.length.toLocaleString();
        }
        const schools = Array.from(new Set(loadedStudents.map(s => s.escola))).sort();
        
        const tenantSelector = document.getElementById();
        if (tenantSelector) {
            tenantSelector.innerHTML = ;
            schools.forEach(sch => {
                const opt = document.createElement();
                opt.value = sch;
                opt.textContent = sch.replace(/\s+/g, );
                tenantSelector.appendChild(opt);
            });
        }
        
        initStudentSearch();
        
        if (window.populateSchoolPanelSelector) {
            window.populateSchoolPanelSelector(schools);
        }

        populateAiSelectors();
    }

    function syncNormalizedTablesFromLoadedData() {
        dbEscolas = [];
        dbTurmas = [];
        dbAlunos = [];
        dbAvaliacoes = [];
        dbQuestoes = [];
        dbResultadosAluno = [];

        
        const uniqueSchools = Array.from(new Set(loadedStudents.map(s => s.escola))).sort();
        uniqueSchools.forEach((schoolName, idx) => {
            let hash = 0;
            for (let i = 0; i < schoolName.length; i++) {
                hash += schoolName.charCodeAt(i);
            }
            const inepCode = 21000000 + (hash % 899999);
            dbEscolas.push({
                id: ,
                nome: schoolName,
                rede_id: ,
                codigo_inep: inepCode
            });
        });

        
        const uniqueClasses = [];
        loadedStudents.forEach(s => {
            const exists = uniqueClasses.some(c => c.schoolName === s.escola && c.gradeName === s.etapa);
            if (!exists) {
                uniqueClasses.push({ schoolName: s.escola, gradeName: s.etapa });
            }
        });

        uniqueClasses.forEach((cls, idx) => {
            const schoolObj = dbEscolas.find(e => e.nome === cls.schoolName);
            dbTurmas.push({
                id: ,
                escola_id: schoolObj ? schoolObj.id : null,
                nome: cls.gradeName,
                turno: ,
                ano_letivo: 2026
            });
        });

        
        loadedStudents.forEach((s, idx) => {
            const schoolObj = dbEscolas.find(e => e.nome === s.escola);
            const classObj = dbTurmas.find(t => t.escola_id === (schoolObj ? schoolObj.id : null) && t.nome === s.etapa);
            dbAlunos.push({
                id: ,
                turma_id: classObj ? classObj.id : null,
                nome: s.nome,
                matricula: s.matricula,
                nee: s.nee || ,
                avg_score: s.avg_score
            });
        });

        
        activeEvaluations.forEach(ev => {
            dbAvaliacoes.push({
                id: ev.id,
                nome: ev.titulo,
                componente: ev.tipo.includes() || ev.titulo.includes() ?  : ,
                data_aplicacao: ev.janela || ,
                matriz_referencia: ev.etapa || 
            });
        });

        
        const sourceQuestions = (rawQuestions && rawQuestions.length > 0) ? rawQuestions : (window.DEMO_QUESTIONS || []);
        sourceQuestions.forEach(q => {
            dbQuestoes.push({
                id: q.id,
                avaliacao_id: q.matriz ===  ?  : ,
                descritor_bncc_id: q.codigo_bncc,
                nivel_dificuldade: q.dificuldade
            });
        });

        
        dbAlunos.forEach(al => {
            const matNum = parseInt(al.matricula) || 0;
            dbAvaliacoes.forEach(av => {
                const isLP = av.componente === ;
                const testQuestions = dbQuestoes.filter(q => {
                    const isQ_LP = q.descritor_bncc_id.includes() || q.descritor_bncc_id.startsWith();
                    return isLP ? isQ_LP : !isQ_LP;
                }).slice(0, 5);

                testQuestions.forEach((q, idx) => {
                    const threshold = al.avg_score || 65;
                    const randomVal = (matNum + idx * 17) % 100;
                    const acertou = randomVal < threshold;
                    dbResultadosAluno.push({
                        id: ,
                        aluno_id: al.matricula,
                        avaliacao_id: av.id,
                        questao_id: q.id,
                        acertou: acertou
                    });
                });
            });
        });
    }

    const systemPromptText = ;

    
    function loadDatabase() {
        if (window.alunosDatabase && window.alunosDatabase.length > 0) {
            console.log();
            initDatabase(window.alunosDatabase);
        } else {
            console.log();
            fetch()
                .then(res => res.json())
                .then(data => {
                    initDatabase(data);
                })
                .catch(err => {
                    console.error(, err);
                    showToast(, );
                });
        }
    }

    function populateIdebGoalsTable(schools) {
        const tableBody = document.getElementById();
        if (!tableBody) return;
        tableBody.innerHTML = ;

        schools.forEach((schName, idx) => {
            let hash = 0;
            for (let i = 0; i < schName.length; i++) {
                hash += schName.charCodeAt(i);
            }
            const baseIdeb = 4.2 + (hash % 15) / 10;
            const projectedIdeb = baseIdeb + 0.2 + (hash % 4) / 10;
            const targetIdeb = baseIdeb + 0.4;
            const gap = projectedIdeb - targetIdeb;
            const gapText = gap >= 0 ?  : ;
            const gapColor = gap >= 0 ?  : ;
            const statusBadge = gap >= 0 ?  : ;

            const tr = document.createElement();
            tr.style.borderBottom = ;
            tr.style.height = ;
            tr.innerHTML = ;
            tableBody.appendChild(tr);
        });
    }

    function updateProficiencyBars(insuf, bas, adeq, adv) {
        const bInsuf = document.getElementById();
        const barInsuf = document.getElementById();
        const bBas = document.getElementById();
        const barBas = document.getElementById();
        const bAdeq = document.getElementById();
        const barAdeq = document.getElementById();
        const bAdv = document.getElementById();
        const barAdv = document.getElementById();

        if (bInsuf) bInsuf.textContent = ;
        if (barInsuf) barInsuf.style.width = ;
        if (bBas) bBas.textContent = ;
        if (barBas) barBas.style.width = ;
        if (bAdeq) bAdeq.textContent = ;
        if (barAdeq) barAdeq.style.width = ;
        if (bAdv) bAdv.textContent = ;
        if (barAdv) barAdv.style.width = ;
    }

    function getBNCCCriticalSkills() {
        const skillCounts = {};
        dbResultadosAluno.forEach(r => {
            const q = dbQuestoes.find(qu => qu.id === r.questao_id);
            if (q) {
                const desc = q.descritor_bncc_id;
                if (!skillCounts[desc]) {
                    skillCounts[desc] = { total: 0, correct: 0 };
                }
                skillCounts[desc].total++;
                if (r.acertou) {
                    skillCounts[desc].correct++;
                }
            }
        });

        const list = [];
        for (const desc in skillCounts) {
            const pct = Math.round((skillCounts[desc].correct / skillCounts[desc].total) * 100);
            let descName = ;
            const foundDesc = activeDescriptors.find(d => d.codigo === desc);
            if (foundDesc) {
                descName = foundDesc.descricao;
            }
            list.push({
                codigo: desc,
                desc: descName,
                percentage: pct
            });
        }

        list.sort((a, b) => a.percentage - b.percentage);
        return list.slice(0, 5);
    }

    function updateExtraDashboardAndMetasStats(isEmpty, mappedIdeb, avgGeneral) {
        const metasIdeb = document.getElementById();
        const metasRend = document.getElementById();
        const metasProf = document.getElementById();
        const critList = document.getElementById();
        const aiDiag = document.getElementById();
        const aiTok = document.getElementById();
        const aiPrec = document.getElementById();

        
        if (aiDiag) aiDiag.textContent = ;
        if (aiTok) aiTok.textContent = ;
        if (aiPrec) aiPrec.textContent = ;

        if (isEmpty) {
            if (metasIdeb) metasIdeb.textContent = ;
            if (metasRend) metasRend.textContent = ;
            if (metasProf) metasProf.textContent = ;
            if (critList) {
                critList.innerHTML = ;
            }
        } else {
            if (metasIdeb) metasIdeb.textContent = mappedIdeb || ;
            if (metasRend) metasRend.textContent = ;
            if (metasProf) metasProf.textContent = avgGeneral ? (avgGeneral * 0.08).toFixed(2) : ;
            if (critList) {
                const criticals = getBNCCCriticalSkills();
                if (criticals.length === 0) {
                    critList.innerHTML = ;
                } else {
                    critList.innerHTML = ;
                    criticals.forEach(c => {
                        let barColor = ;
                        let badgeClass = ;
                        if (c.percentage < 55) {
                            barColor = ;
                            badgeClass = ;
                        } else if (c.percentage < 70) {
                            barColor = ;
                            badgeClass = ;
                        }

                        const item = document.createElement();
                        item.className = ;
                        item.innerHTML = ;
                        critList.appendChild(item);
                    });
                }
            }
        }
    }

    function recalculateNetworkStats() {
        const elIdeb = document.getElementById();
        const elLP = document.getElementById();
        const elSchoolsOnMeta = document.getElementById();
        const elSchoolsOnMetaSub = document.getElementById();
        const elPart = document.getElementById();

        const elIdebTrend = document.getElementById();
        const elIdebSub = document.getElementById();
        const elLPSub = document.getElementById();
        const elStudentsEval = document.getElementById();

        const tenantSelectorEl = document.getElementById();
        const selectedSchool = tenantSelectorEl ? tenantSelectorEl.value : ;

        if (!dbAlunos || dbAlunos.length === 0) {
            if (elIdeb) elIdeb.textContent = ;
            if (elIdebTrend) elIdebTrend.innerHTML = ;
            if (elIdebSub) elIdebSub.textContent = ;
            if (elLP) elLP.textContent = ;
            if (elLPSub) elLPSub.textContent = ;
            if (elSchoolsOnMeta) elSchoolsOnMeta.textContent = ;
            if (elSchoolsOnMetaSub) elSchoolsOnMetaSub.textContent = ;
            if (elPart) elPart.textContent = ;
            if (elStudentsEval) elStudentsEval.textContent = ;
            updateProficiencyBars(0, 0, 0, 0);
            updateDashboardCriticalSkills(selectedSchool);
            updateSchoolsInAttentionCard(selectedSchool);
            renderDashboardIdebChart(selectedSchool);
            safeCreateIcons();
            return;
        }

        let filteredAlunos = dbAlunos;
        let filteredResultados = dbResultadosAluno;

        if (selectedSchool !== ) {
            filteredAlunos = dbAlunos.filter(a => a.escola === selectedSchool);
            const studentMatriculas = new Set(filteredAlunos.map(a => a.matricula));
            filteredResultados = dbResultadosAluno.filter(r => studentMatriculas.has(r.aluno_id));
        }

        if (filteredResultados.length === 0) {
            if (elIdeb) elIdeb.textContent = ;
            if (elIdebTrend) elIdebTrend.innerHTML = ;
            if (elIdebSub) elIdebSub.textContent = ;
            if (elLP) elLP.textContent = ;
            if (elLPSub) elLPSub.textContent = ;
            if (elSchoolsOnMeta) elSchoolsOnMeta.textContent = ;
            if (elSchoolsOnMetaSub) elSchoolsOnMetaSub.textContent = ;
            if (elPart) elPart.textContent = ;
            if (elStudentsEval) elStudentsEval.textContent = ;
            updateProficiencyBars(0, 0, 0, 0);
            updateDashboardCriticalSkills(selectedSchool);
            updateSchoolsInAttentionCard(selectedSchool);
            renderDashboardIdebChart(selectedSchool);
            safeCreateIcons();
            return;
        }

        const lpResults = filteredResultados.filter(r => {
            const q = dbQuestoes.find(qu => qu.id === r.questao_id);
            return q && (q.descritor_bncc_id.includes() || q.descritor_bncc_id.startsWith());
        });
        const lpCorrect = lpResults.filter(r => r.acertou).length;
        const lpAvg = lpResults.length > 0 ? (lpCorrect / lpResults.length * 100) : 60;

        const mtResults = filteredResultados.filter(r => {
            const q = dbQuestoes.find(qu => qu.id === r.questao_id);
            return q && !(q.descritor_bncc_id.includes() || q.descritor_bncc_id.startsWith());
        });
        const mtCorrect = mtResults.filter(r => r.acertou).length;
        const mtAvg = mtResults.length > 0 ? (mtCorrect / mtResults.length * 100) : 60;

        const totalCorrect = filteredResultados.filter(r => r.acertou).length;
        const totalCount = filteredResultados.length;
        const avgGeneral = totalCount > 0 ? (totalCorrect / totalCount * 100) : 60;

        const mappedLP = Math.round(180 + lpAvg * 1.1);
        const mappedMT = Math.round(190 + mtAvg * 1.15);
        const mappedIdeb = (avgGeneral * 0.065 + 1.2).toFixed(1);

        if (elIdeb) elIdeb.textContent = mappedIdeb;
        if (elIdebTrend) elIdebTrend.innerHTML = ;
        if (elIdebSub) elIdebSub.textContent = ;

        const averageSeama = Math.round((mappedLP + mappedMT) / 2);
        if (elLP) elLP.textContent = averageSeama;
        let seamaProf = ;
        if (averageSeama < 200) seamaProf = ;
        else if (averageSeama < 250) seamaProf = ;
        else if (averageSeama < 300) seamaProf = ;
        else seamaProf = ;
        if (elLPSub) elLPSub.textContent = ;

        
        let schoolsToEvaluate = dbEscolas;
        if (selectedSchool !== ) {
            schoolsToEvaluate = dbEscolas.filter(e => e.nome === selectedSchool);
        }
        let schoolsOnMetaCount = 0;
        schoolsToEvaluate.forEach(esc => {
            const escStudents = dbAlunos.filter(a => a.escola === esc.nome);
            const studentMatriculas = new Set(escStudents.map(a => a.matricula));
            const escResults = dbResultadosAluno.filter(r => studentMatriculas.has(r.aluno_id));
            const escCorrect = escResults.filter(r => r.acertou).length;
            const escAvg = escResults.length > 0 ? (escCorrect / escResults.length * 100) : 60;
            const escIdeb = escAvg * 0.065 + 1.2;

            let hash = 0;
            for (let i = 0; i < esc.nome.length; i++) {
                hash += esc.nome.charCodeAt(i);
            }
            const escMeta = 5.2 + (hash % 10) / 10;
            if (escIdeb >= escMeta) {
                schoolsOnMetaCount++;
            }
        });
        if (elSchoolsOnMeta) elSchoolsOnMeta.textContent = ;
        if (elSchoolsOnMetaSub) elSchoolsOnMetaSub.textContent = ;

        
        const studentsWithAnswers = filteredAlunos.filter(al => filteredResultados.some(r => r.aluno_id === al.matricula)).length;
        const pctParticipation = filteredAlunos.length > 0 ? ((studentsWithAnswers / filteredAlunos.length) * 100).toFixed(1) : ;

        if (elPart) elPart.textContent = ;
        if (elStudentsEval) elStudentsEval.textContent = ;

        let countInsuficiente = 0;
        let countBasico = 0;
        let countAdequado = 0;
        let countAvancado = 0;

        filteredAlunos.forEach(al => {
            const score = al.avg_score || 0;
            if (score < 60) countInsuficiente++;
            else if (score < 70) countBasico++;
            else if (score < 80) countAdequado++;
            else countAvancado++;
        });

        const countScores = filteredAlunos.length;
        const pctInsuficiente = ((countInsuficiente / countScores) * 100).toFixed(1);
        const pctBasico = ((countBasico / countScores) * 100).toFixed(1);
        const pctAdequado = ((countAdequado / countScores) * 100).toFixed(1);
        const pctAvancado = ((countAvancado / countScores) * 100).toFixed(1);

        updateProficiencyBars(pctInsuficiente, pctBasico, pctAdequado, pctAvancado);
        updateDashboardCriticalSkills(selectedSchool);
        updateSchoolsInAttentionCard(selectedSchool);
        renderDashboardIdebChart(selectedSchool);
        safeCreateIcons();
    }

    function updateDashboardCriticalSkills(selectedSchool) {
        const container = document.getElementById();
        if (!container) return;

        let filteredResultados = dbResultadosAluno;
        if (selectedSchool !== ) {
            const schoolAlunos = dbAlunos.filter(a => a.escola === selectedSchool);
            const schoolMatriculas = new Set(schoolAlunos.map(a => a.matricula));
            filteredResultados = dbResultadosAluno.filter(r => schoolMatriculas.has(r.aluno_id));
        }

        if (filteredResultados.length === 0) {
            container.innerHTML = ;
            const btnGoEval = document.getElementById();
            if (btnGoEval) {
                btnGoEval.addEventListener(, () => {
                    const evalTabBtn = document.querySelector();
                    if (evalTabBtn) evalTabBtn.click();
                });
            }
            if (window.lucide) lucide.createIcons();
            return;
        }

        const skillsStats = {};
        filteredResultados.forEach(res => {
            const q = dbQuestoes.find(qu => qu.id === res.questao_id);
            if (!q) return;

            const code = q.descritor_bncc_id || q.codigo_bncc;
            const desc = q.enunciado ? q.enunciado.substring(0, 85) +  : ;

            if (!skillsStats[code]) {
                skillsStats[code] = { code, desc, correct: 0, total: 0 };
            }
            if (res.acertou) skillsStats[code].correct++;
            skillsStats[code].total++;
        });

        const list = Object.values(skillsStats).map(s => {
            return {
                code: s.code,
                desc: s.desc,
                pct: Math.round((s.correct / s.total) * 100)
            };
        });

        list.sort((a, b) => a.pct - b.pct);
        const top5 = list.slice(0, 5);

        let html = ;
        top5.forEach(item => {
            let colorClass = ;
            let badgeClass = ;
            if (item.pct >= 70) {
                colorClass = ;
                badgeClass = ;
            } else if (item.pct >= 55) {
                colorClass = ;
                badgeClass = ;
            }

            html += ;
        });
        html += ;
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    }

    function updateSchoolsInAttentionCard(selectedSchool) {
        const container = document.getElementById();
        if (!container) return;

        let schoolsToRender = dbEscolas;
        if (selectedSchool !== ) {
            schoolsToRender = dbEscolas.filter(e => e.nome === selectedSchool);
        }

        if (schoolsToRender.length === 0) {
            container.innerHTML = ;
            return;
        }

        const schoolData = [];
        schoolsToRender.forEach(esc => {
            const escStudents = dbAlunos.filter(a => a.escola === esc.nome);
            const studentMatriculas = new Set(escStudents.map(a => a.matricula));
            const escResults = dbResultadosAluno.filter(r => studentMatriculas.has(r.aluno_id));

            const totalCorrect = escResults.filter(r => r.acertou).length;
            const totalCount = escResults.length;
            const avgGeneral = totalCount > 0 ? (totalCorrect / totalCount * 100) : 60;
            const actualIdeb = Number((avgGeneral * 0.065 + 1.2).toFixed(1));
            
            let hash = 0;
            for (let i = 0; i < esc.nome.length; i++) {
                hash += esc.nome.charCodeAt(i);
            }
            const targetMeta = Number((5.2 + (hash % 10) / 10).toFixed(1));
            const gap = Number((targetMeta - actualIdeb).toFixed(1));

            schoolData.push({
                name: esc.nome,
                actualIdeb,
                targetMeta,
                gap
            });
        });

        schoolData.sort((a, b) => b.gap - a.gap);

        let html = ;
        schoolData.forEach(item => {
            const gapText = item.gap > 0 ?  : ;
            const badgeClass = item.gap > 0 ?  : ;

            html += ;
        });
        html += ;
        container.innerHTML = html;

        const rows = container.querySelectorAll();
        rows.forEach(r => {
            r.addEventListener(, () => {
                const sName = r.getAttribute();
                const relTabBtn = document.querySelector();
                if (relTabBtn) {
                    relTabBtn.click();
                }
                const selectEl = document.getElementById();
                if (selectEl) {
                    selectEl.value = sName;
                    selectEl.dispatchEvent(new Event());
                }
            });
        });
    }

    function renderDashboardIdebChart(schoolName) {
        const container = document.getElementById();
        if (!container) return;

        const baseline = {};
        const metaBaseline = {};

        if (window.idebPublicoReferencia) {
            const munRecords = window.idebPublicoReferencia.filter(r => r.municipio.toLowerCase() ===  && r.uf === );
            munRecords.forEach(r => {
                if (r.etapa === ) {
                    baseline[r.ano] = r.ideb_observado;
                    metaBaseline[r.ano] = r.meta_projetada;
                }
            });
        } else {
            container.innerHTML = ;
            return;
        }

        const years = [2019, 2021, 2023, 2025];
        const observed = [];
        const target = [];

        let shift = 0;
        if (schoolName !== ) {
            let hash = 0;
            for (let i = 0; i < schoolName.length; i++) {
                hash += schoolName.charCodeAt(i);
            }
            shift = ((hash % 10) - 5) / 10;
        }

        years.forEach(yr => {
            if (yr === 2025) {
                observed.push(null);
                const baseMeta = metaBaseline[2025] || 5.2;
                target.push(Number((baseMeta + shift).toFixed(1)));
            } else {
                const baseObs = baseline[yr];
                const baseMeta = metaBaseline[yr];
                observed.push(baseObs ? Number((baseObs + shift).toFixed(1)) : null);
                target.push(baseMeta ? Number((baseMeta + shift).toFixed(1)) : null);
            }
        });

        const width = 450;
        const height = 180;
        const paddingLeft = 30;
        const paddingRight = 15;
        const paddingTop = 15;
        const paddingBottom = 25;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        const allVals = [...observed.filter(x => x !== null), ...target.filter(x => x !== null)];
        const maxVal = allVals.length > 0 ? Math.max(...allVals) + 0.5 : 7.0;
        const minVal = allVals.length > 0 ? Math.max(0, Math.min(...allVals) - 0.5) : 3.0;

        function getX(index) {
            return paddingLeft + (index / (years.length - 1)) * chartWidth;
        }

        function getY(val) {
            return paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
        }

        let svgHtml = ;

        const gridSteps = 4;
        for (let j = 0; j <= gridSteps; j++) {
            const val = minVal + (j / gridSteps) * (maxVal - minVal);
            const y = getY(val);
            svgHtml += ;
            svgHtml += ;
        }

        years.forEach((yr, idx) => {
            const x = getX(idx);
            svgHtml += ;
        });

        let obsPointsPath = ;
        let tgtPointsPath = ;

        years.forEach((yr, idx) => {
            const x = getX(idx);
            
            const obsVal = observed[idx];
            if (obsVal !== null) {
                const yObs = getY(obsVal);
                if (obsPointsPath === ) obsPointsPath = ;
                else obsPointsPath += ;
            }

            const tgtVal = target[idx];
            if (tgtVal !== null) {
                const yTgt = getY(tgtVal);
                if (tgtPointsPath === ) tgtPointsPath = ;
                else tgtPointsPath += ;
            }
        });

        if (tgtPointsPath !== ) {
            svgHtml += ;
        }

        if (obsPointsPath !== ) {
            svgHtml += ;
        }

        years.forEach((yr, idx) => {
            const x = getX(idx);

            const tgtVal = target[idx];
            if (tgtVal !== null) {
                const yTgt = getY(tgtVal);
                svgHtml += ;
                svgHtml += ;
            }

            const obsVal = observed[idx];
            if (obsVal !== null) {
                const yObs = getY(obsVal);
                svgHtml += ;
                svgHtml += ;
            } else {
                svgHtml += ;
                svgHtml += ;
            }
        });

        svgHtml += ;
        container.innerHTML = svgHtml;
    }

    function initDatabase(data) {
        loadedStudents = data;

        
        loadedStudents.forEach(s => {
            if (s.avg_score === undefined) {
                const matNum = parseInt(s.matricula) || 0;
                s.avg_score = 55 + (matNum % 34);
            }
        });

        syncNormalizedTablesFromLoadedData();

        recalculateNetworkStats();
        
        
        const metricStud = document.getElementById();
        if (metricStud) {
            metricStud.textContent = ;
        }
        const badgeCount = document.getElementById();
        if (badgeCount) {
            badgeCount.textContent = data.length.toLocaleString();
        }
        const schools = Array.from(new Set(data.map(s => s.escola))).sort();
        
        
        const tenantSelector = document.getElementById();
        if (tenantSelector) {
            tenantSelector.innerHTML = ;
            schools.forEach(sch => {
                const opt = document.createElement();
                opt.value = sch;
                opt.textContent = sch.replace(/\s+/g, );
                tenantSelector.appendChild(opt);
            });
        }
        
        
        initStudentSearch();
        
        
        if (window.populateSchoolPanelSelector) {
            window.populateSchoolPanelSelector(schools);
        }
        
        
        if (window.initAlunosTab) {
            window.initAlunosTab(schools);
        }

        
        populateIdebGoalsTable(schools);

        const sidebarNetworkLabel = document.getElementById();
        if (tenantSelector && sidebarNetworkLabel) {
            sidebarNetworkLabel.textContent = tenantSelector.options[tenantSelector.selectedIndex].text;
        }
        
        if (data.length > 0) {
            showToast(, );
        }

        populateAiSelectors();
    }

    function initStudentSearch() {
        
    }

    if (btnGenerateSchoolReport) {
        btnGenerateSchoolReport.addEventListener(, () => {
            const school = aiSchoolSelect.value;
            const grade = aiGradeSelect.value;
            const subject = aiSubjectSelect.value;

            aiReportGenerationStatus.classList.remove();
            btnGenerateSchoolReport.disabled = true;
            aiSchoolReportContainer.innerHTML = ;

            let students = loadedStudents;
            if (school !== ) {
                students = students.filter(s => s.escola === school);
            }
            if (grade !== ) {
                students = students.filter(s => s.etapa.includes(grade));
            }

            if (students.length === 0) {
                setTimeout(() => {
                    aiSchoolReportContainer.innerHTML = ;
                    aiReportGenerationStatus.classList.add();
                    btnGenerateSchoolReport.disabled = false;
                    safeCreateIcons();
                }, 500);
                return;
            }

            
            const totals = {};
            students.forEach(s => {
                s.habilities.forEach(h => {
                    let matchesSub = true;
                    if (subject !== ) {
                        if (subject ===  && !h.codigo.startsWith()) matchesSub = false;
                        if (subject ===  && !h.codigo.startsWith()) matchesSub = false;
                        if (subject ===  && !h.codigo.startsWith()) matchesSub = false;
                    }
                    if (!matchesSub) return;

                    if (!totals[h.codigo]) {
                        totals[h.codigo] = { code: h.codigo, desc: h.desc, sum: 0, count: 0 };
                    }
                    totals[h.codigo].sum += h.score;
                    totals[h.codigo].count++;
                });
            });

            const consolidated = [];
            const attention = [];
            Object.values(totals).forEach(t => {
                const avg = Math.round(t.sum / t.count);
                const item = { code: t.code, desc: t.desc, avg };
                if (avg >= 70) {
                    consolidated.push(item);
                } else if (avg < 55) {
                    attention.push(item);
                }
            });

            
            const strugglingStudents = students.map(s => {
                const avg = Math.round(s.habilities.reduce((sum, h) => sum + h.score, 0) / s.habilities.length);
                return { name: s.nome, matricula: s.matricula, avg };
            }).filter(s => s.avg < 50).slice(0, 5);

            
            let md = ;
            md += ;
            md += ;

            md += ;
            if (consolidated.length === 0) {
                md += ;
            } else {
                consolidated.forEach(c => {
                    md += ;
                });
                md += ;
            }

            md += ;
            if (attention.length === 0) {
                md += ;
            } else {
                attention.forEach(a => {
                    md += ;
                });
                md += ;
            }

            md += ;
            if (strugglingStudents.length === 0) {
                md += ;
            } else {
                md += ;
                strugglingStudents.forEach(s => {
                    md += ;
                });
                md += ;
            }

            md += ;
            if (attention.length > 0) {
                md += ;
                md += ;
                md += ;
            } else {
                md += ;
                md += ;
            }

            const parsedHTML = window.marked ? marked.parse(md) : ;

            let index = 0;
            const tempDiv = document.createElement();
            tempDiv.innerHTML = parsedHTML;
            const childNodes = Array.from(tempDiv.childNodes);

            function streamNextNode() {
                if (index < childNodes.length) {
                    aiSchoolReportContainer.appendChild(childNodes[index].cloneNode(true));
                    index++;
                    aiSchoolReportContainer.scrollTop = aiSchoolReportContainer.scrollHeight;
                    setTimeout(streamNextNode, 80);
                } else {
                    aiReportGenerationStatus.classList.add();
                    btnGenerateSchoolReport.disabled = false;
                    showToast(, );
                }
            }

        });
    }

    
    
    
    const filterMatrix = document.getElementById();
    const filterSubject = document.getElementById();
    const filterBloom = document.getElementById();
    const filterDifficulty = document.getElementById();
    const questionsContainer = document.getElementById();
    const questionsCounter = document.getElementById();

    let rawQuestions = [
        
        {
            id: ,
            codigo_bncc: ,
            disciplina: ,
            matriz: ,
            descritor: ,
            enunciado: ,
            nivel_cognitivo: ,
            dificuldade: ,
            opcoes: [
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: true },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false }
            ],
            explicacao: 
        },
        {
            id: ,
            codigo_bncc: ,
            disciplina: ,
            matriz: ,
            descritor: ,
            enunciado: ,
            nivel_cognitivo: ,
            dificuldade: ,
            opcoes: [
                { letra: , texto: , correta: true },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false }
            ],
            explicacao: 
        },
        {
            id: ,
            codigo_bncc: ,
            disciplina: ,
            matriz: ,
            descritor: ,
            enunciado: ,
            nivel_cognitivo: ,
            dificuldade: ,
            opcoes: [
                { letra: , texto: , correta: true },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false }
            ],
            explicacao: 
        },
        {
            id: ,
            codigo_bncc: ,
            disciplina: ,
            matriz: ,
            descritor: ,
            enunciado: ,
            nivel_cognitivo: ,
            dificuldade: ,
            opcoes: [
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: true },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false }
            ],
            explicacao: 
        },

        
        {
            id: ,
            codigo_bncc: ,
            disciplina: ,
            matriz: ,
            descritor: ,
            enunciado: ,
            nivel_cognitivo: ,
            dificuldade: ,
            opcoes: [
                { letra: , texto: , correta: true },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false }
            ],
            explicacao: 
        },
        {
            id: ,
            codigo_bncc: ,
            disciplina: ,
            matriz: ,
            descritor: ,
            enunciado: ,
            nivel_cognitivo: ,
            dificuldade: ,
            opcoes: [
                { letra: , texto: , correta: true },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false }
            ],
            explicacao: 
        },
        {
            id: ,
            codigo_bncc: ,
            disciplina: ,
            matriz: ,
            descritor: ,
            enunciado: ,
            nivel_cognitivo: ,
            dificuldade: ,
            opcoes: [
                { letra: , texto: , correta: true },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false }
            ],
            explicacao: 
        },
        {
            id: ,
            codigo_bncc: ,
            disciplina: ,
            matriz: ,
            descritor: ,
            enunciado: ,
            nivel_cognitivo: ,
            dificuldade: ,
            opcoes: [
                { letra: , texto: , correta: true },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false }
            ],
            explicacao: 
        },

        
        {
            id: ,
            codigo_bncc: ,
            disciplina: ,
            matriz: ,
            descritor: ,
            enunciado: ,
            nivel_cognitivo: ,
            dificuldade: ,
            opcoes: [
                { letra: , texto: , correta: true },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false }
            ],
            explicacao: 
        },

        
        {
            id: ,
            codigo_bncc: ,
            disciplina: ,
            matriz: ,
            descritor: ,
            enunciado: ,
            nivel_cognitivo: ,
            dificuldade: ,
            opcoes: [
                { letra: , texto: , correta: true },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false }
            ],
            explicacao: 
        },
        {
            id: ,
            codigo_bncc: ,
            disciplina: ,
            matriz: ,
            descritor: ,
            enunciado: ,
            nivel_cognitivo: ,
            dificuldade: ,
            opcoes: [
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: true },
                { letra: , texto: , correta: false },
                { letra: , texto: , correta: false }
            ],
            explicacao: 
        }
    ];

    function renderQuestions() {
        if (!filterMatrix || !filterSubject || !filterBloom || !filterDifficulty) return;
        const selectedMatrix = filterMatrix.value;
        const selectedSubject = filterSubject.value;
        const selectedBloom = filterBloom.value;
        const selectedDifficulty = filterDifficulty.value;

        
        const filtered = rawQuestions.filter(q => {
            const matchMatrix = selectedMatrix ===  || q.matriz === selectedMatrix;
            const matchSubject = selectedSubject ===  || q.disciplina === selectedSubject;
            const matchBloom = selectedBloom ===  || q.nivel_cognitivo === selectedBloom;
            const matchDifficulty = selectedDifficulty ===  || q.dificuldade === selectedDifficulty;
            return matchMatrix && matchSubject && matchBloom && matchDifficulty;
        });

        questionsCounter.textContent = ;
        questionsContainer.innerHTML = ;

        if (filtered.length === 0) {
            questionsContainer.innerHTML = ;
            return;
        }

        filtered.forEach(q => {
            const card = document.createElement();
            card.className = ;
            
            let badgeDiffClass = ;
            if (q.dificuldade === ) badgeDiffClass = ;
            if (q.dificuldade === ) badgeDiffClass = ;

            card.innerHTML = 
                        <div class= data-correct=>
                            <span class=>${opt.letra})</span>
                            <span class=>${opt.texto}</span>
                        </div>
                    ;

            questionsContainer.appendChild(card);
        });

        
        const questionCards = questionsContainer.querySelectorAll();
        questionCards.forEach(card => {
            const options = card.querySelectorAll();
            const explanation = card.querySelector();

            options.forEach(opt => {
                opt.addEventListener(, () => {
                    options.forEach(o => {
                        if (o.getAttribute() === ) {
                            o.classList.add();
                        }
                        o.style.pointerEvents = ;
                    });
                    explanation.classList.remove();
                });
            });
        });

        
        const editBtns = questionsContainer.querySelectorAll();
        const deleteBtns = questionsContainer.querySelectorAll();

        editBtns.forEach(btn => {
            btn.addEventListener(, (e) => {
                e.stopPropagation();
                const qId = btn.getAttribute();
                const q = rawQuestions.find(qu => qu.id === qId);
                if (q) {
                    openEditQuestionModal(q);
                }
            });
        });

        deleteBtns.forEach(btn => {
            btn.addEventListener(, (e) => {
                e.stopPropagation();
                const qId = btn.getAttribute();
                if (confirm()) {
                    deleteQuestion(qId);
                }
            });
        });

        if (window.lucide) {
            lucide.createIcons();
        }

        if (window.MathJax) {
            MathJax.typesetPromise([questionsContainer]).catch(err => console.log(, err));
        }
    }

    
    const editQModal = document.getElementById();
    const btnCloseEditQModal = document.getElementById();
    const btnCancelEditQ = document.getElementById();
    const btnSaveEditedQ = document.getElementById();

    function openEditQuestionModal(q) {
        if (!editQModal) return;
        document.getElementById().value = q.id;
        document.getElementById().value = q.matriz || ;
        document.getElementById().value = q.codigo_bncc || ;
        document.getElementById().value = q.disciplina || ;
        document.getElementById().value = q.dificuldade || ;
        document.getElementById().value = q.nivel_cognitivo || ;
        document.getElementById().value = q.enunciado || ;

        const opA = q.opcoes.find(o => o.letra === );
        const opB = q.opcoes.find(o => o.letra === );
        const opC = q.opcoes.find(o => o.letra === );
        const opD = q.opcoes.find(o => o.letra === );

        document.getElementById().value = opA ? opA.texto : ;
        document.getElementById().value = opB ? opB.texto : ;
        document.getElementById().value = opC ? opC.texto : ;
        document.getElementById().value = opD ? opD.texto : ;

        const correctOpt = q.opcoes.find(o => o.correta === true);
        document.getElementById().value = correctOpt ? correctOpt.letra : ;
        document.getElementById().value = q.explicacao || ;

        editQModal.classList.remove();
    }

    function closeEditQuestionModal() {
        if (editQModal) editQModal.classList.add();
    }

    if (btnCloseEditQModal) btnCloseEditQModal.addEventListener(, closeEditQuestionModal);
    if (btnCancelEditQ) btnCancelEditQ.addEventListener(, closeEditQuestionModal);

    if (btnSaveEditedQ) {
        btnSaveEditedQ.addEventListener(, () => {
            const qId = document.getElementById().value;
            const matrix = document.getElementById().value;
            const desc = document.getElementById().value.trim();
            const subject = document.getElementById().value;
            const diff = document.getElementById().value;
            const bloom = document.getElementById().value;
            const text = document.getElementById().value.trim();

            const textA = document.getElementById().value.trim();
            const textB = document.getElementById().value.trim();
            const textC = document.getElementById().value.trim();
            const textD = document.getElementById().value.trim();
            const correct = document.getElementById().value;
            const explanation = document.getElementById().value.trim();

            if (!desc || !text || !textA || !textB || !textC || !textD) {
                showToast(, );
                return;
            }

            const qIndex = rawQuestions.findIndex(qu => qu.id === qId);
            if (qIndex !== -1) {
                rawQuestions[qIndex] = {
                    id: qId,
                    matriz: matrix,
                    codigo_bncc: desc,
                    disciplina: subject,
                    dificuldade: diff,
                    nivel_cognitivo: bloom,
                    enunciado: text,
                    opcoes: [
                        { letra: , texto: textA, correta: correct ===  },
                        { letra: , texto: textB, correta: correct ===  },
                        { letra: , texto: textC, correta: correct ===  },
                        { letra: , texto: textD, correta: correct ===  }
                    ],
                    explicacao: explanation
                };

                saveDatabaseState();
                renderQuestions();
                closeEditQuestionModal();
                showToast(, );
            }
        });
    }

    function deleteQuestion(qId) {
        const qIndex = rawQuestions.findIndex(qu => qu.id === qId);
        if (qIndex !== -1) {
            rawQuestions.splice(qIndex, 1);
            saveDatabaseState();
            renderQuestions();
            showToast(, );
        }
    }

    
    if (filterMatrix) filterMatrix.addEventListener(, renderQuestions);
    if (filterSubject) filterSubject.addEventListener(, renderQuestions);
    if (filterBloom) filterBloom.addEventListener(, renderQuestions);
    if (filterDifficulty) filterDifficulty.addEventListener(, renderQuestions);

    
    const btnExportStudent = document.getElementById();
    if (btnExportStudent) {
        btnExportStudent.addEventListener(, () => {
            showToast(, );
            setTimeout(() => {
                showToast(, );
            }, 1500);
        });
    }

    const btnExportTeacher = document.getElementById();
    if (btnExportTeacher) {
        btnExportTeacher.addEventListener(, () => {
            showToast(, );
            setTimeout(() => {
                showToast(, );
            }, 1500);
        });
    }

    
    
    
    const dbSchoolSearch = document.getElementById();
    const dbSchoolsTableBody = document.getElementById();
    let uniqueSchoolsList = [];

    window.populateSchoolPanelSelector = function(schools) {
        uniqueSchoolsList = schools;
        renderDbSchools();

        
        const evalSchoolSelector = document.getElementById();
        if (evalSchoolSelector) {
            evalSchoolSelector.innerHTML = ;
            schools.forEach(sch => {
                const opt = document.createElement();
                opt.value = sch;
                opt.textContent = sch.replace(/\s+/g, );
                evalSchoolSelector.appendChild(opt);
            });
        }
    };

    function renderDbSchools() {
        if (!dbSchoolsTableBody) return;
        dbSchoolsTableBody.innerHTML = ;

        const query = dbSchoolSearch ? dbSchoolSearch.value.toLowerCase().normalize().replace(/[\u0300-\u036f]/g, ) : ;
        const filteredSchools = uniqueSchoolsList.filter(s => {
            const schNorm = s.toLowerCase().normalize().replace(/[\u0300-\u036f]/g, );
            return schNorm.includes(query);
        });

        if (filteredSchools.length === 0) {
            dbSchoolsTableBody.innerHTML = ;
            return;
        }

        filteredSchools.forEach(schName => {
            const schStudents = loadedStudents.filter(s => s.escola === schName);
            const schStudentsCount = schStudents.length;
            const schStages = Array.from(new Set(schStudents.map(s => s.etapa))).length;

            let hash = 0;
            for (let i = 0; i < schName.length; i++) {
                hash += schName.charCodeAt(i);
            }
            const inepCode = 21000000 + (hash % 899999);

            
            let schTotalScores = 0;
            let schCountScores = 0;
            schStudents.forEach(st => {
                if (st.avg_score !== undefined) {
                    schTotalScores += st.avg_score;
                    schCountScores++;
                }
            });
            const avgScore = schCountScores > 0 ? (schTotalScores / schCountScores) : (62 + (hash % 20) + (hash % 10) / 10);

            const tr = document.createElement();
            tr.style.borderBottom = ;
            tr.style.height = ;

            tr.innerHTML = ;
            dbSchoolsTableBody.appendChild(tr);
        });

        const btnViewStudents = dbSchoolsTableBody.querySelectorAll();
        btnViewStudents.forEach(btn => {
            btn.addEventListener(, () => {
                const sch = btn.getAttribute();
                const tabBtn = document.querySelector();
                if (tabBtn) {
                    tabBtn.click();
                }
                if (dbStudentSchoolFilter) {
                    dbStudentSchoolFilter.value = sch;
                    applyDbFilters();
                }
            });
        });

        const btnViewClasses = dbSchoolsTableBody.querySelectorAll();
        btnViewClasses.forEach(btn => {
            btn.addEventListener(, () => {
                const sch = btn.getAttribute();
                openSchoolClassesModal(sch);
            });
        });

        safeCreateIcons();
    }

    if (dbSchoolSearch) {
        dbSchoolSearch.addEventListener(, debounce(renderDbSchools, 300));
    }

    
    
    
    
    
    const demoEvaluations = [];

    const demoDescriptors = [
        { codigo: , etapa: , desc: , componente:  },
        { codigo: , etapa: , desc: , componente:  },
        { codigo: , etapa: , desc: , componente:  },
        { codigo: , etapa: , desc: , componente:  },
        { codigo: , etapa: , desc: , componente:  }
    ];

    const FULL_INEP_MATRICES = {
        portuguese: [
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  }
        ],
        math: [
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  }
        ],
        science: [
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  },
            { codigo: , desc:  }
        ]
    };

    function renderReferenceMatrix() {
        const lpList = document.getElementById();
        const mtList = document.getElementById();
        const ciList = document.getElementById();

        if (lpList) {
            lpList.innerHTML = ;
            FULL_INEP_MATRICES.portuguese.forEach(d => {
                const div = document.createElement();
                div.style.padding = ;
                div.style.borderRadius = ;
                div.style.border = ;
                div.style.backgroundColor = ;
                div.style.fontSize = ;
                div.innerHTML = ;
                lpList.appendChild(div);
            });
        }

        if (mtList) {
            mtList.innerHTML = ;
            FULL_INEP_MATRICES.math.forEach(d => {
                const div = document.createElement();
                div.style.padding = ;
                div.style.borderRadius = ;
                div.style.border = ;
                div.style.backgroundColor = ;
                div.style.fontSize = ;
                div.innerHTML = ;
                mtList.appendChild(div);
            });
        }

        if (ciList) {
            ciList.innerHTML = ;
            FULL_INEP_MATRICES.science.forEach(d => {
                const div = document.createElement();
                div.style.padding = ;
                div.style.borderRadius = ;
                div.style.border = ;
                div.style.backgroundColor = ;
                div.style.fontSize = ;
                div.innerHTML = ;
                ciList.appendChild(div);
            });
        }
    }

    function initInepDescriptors() {
        const list = [];
        FULL_INEP_MATRICES.portuguese.forEach(d => {
            list.push({ codigo: d.codigo, etapa: , desc: d.desc, componente:  });
        });
        FULL_INEP_MATRICES.math.forEach(d => {
            list.push({ codigo: d.codigo, etapa: , desc: d.desc, componente:  });
        });
        FULL_INEP_MATRICES.science.forEach(d => {
            list.push({ codigo: d.codigo, etapa: , desc: d.desc, componente:  });
        });
        return list;
    }

    let activeEvaluations = [];
    let activeDescriptors = initInepDescriptors();

    
    const subtabBtns = document.querySelectorAll();
    const subtabContents = document.querySelectorAll();

    subtabBtns.forEach(btn => {
        btn.addEventListener(, () => {
            subtabBtns.forEach(b => {
                b.classList.remove();
                b.style.color = ;
                b.style.borderBottom = ;
                b.style.fontWeight = ;
            });
            btn.classList.add();
            btn.style.color = ;
            btn.style.borderBottom = ;
            btn.style.fontWeight = ;

            const target = btn.getAttribute();
            subtabContents.forEach(content => {
                if (content.id === target) {
                    content.classList.remove();
                } else {
                    content.classList.add();
                }
            });

            if (target === ) {
                populateScoreSchoolSelect();
            } else if (target === ) {
                renderActiveDescriptors();
            } else if (target === ) {
                populateDashboardResultsSelectors();
            }
        });
    });

    
    const btnCreatedEvents = document.getElementById();
    const btnNewEventWizard = document.getElementById();
    const panelCreatedEvents = document.getElementById();
    const panelNewEventWizard = document.getElementById();

    if (btnCreatedEvents && btnNewEventWizard) {
        btnCreatedEvents.addEventListener(, () => {
            btnCreatedEvents.className = ;
            btnNewEventWizard.className = ;
            panelCreatedEvents.classList.remove();
            panelNewEventWizard.classList.add();
            renderCreatedEvents();
        });

        btnNewEventWizard.addEventListener(, () => {
            btnNewEventWizard.className = ;
            btnCreatedEvents.className = ;
            panelCreatedEvents.classList.add();
            panelNewEventWizard.classList.remove();
            resetWizard();
        });
    }

    function renderOngoingAssessments() {
        const ongoingList = document.getElementById();
        if (!ongoingList) return;
        ongoingList.innerHTML = ;

        if (activeEvaluations.length === 0) {
            ongoingList.innerHTML = ;
            safeCreateIcons();
            return;
        }

        activeEvaluations.forEach(ev => {
            const card = document.createElement();
            card.style.backgroundColor = ;
            card.style.border = ;
            card.style.padding = ;
            card.style.borderRadius = ;
            card.style.marginBottom = ;

            const progressVal = parseFloat(ev.status) || 0;
            const progressColor = progressVal > 70 ?  : ;
            const badgeClass = progressVal > 70 ?  : ;

            const total = loadedStudents.length || 0;
            const digitados = Math.round(total * (progressVal / 100));

            card.innerHTML = ;
            ongoingList.appendChild(card);
        });

        ongoingList.querySelectorAll().forEach(btn => {
            btn.addEventListener(, () => {
                const id = btn.getAttribute();
                activeEvaluations = activeEvaluations.filter(e => e.id !== id);
                renderOngoingAssessments();
                renderCreatedEvents();
                showToast(, );
            });
        });

        safeCreateIcons();
    }

    function renderCreatedEvents() {
        const tableBody = document.getElementById();
        if (!tableBody) return;
        tableBody.innerHTML = ;

        if (activeEvaluations.length === 0) {
            tableBody.innerHTML = ;
            safeCreateIcons();
            return;
        }

        activeEvaluations.forEach(ev => {
            const tr = document.createElement();
            tr.style.borderBottom = ;
            tr.style.height = ;
            const progressVal = parseFloat(ev.status);
            const badgeClass = progressVal > 70 ?  : ;

            tr.innerHTML = ;
            tableBody.appendChild(tr);
        });

        tableBody.querySelectorAll().forEach(btn => {
            btn.addEventListener(, () => {
                const id = btn.getAttribute();
                activeEvaluations = activeEvaluations.filter(e => e.id !== id);
                renderCreatedEvents();
                renderOngoingAssessments();
                showToast(, );
            });
        });

        safeCreateIcons();
    }

    
    let wizardCurrentStep = 1;
    let wizardSelectedQuestions = [];
    const wizardStageChips = document.querySelectorAll();
    let wizardSelectedStage = ;

    wizardStageChips.forEach(chip => {
        chip.addEventListener(, (e) => {
            e.preventDefault();
            wizardStageChips.forEach(c => {
                c.classList.remove();
                c.style.border = ;
                c.style.background = ;
                c.style.color = ;
                c.style.fontWeight = ;
            });
            chip.classList.add();
            chip.style.border = ;
            chip.style.background = ;
            chip.style.color = ;
            chip.style.fontWeight = ;
            wizardSelectedStage = chip.getAttribute();
        });
    });

    const wNext1 = document.getElementById();
    if (wNext1) {
        wNext1.addEventListener(, () => {
            const title = document.getElementById().value.trim();
            if (!title) {
                showToast(, );
                return;
            }
            
            const selectedSchoolCbs = document.querySelectorAll();
            if (selectedSchoolCbs.length === 0) {
                showToast(, );
                return;
            }
            
            
            populateWizardQuestionsList();
            populateWizardClasses();
            goToWizardStep(2);
        });


    
    const wPrev2 = document.getElementById();
    if (wPrev2) {
        wPrev2.addEventListener(, () => {
            goToWizardStep(1);
        });
    }

    
    const wNext2 = document.getElementById();
    if (wNext2) {
        wNext2.addEventListener(, () => {
            const checkedBoxes = document.querySelectorAll();
            if (checkedBoxes.length === 0) {
                showToast(, );
                return;
            }
            wizardSelectedQuestions = Array.from(checkedBoxes).map(cb => cb.value);
            
            
            const title = document.getElementById().value.trim();
            const date = document.getElementById().value;
            const subject = document.getElementById().value;
            
            document.getElementById().textContent = title;
            document.getElementById().textContent = ;
            document.getElementById().innerHTML = ;
            
            goToWizardStep(3);
        });
    }

    
    const wPrev3 = document.getElementById();
    if (wPrev3) {
        wPrev3.addEventListener(, () => {
            goToWizardStep(2);
        });
    }

    
    const wFinish = document.getElementById();
    if (wFinish) {
        wFinish.addEventListener(, () => {
            const title = document.getElementById().value.trim();
            if (!title) {
                showToast(, );
                return;
            }
            const startStr = document.getElementById().value;
            const endStr = document.getElementById().value;            
            const checkedClassCbs = document.querySelectorAll();
            let participatingClasses = [];
            let schoolNames = [];

            if (checkedClassCbs.length > 0) {
                participatingClasses = Array.from(checkedClassCbs).map(cb => cb.value);
                participatingClasses.forEach(cId => {
                    const cObj = dbTurmas.find(t => t.id === cId);
                    if (cObj) {
                        const sObj = dbEscolas.find(e => e.id === cObj.escola_id);
                        if (sObj && !schoolNames.includes(sObj.nome)) {
                            schoolNames.push(sObj.nome);
                        }
                    }
                });
            } else {
                showToast(, );
                return;
            }

            const checkedSchoolCbs = document.querySelectorAll();
            let participatingSchools = Array.from(checkedSchoolCbs).map(cb => cb.value);

            const subject = document.getElementById().value;

            const formatDateStr = (dStr) => {
                if (!dStr) return ;
                const p = dStr.split();
                return ;
            };

            const newEval = {
                id: ,
                titulo: title,
                escola: schoolNames.join() || ,
                janela: ,
                tipo: ,
                etapa: wizardSelectedStage,
                status: ,
                escola_ids: participatingSchools
            };

            activeEvaluations.unshift(newEval);

            
            dbAvaliacoes.push({
                id: newEval.id,
                nome: newEval.titulo,
                componente: subject ===  ?  : ,
                data_aplicacao: newEval.janela,
                matriz_referencia: newEval.etapa,
                turma_ids: participatingClasses,
                escola_ids: participatingSchools
            });

            
            wizardSelectedQuestions.forEach(qId => {
                const q = dbQuestoes.find(qu => qu.id === qId);
                if (q) {
                    q.avaliacao_id = newEval.id;
                }
            });

            
            dbAlunos.forEach(al => {
                if (al.turma_id && participatingClasses.includes(al.turma_id)) {
                    wizardSelectedQuestions.forEach((qId, idx) => {
                        const threshold = al.avg_score || 70;
                        const matNum = parseInt(al.matricula) || 0;
                        const randomVal = (matNum + idx * 17) % 100;
                        const acertou = randomVal < threshold;
                        dbResultadosAluno.push({
                            id: ,
                            aluno_id: al.matricula,
                            avaliacao_id: newEval.id,
                            questao_id: qId,
                            acertou: acertou
                        });
                    });
                }
            });

            recalculateNetworkStats();
            showToast(, );

            renderOngoingAssessments();

            
            btnCreatedEvents.click();
        });
    }

    function goToWizardStep(step) {
        wizardCurrentStep = step;
        document.querySelectorAll().forEach(p => p.classList.add());
        document.getElementById().classList.remove();

        
        for (let i = 1; i <= 3; i++) {
            const ind = document.getElementById();
            const line = document.getElementById();
            if (i <= step) {
                ind.style.color = ;
                ind.style.fontWeight = ;
                ind.querySelector().style.background = ;
                ind.querySelector().style.borderColor = ;
                if (line) line.style.background = ;
            } else {
                ind.style.color = ;
                ind.style.fontWeight = ;
                ind.querySelector().style.background = ;
                ind.querySelector().style.borderColor = ;
                if (line) line.style.background = ;
            }
        }
    }
    function populateWizardSchools() {
        const checklist = document.getElementById();
        if (!checklist) return;
        checklist.innerHTML = ;

        if (dbEscolas.length === 0) {
            checklist.innerHTML = ;
            return;
        }

        dbEscolas.forEach(esc => {
            const label = document.createElement();
            label.style.display = ;
            label.style.alignItems = ;
            label.style.gap = ;
            label.style.fontSize = ;
            label.style.color = ;
            label.style.cursor = ;

            const checkbox = document.createElement();
            checkbox.type = ;
            checkbox.value = esc.id;
            checkbox.className = ;
            checkbox.style.cursor = ;

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(esc.nome));
            checklist.appendChild(label);
        });

        const btnSelectAll = document.getElementById();
        const btnClearAll = document.getElementById();

        if (btnSelectAll) {
            btnSelectAll.onclick = (e) => {
                e.preventDefault();
                checklist.querySelectorAll().forEach(cb => cb.checked = true);
            };
        }

        if (btnClearAll) {
            btnClearAll.onclick = (e) => {
                e.preventDefault();
                checklist.querySelectorAll().forEach(cb => cb.checked = false);
            };
        }
    }

    function resetWizard() {
        document.getElementById().value = ;
        document.getElementById().value = ;
        document.getElementById().value = ;
        document.getElementById().value = ;
        populateWizardSchools();
        goToWizardStep(1);
    }

    function populateWizardQuestionsList() {
        const qContainer = document.getElementById();
        if (!qContainer) return;
        qContainer.innerHTML = ;

        const selectedSubject = document.getElementById().value;

        
        let stagePrefix = ; 
        if (wizardSelectedStage.includes()) stagePrefix = ;
        else if (wizardSelectedStage.includes()) stagePrefix = ;
        else if (wizardSelectedStage.includes()) stagePrefix = ;

        
        const hasEF02 = rawQuestions.some(q => q.codigo_bncc.startsWith());
        if (!hasEF02) {
            rawQuestions.push(
                {
                    id: ,
                    codigo_bncc: ,
                    disciplina: ,
                    matriz: ,
                    descritor: ,
                    enunciado: ,
                    nivel_cognitivo: ,
                    dificuldade: ,
                    opcoes: [
                        { letra: , texto: , correta: false },
                        { letra: , texto: , correta: true },
                        { letra: , texto: , correta: false },
                        { letra: , texto: , correta: false }
                    ],
                    explicacao: 
                },
                {
                    id: ,
                    codigo_bncc: ,
                    disciplina: ,
                    matriz: ,
                    descritor: ,
                    enunciado: ,
                    nivel_cognitivo: ,
                    dificuldade: ,
                    opcoes: [
                        { letra: , texto: , correta: false },
                        { letra: , texto: , correta: true },
                        { letra: , texto: , correta: false },
                        { letra: , texto: , correta: false }
                    ],
                    explicacao: 
                }
            );
        }

        const filtered = rawQuestions.filter(q => {
            const matchesDiscipline = selectedSubject.includes() || q.disciplina === selectedSubject;
            const matchesStage = q.codigo_bncc && q.codigo_bncc.startsWith(stagePrefix);
            return matchesDiscipline && matchesStage;
        });

        if (filtered.length === 0) {
            qContainer.innerHTML = ;
            return;
        }

        filtered.forEach((q, idx) => {
            const div = document.createElement();
            div.className = ;
            div.style.display = ;
            div.style.alignItems = ;
            div.style.gap = ;
            div.style.padding = ;
            div.style.border = ;
            div.style.borderRadius = ;
            div.style.backgroundColor = ;

            div.innerHTML = ;
            qContainer.appendChild(div);
        });

        safeCreateIcons();
    }

    
    const scoreSchoolSelect = document.getElementById();
    const scoreClassSelect = document.getElementById();
    const scoreTablePlaceholder = document.getElementById();
    const scoreTableContent = document.getElementById();
    const scoreStudentsTableBody = document.getElementById();
    const scoreEvalSelect = document.getElementById();

    function populateScoreSchoolSelect() {
        populateScoreEvalSelect();
    }

    function populateScoreEvalSelect() {
        if (!scoreEvalSelect) return;
        scoreEvalSelect.innerHTML = ;
        
        const allEvals = [
            { id: , titulo:  },
            { id: , titulo:  },
            ...activeEvaluations.filter(ev => ev.id !==  && ev.id !== )
        ];

        allEvals.forEach(ev => {
            const opt = document.createElement();
            opt.value = ev.id;
            opt.textContent = ev.titulo;
            scoreEvalSelect.appendChild(opt);
        });

        
        scoreEvalSelect.removeEventListener(, updateScoreSchoolAndClassSelectors);
        scoreEvalSelect.addEventListener(, updateScoreSchoolAndClassSelectors);

        updateScoreSchoolAndClassSelectors();
    }

    function updateScoreSchoolAndClassSelectors() {
        if (!scoreEvalSelect || !scoreSchoolSelect || !scoreClassSelect) return;
        const evalId = scoreEvalSelect.value;
        const ev = dbAvaliacoes.find(e => e.id === evalId);

        let linkedClassIds = [];
        if (ev && ev.turma_ids) {
            linkedClassIds = ev.turma_ids;
        }
        
        scoreSchoolSelect.innerHTML = ;
        let filteredSchools = [];
        if (ev && ev.escola_ids && ev.escola_ids.length > 0) {
            filteredSchools = dbEscolas.filter(s => ev.escola_ids.includes(s.id));
        } else if (linkedClassIds.length > 0) {
            linkedClassIds.forEach(cId => {
                const cObj = dbTurmas.find(t => t.id === cId);
                if (cObj) {
                    const sObj = dbEscolas.find(e => e.id === cObj.escola_id);
                    if (sObj && !filteredSchools.some(s => s.id === sObj.id)) {
                        filteredSchools.push(sObj);
                    }
                }
            });
        } else {
            filteredSchools = [...dbEscolas];
        }

        filteredSchools.forEach(s => {
            const opt = document.createElement();
            opt.value = s.nome;
            opt.textContent = s.nome;
            scoreSchoolSelect.appendChild(opt);
        });

        
        scoreClassSelect.innerHTML = ;
        checkAndRenderScoresTable();
    }

    if (scoreSchoolSelect) {
        scoreSchoolSelect.addEventListener(, () => {
            const schoolName = scoreSchoolSelect.value;
            const evalId = scoreEvalSelect.value;
            const ev = dbAvaliacoes.find(e => e.id === evalId);
            
            let linkedClassIds = ev ? (ev.turma_ids || []) : [];

            scoreClassSelect.innerHTML = ;
            const schoolObj = dbEscolas.find(e => e.nome === schoolName);
            if (schoolObj) {
                const classes = dbTurmas.filter(t => t.escola_id === schoolObj.id);
                classes.forEach(c => {
                    if (linkedClassIds.length === 0 || linkedClassIds.includes(c.id)) {
                        const opt = document.createElement();
                        opt.value = c.id;
                        opt.textContent = ;
                        scoreClassSelect.appendChild(opt);
                    }
                });
            }
            checkAndRenderScoresTable();
        });
    }

    if (scoreClassSelect) {
        scoreClassSelect.addEventListener(, checkAndRenderScoresTable);
    }

    function checkAndRenderScoresTable() {
        const school = scoreSchoolSelect ? scoreSchoolSelect.value : ;
        const classId = scoreClassSelect ? scoreClassSelect.value : ;
        
        if (!school || !classId) {
            if (scoreTablePlaceholder) scoreTablePlaceholder.classList.remove();
            if (scoreTableContent) scoreTableContent.classList.add();
            return;
        }

        if (scoreTablePlaceholder) scoreTablePlaceholder.classList.add();
        if (scoreTableContent) scoreTableContent.classList.remove();
        renderScoreRoster(school, classId);
    }

    let tempStudentScores = {};

    function renderScoreRoster(schoolName, classId) {
        if (!scoreStudentsTableBody) return;
        scoreStudentsTableBody.innerHTML = ;

        const selectedEvalId = scoreEvalSelect.value;

        
        const students = dbAlunos.filter(al => al.turma_id === classId);
        
        if (students.length === 0) {
            scoreStudentsTableBody.innerHTML = ;
            return;
        }

        
        let evalQuestions = dbQuestoes.filter(q => q.avaliacao_id === selectedEvalId);
        if (evalQuestions.length === 0) {
            evalQuestions = dbQuestoes.slice(0, 5);
        }

        const answersHeaderEl = document.querySelector();
        if (answersHeaderEl) {
            answersHeaderEl.textContent = ;
        }

        students.forEach(st => {
            const tr = document.createElement();
            tr.style.borderBottom = ;
            tr.style.height = ;

            if (!tempStudentScores[st.matricula]) {
                tempStudentScores[st.matricula] = [];
                evalQuestions.forEach((q, qIdx) => {
                    const existingRes = dbResultadosAluno.find(r => r.aluno_id === st.matricula && r.avaliacao_id === selectedEvalId && r.questao_id === q.id);
                    if (existingRes) {
                        const qObj = rawQuestions.find(rq => rq.id === q.id);
                        tempStudentScores[st.matricula][qIdx] = existingRes.acertou ? (qObj ? qObj.correta : ) : ;
                    } else {
                        const threshold = st.avg_score || 70;
                        const qObj = rawQuestions.find(rq => rq.id === q.id);
                        const correctAns = qObj ? (qObj.correta || ) : ;
                        const isCorrect = (Math.random() * 100) < threshold;
                        if (isCorrect) {
                            tempStudentScores[st.matricula][qIdx] = correctAns;
                        } else {
                            const incorrects = [, , , ].filter(letra => letra !== correctAns);
                            tempStudentScores[st.matricula][qIdx] = incorrects[Math.floor(Math.random() * incorrects.length)];
                        }
                    }
                });
            }
            const stAnswers = tempStudentScores[st.matricula];

            let rowHTML = ;

            for (let qIdx = 0; qIdx < evalQuestions.length; qIdx++) {
                const currentAns = stAnswers[qIdx] || ;
                rowHTML += ;
            }

            let correctCount = 0;
            evalQuestions.forEach((q, idx) => {
                const qObj = rawQuestions.find(rq => rq.id === q.id);
                const correctAns = qObj ? (qObj.correta || ) : ;
                const chosen = stAnswers[idx] || ;
                if (chosen === correctAns) correctCount++;
            });
            const perf = evalQuestions.length > 0 ? Math.round((correctCount / evalQuestions.length) * 100) : 100;

            rowHTML += ;

            tr.innerHTML = rowHTML;
            scoreStudentsTableBody.appendChild(tr);
        });

        const answerSelects = scoreStudentsTableBody.querySelectorAll();
        answerSelects.forEach(sel => {
            sel.addEventListener(, () => {
                const mat = sel.getAttribute();
                const qIdx = parseInt(sel.getAttribute());
                if (!tempStudentScores[mat]) tempStudentScores[mat] = [];
                tempStudentScores[mat][qIdx] = sel.value;
                
                let correctCount = 0;
                evalQuestions.forEach((q, idx) => {
                    const qObj = rawQuestions.find(rq => rq.id === q.id);
                    const correctAns = qObj ? (qObj.correta || ) : ;
                    if (tempStudentScores[mat][idx] === correctAns) correctCount++;
                });
                const perf = Math.round((correctCount / evalQuestions.length) * 100);
                document.getElementById().textContent = ;
            });
        });

        const saveBtns = scoreStudentsTableBody.querySelectorAll();
        saveBtns.forEach(btn => {
            btn.addEventListener(, () => {
                const mat = btn.getAttribute();
                const stObj = dbAlunos.find(s => s.matricula === mat);
                const answers = tempStudentScores[mat];
                if (stObj && answers) {
                    let correctCount = 0;
                    evalQuestions.forEach((q, idx) => {
                        const qObj = rawQuestions.find(rq => rq.id === q.id);
                        const correctAns = qObj ? (qObj.correta || ) : ;
                        const chosen = answers[idx] || ;
                        const acertou = (chosen === correctAns);
                        if (acertou) correctCount++;

                        const existingRes = dbResultadosAluno.find(r => r.aluno_id === mat && r.avaliacao_id === selectedEvalId && r.questao_id === q.id);
                        if (existingRes) {
                            existingRes.acertou = acertou;
                        } else {
                            dbResultadosAluno.push({
                                id: ,
                                aluno_id: mat,
                                avaliacao_id: selectedEvalId,
                                questao_id: q.id,
                                acertou: acertou
                            });
                        }
                    });

                    const newAvg = Math.round((correctCount / evalQuestions.length) * 100);
                    stObj.avg_score = newAvg;
                    
                    const flatSt = loadedStudents.find(s => s.matricula === mat);
                    if (flatSt) flatSt.avg_score = newAvg;

                    recalculateNetworkStats();
                    renderRiskGoalsTable();
                    renderHeatmapGrid();
                }
                showToast(, );
            });
        });

        safeCreateIcons();
    }

    const btnSaveAllScores = document.getElementById();
    if (btnSaveAllScores) {
        btnSaveAllScores.addEventListener(, () => {
            const selectedEvalId = scoreEvalSelect.value;
            const classId = scoreClassSelect.value;
            if (!classId) return;

            const students = dbAlunos.filter(al => al.turma_id === classId);
            
            let evalQuestions = dbQuestoes.filter(q => q.avaliacao_id === selectedEvalId);
            if (evalQuestions.length === 0) {
                evalQuestions = dbQuestoes.slice(0, 5);
            }

            let savedCount = 0;
            students.forEach(st => {
                const answers = tempStudentScores[st.matricula];
                if (answers) {
                    let correctCount = 0;
                    evalQuestions.forEach((q, idx) => {
                        const qObj = rawQuestions.find(rq => rq.id === q.id);
                        const correctAns = qObj ? (qObj.correta || ) : ;
                        const chosen = answers[idx] || ;
                        const acertou = (chosen === correctAns);
                        if (acertou) correctCount++;

                        const existingRes = dbResultadosAluno.find(r => r.aluno_id === st.matricula && r.avaliacao_id === selectedEvalId && r.questao_id === q.id);
                        if (existingRes) {
                            existingRes.acertou = acertou;
                        } else {
                            dbResultadosAluno.push({
                                id: ,
                                aluno_id: st.matricula,
                                avaliacao_id: selectedEvalId,
                                questao_id: q.id,
                                acertou: acertou
                            });
                        }
                    });

                    const newAvg = Math.round((correctCount / evalQuestions.length) * 100);
                    stObj.avg_score = newAvg;
                    
                    const flatSt = loadedStudents.find(s => s.matricula === st.matricula);
                    if (flatSt) flatSt.avg_score = newAvg;
                    
                    savedCount++;
                }
            });

            const ev = activeEvaluations.find(e => e.id === selectedEvalId);
            if (ev) {
                ev.status = ;
                renderOngoingAssessments();
            }

            recalculateNetworkStats();
            renderRiskGoalsTable();
            renderHeatmapGrid();

            showToast(, );
        });
    }

    
    const formDescriptor = document.getElementById();
    if (formDescriptor) {
        formDescriptor.addEventListener(, (e) => {
            e.preventDefault();
            const code = document.getElementById().value.trim().toUpperCase();
            const stage = document.getElementById().value;
            const text = document.getElementById().value.trim();

            const comp = code.startsWith() ?  : ;

            activeDescriptors.unshift({
                codigo: code,
                etapa: stage,
                desc: text,
                componente: comp
            });

            showToast(, );
            formDescriptor.reset();
            renderActiveDescriptors();
        });
    }

    function renderActiveDescriptors(filterComponent = ) {
        const tableBody = document.getElementById();
        if (!tableBody) return;
        tableBody.innerHTML = ;

        const filtered = activeDescriptors.filter(d => {
            return filterComponent ===  || d.componente === filterComponent;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = ;
            return;
        }

        filtered.forEach(d => {
            const tr = document.createElement();
            tr.style.borderBottom = ;
            tr.style.height = ;

            tr.innerHTML = ;
            tableBody.appendChild(tr);
        });
    }

    
    const descFilterBtns = document.querySelectorAll();
    descFilterBtns.forEach(btn => {
        btn.addEventListener(, () => {
            descFilterBtns.forEach(b => {
                b.className = ;
            });
            btn.className = ;
            const filter = btn.getAttribute();
            renderActiveDescriptors(filter);
        });
    });

    
    function populateSchoolPanelSelector(schools) {
        populateWizardClasses();

        const sSchool = document.getElementById();
        const dSchool = document.getElementById();

        if (sSchool) {
            sSchool.innerHTML = ;
            schools.forEach(sch => {
                const opt = document.createElement();
                opt.value = sch;
                opt.textContent = sch.replace(/\s+/g, );
                sSchool.appendChild(opt);
            });
        }

        if (dSchool) {
            dSchool.innerHTML = ;
            schools.forEach(sch => {
                const opt = document.createElement();
                opt.value = sch;
                opt.textContent = sch.replace(/\s+/g, );
                dSchool.appendChild(opt);
            });
        }
    }

    function populateWizardClasses() {
        const wChecklist = document.getElementById();
        if (!wChecklist) return;

        wChecklist.innerHTML = ;
        if (dbTurmas.length === 0) {
            wChecklist.innerHTML = ;
            return;
        }

        const selectedSchoolCbs = document.querySelectorAll();
        const selectedSchoolIds = Array.from(selectedSchoolCbs).map(cb => cb.value);

        dbEscolas.forEach(esc => {
            if (!selectedSchoolIds.includes(esc.id)) return;
            
            const classes = dbTurmas.filter(t => t.escola_id === esc.id);
            if (classes.length > 0) {
                const schoolHeader = document.createElement();
                schoolHeader.style.fontSize = ;
                schoolHeader.style.fontWeight = ;
                schoolHeader.style.marginTop = ;
                schoolHeader.style.color = ;
                schoolHeader.textContent = esc.nome;
                wChecklist.appendChild(schoolHeader);

                classes.forEach(c => {
                    const label = document.createElement();
                    label.style.display = ;
                    label.style.alignItems = ;
                    label.style.gap = ;
                    label.style.fontSize = ;
                    label.style.cursor = ;
                    label.style.padding = ;
                    label.style.paddingLeft = ;
                    
                    label.innerHTML = ;
                    wChecklist.appendChild(label);
                });
            }
        });

        const btnAll = document.getElementById();
        const btnNone = document.getElementById();
        if (btnAll && btnNone) {
            btnAll.onclick = (e) => {
                e.preventDefault();
                document.querySelectorAll().forEach(cb => cb.checked = true);
            };
            btnNone.onclick = (e) => {
                e.preventDefault();
                document.querySelectorAll().forEach(cb => cb.checked = false);
            };
        }
    }

    
    renderCreatedEvents();

    
    
    
    const profileSelector = document.getElementById();
    const notificationBtn = document.getElementById();
    const notificationsDropdown = document.getElementById();

    if (notificationBtn && notificationsDropdown) {
        notificationBtn.addEventListener(, (e) => {
            e.stopPropagation();
            notificationsDropdown.classList.toggle();
        });
        document.addEventListener(, () => {
            notificationsDropdown.classList.add();
        });
    }

    let activeNotifications = [
        { id: 1, type: , title: , desc:  },
        { id: 2, type: , title: , desc:  },
        { id: 3, type: , title: , desc:  }
    ];

    function renderNotificationsList() {
        const badge = document.getElementById();
        const container = document.getElementById();
        if (!container) return;
        container.innerHTML = ;

        if (activeNotifications.length === 0) {
            if (badge) badge.classList.add();
            container.innerHTML = ;
            return;
        }

        if (badge) {
            badge.classList.remove();
            badge.textContent = activeNotifications.length;
        }

        activeNotifications.forEach(n => {
            const div = document.createElement();
            div.style.padding = ;
            div.style.border = ;
            div.style.borderRadius = ;
            div.style.backgroundColor = ;
            div.style.fontSize = ;
            div.style.display = ;
            div.style.flexDirection = ;
            div.style.gap = ;

            let iconColor = ;
            if (n.type === ) iconColor = ;
            else if (n.type === ) iconColor = ;

            div.innerHTML = ;
            container.appendChild(div);
        });

        safeCreateIcons();
    }

    const btnClearNotifications = document.getElementById();
    if (btnClearNotifications) {
        btnClearNotifications.addEventListener(, () => {
            activeNotifications = [];
            renderNotificationsList();
            showToast(, );
        });
    }

    function applyProfilePermissions(profile) {
        const menuItems = document.querySelectorAll();
        menuItems.forEach(item => {
            const target = item.getAttribute();
            
            
            item.style.opacity = ;
            item.style.pointerEvents = ;

            if (profile === ) {
                
                if (target ===  || target ===  || target === ) {
                    item.style.opacity = ;
                    item.style.pointerEvents = ;
                }
            } else if (profile === ) {
                
                if (target === ) {
                    item.style.opacity = ;
                    item.style.pointerEvents = ;
                }
            } else if (profile === ) {
                
                if (target === ) {
                    item.style.opacity = ;
                    item.style.pointerEvents = ;
                }
            }
        });

        const profileNames = {
            secretaria: ,
            diretor: ,
            coordenador: ,
            professor: 
        };
        showToast(, );
    }

    if (profileSelector) {
        profileSelector.addEventListener(, () => {
            applyProfilePermissions(profileSelector.value);
        });
    }

    
    renderNotificationsList();


    
    
    
    function getBNCCCriticalSkills(evalId, schoolName, classId, subject) {
        let results = [...dbResultadosAluno];
        if (evalId && evalId !== ) {
            results = results.filter(r => r.avaliacao_id === evalId);
        }

        let filteredStudents = [...dbAlunos];
        if (schoolName && schoolName !== ) {
            const sObj = dbEscolas.find(e => e.nome === schoolName);
            if (sObj) {
                const tIds = dbTurmas.filter(t => t.escola_id === sObj.id).map(t => t.id);
                filteredStudents = filteredStudents.filter(al => tIds.includes(al.turma_id));
            }
        }
        if (classId && classId !== ) {
            filteredStudents = filteredStudents.filter(al => al.turma_id === classId);
        }

        const studentMats = filteredStudents.map(al => al.matricula);
        results = results.filter(r => studentMats.includes(r.aluno_id));

        const descStats = {};
        activeDescriptors.forEach(d => {
            descStats[d.codigo] = { correct: 0, total: 0, desc: d };
        });

        results.forEach(res => {
            const q = dbQuestoes.find(qu => qu.id === res.questao_id);
            if (q) {
                const descCode = q.descritor_bncc_id;
                const isLP = descCode.includes() || descCode.startsWith();
                if (subject ===  && !isLP) return;
                if (subject ===  && isLP) return;

                if (descStats[descCode]) {
                    descStats[descCode].total++;
                    if (res.acertou) descStats[descCode].correct++;
                }
            }
        });

        const list = [];
        Object.keys(descStats).forEach(code => {
            const stat = descStats[code];
            const isLP = code.includes() || code.startsWith();
            if (subject ===  && !isLP) return;
            if (subject ===  && isLP) return;

            const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
            list.push({
                codigo: code,
                percent: pct,
                total: stat.total,
                desc: stat.desc
            });
        });

        return list;
    }

    function updateDashboardResultsMetrics(evalId, schoolName, classId, subject) {
        const adValue = document.getElementById();
        const adSub = document.getElementById();
        const profValue = document.getElementById();
        const profSub = document.getElementById();
        const targetValue = document.getElementById();
        const targetSub = document.getElementById();

        if (!adValue || !adSub || !profValue || !profSub) return;

        let filteredStudents = [...dbAlunos];
        if (schoolName && schoolName !== ) {
            const sObj = dbEscolas.find(e => e.nome === schoolName);
            if (sObj) {
                const tIds = dbTurmas.filter(t => t.escola_id === sObj.id).map(t => t.id);
                filteredStudents = filteredStudents.filter(al => tIds.includes(al.turma_id));
            }
        }
        if (classId && classId !== ) {
            filteredStudents = filteredStudents.filter(al => al.turma_id === classId);
        }

        const totalStudents = filteredStudents.length;

        let participations = 0;
        let totalAvg = 0;
        let countAvg = 0;

        filteredStudents.forEach(st => {
            const hasRes = dbResultadosAluno.some(r => r.aluno_id === st.matricula && (evalId ===  || r.avaliacao_id === evalId));
            if (hasRes) {
                participations++;
                if (st.avg_score !== undefined) {
                    totalAvg += st.avg_score;
                    countAvg++;
                }
            }
        });

        const adhesionPct = totalStudents > 0 ? Math.round((participations / totalStudents) * 100) : 0;
        adValue.textContent = ;
        adSub.textContent = ;

        const avgScore = countAvg > 0 ? Math.round(totalAvg / countAvg) : 0;
        const saebScore = totalStudents > 0 ? Math.round(150 + (avgScore / 100) * 150) : 0;
        profValue.textContent = saebScore.toString();

        let saebLevel = 0;
        if (saebScore > 325) saebLevel = 9;
        else if (saebScore > 300) saebLevel = 8;
        else if (saebScore > 275) saebLevel = 7;
        else if (saebScore > 250) saebLevel = 6;
        else if (saebScore > 225) saebLevel = 5;
        else if (saebScore > 200) saebLevel = 4;
        else if (saebScore > 175) saebLevel = 3;
        else if (saebScore > 150) saebLevel = 2;
        else if (saebScore > 125) saebLevel = 1;
        
        profSub.textContent = ;

        if (targetValue && targetSub) {
            const target = 250.0;
            const deviation = saebScore - target;
            targetValue.textContent = target.toFixed(1);
            targetSub.textContent = ;
        }
    }

    function populateDashboardResultsSelectors() {
        const evalSelect = document.getElementById();
        const schoolSelect = document.getElementById();
        const classSelect = document.getElementById();
        const subjectSelect = document.getElementById();

        if (!evalSelect || !schoolSelect || !classSelect || !subjectSelect) return;

        evalSelect.innerHTML = ;
        const allEvals = [
            { id: , titulo:  },
            { id: , titulo:  },
            ...activeEvaluations.filter(ev => ev.id !==  && ev.id !== )
        ];
        allEvals.forEach(ev => {
            const opt = document.createElement();
            opt.value = ev.id;
            opt.textContent = ev.titulo;
            evalSelect.appendChild(opt);
        });

        schoolSelect.innerHTML = ;
        dbEscolas.forEach(s => {
            const opt = document.createElement();
            opt.value = s.nome;
            opt.textContent = s.nome;
            schoolSelect.appendChild(opt);
        });

        function updateClassesDropdown() {
            classSelect.innerHTML = ;
            const selectedSchool = schoolSelect.value;
            const schoolObj = dbEscolas.find(e => e.nome === selectedSchool);
            if (schoolObj) {
                const classes = dbTurmas.filter(t => t.escola_id === schoolObj.id);
                classes.forEach(c => {
                    const opt = document.createElement();
                    opt.value = c.id;
                    opt.textContent = ;
                    classSelect.appendChild(opt);
                });
            } else if (selectedSchool === ) {
                dbTurmas.forEach(c => {
                    const opt = document.createElement();
                    opt.value = c.id;
                    opt.textContent = ;
                    classSelect.appendChild(opt);
                });
            }
            renderHeatmapGrid();
        }

        evalSelect.removeEventListener(, renderHeatmapGrid);
        evalSelect.addEventListener(, renderHeatmapGrid);

        schoolSelect.removeEventListener(, updateClassesDropdown);
        schoolSelect.addEventListener(, updateClassesDropdown);

        classSelect.removeEventListener(, renderHeatmapGrid);
        classSelect.addEventListener(, renderHeatmapGrid);

        subjectSelect.removeEventListener(, renderHeatmapGrid);
        subjectSelect.addEventListener(, renderHeatmapGrid);

        updateClassesDropdown();
    }

    function renderHeatmapGrid() {
        const grid = document.getElementById();
        if (!grid) return;
        grid.innerHTML = ;

        const evalSelect = document.getElementById();
        const schoolSelect = document.getElementById();
        const classSelect = document.getElementById();
        const subjectSelect = document.getElementById();

        const evalId = evalSelect ? evalSelect.value : ;
        const schoolName = schoolSelect ? schoolSelect.value : ;
        const classId = classSelect ? classSelect.value : ;
        const subject = subjectSelect ? subjectSelect.value : ;

        const stats = getBNCCCriticalSkills(evalId, schoolName, classId, subject);

        updateDashboardResultsMetrics(evalId, schoolName, classId, subject);

        if (stats.length === 0) {
            grid.innerHTML = ;
            return;
        }

        stats.forEach(stat => {
            const percentage = stat.percent;
            
            let bgColor = ;
            let borderColor = ;
            let textColor = ;
            
            if (stat.total === 0) {
                bgColor = ;
                borderColor = ;
                textColor = ;
            } else if (percentage < 55) {
                bgColor = ;
                borderColor = ;
                textColor = ;
            } else if (percentage < 70) {
                bgColor = ;
                borderColor = ;
                textColor = ;
            }

            const block = document.createElement();
            block.style.padding = ;
            block.style.borderRadius = ;
            block.style.border = ;
            block.style.backgroundColor = bgColor;
            block.style.textAlign = ;
            block.style.cursor = ;
            block.style.transition = ;

            block.innerHTML = ;

            block.addEventListener(, () => {
                showDescriptorDetail(desc, percentage);
            });

            grid.appendChild(block);
        });
    }

    function showDescriptorDetail(desc, percentage) {
        const card = document.getElementById();
        if (!card) return;
        card.classList.remove();

        document.getElementById().textContent = ;
        document.getElementById().textContent = desc.desc;

        const ranksContainer = document.getElementById();
        if (ranksContainer) {
            ranksContainer.innerHTML = ;
            const schools = [, , , ];
            schools.forEach(sch => {
                let hash = 0;
                for (let i = 0; i < sch.length; i++) {
                    hash += sch.charCodeAt(i);
                }
                const schPerf = Math.max(30, Math.min(100, percentage - 15 + (hash % 30)));
                
                let barColor = ;
                if (schPerf < 55) barColor = ;
                else if (schPerf < 70) barColor = ;

                const row = document.createElement();
                row.style.display = ;
                row.style.alignItems = ;
                row.style.gap = ;
                row.innerHTML = ;
                ranksContainer.appendChild(row);
            });
        }

        const tipText = document.getElementById();
        if (desc.codigo.startsWith()) {
            tipText.innerHTML = ;
        } else {
            tipText.innerHTML = ;
        }
    }

    const btnCloseDescDetail = document.getElementById();
    if (btnCloseDescDetail) {
        btnCloseDescDetail.addEventListener(, () => {
            document.getElementById().classList.add();
        });
    }

    
    renderHeatmapGrid();


    
    
    
    const pedagogicSubtabBtns = document.querySelectorAll();
    const pedagogicSubtabContents = document.querySelectorAll();

    pedagogicSubtabBtns.forEach(btn => {
        btn.addEventListener(, () => {
            pedagogicSubtabBtns.forEach(b => {
                b.classList.remove();
                b.style.color = ;
                b.style.borderBottom = ;
                b.style.fontWeight = ;
            });
            btn.classList.add();
            btn.style.color = ;
            btn.style.borderBottom = ;
            btn.style.fontWeight = ;

            const target = btn.getAttribute();
            pedagogicSubtabContents.forEach(content => {
                if (content.id === target) {
                    content.classList.remove();
                } else {
                    content.classList.add();
                }
            });

            if (target === ) {
                renderRiskGoalsTable();
            } else if (target === ) {
                populateInterventionPlansSelectors();
            }
        });
    });

    function renderRiskGoalsTable() {
        const tableBody = document.getElementById();
        if (!tableBody) return;
        tableBody.innerHTML = ;

        const schools = Array.from(new Set(loadedStudents.map(s => s.escola))).sort();
        schools.forEach((schName, idx) => {
            let hash = 0;
            for (let i = 0; i < schName.length; i++) {
                hash += schName.charCodeAt(i);
            }
            const baseIdeb = 4.2 + (hash % 15) / 10;
            const projectedIdeb = baseIdeb + 0.2 + (hash % 4) / 10;
            const targetIdeb = baseIdeb + 0.5; 
            const desvio = projectedIdeb - targetIdeb;
            const desvioText = desvio >= 0 ?  : ;
            const desvioColor = desvio >= 0 ?  : ;

            let riskLabel = ;
            let riskBadgeClass = ;
            if (desvio < -0.3) {
                riskLabel = ;
                riskBadgeClass = ;
            } else if (desvio < 0) {
                riskLabel = ;
                riskBadgeClass = ;
            }

            const tr = document.createElement();
            tr.style.borderBottom = ;
            tr.style.height = ;
            tr.innerHTML = ;
            tableBody.appendChild(tr);
        });
    }

    const btnGenerateAiPlan = document.getElementById();
    if (btnGenerateAiPlan) {
        btnGenerateAiPlan.addEventListener(, () => {
            showToast(, );
            
            
            const container = document.getElementById();
            if (container) {
                const planDiv = document.createElement();
                planDiv.className = ;
                planDiv.style.border = ;
                planDiv.style.padding = ;
                planDiv.style.borderRadius = ;
                planDiv.style.background = ;
                planDiv.style.display = ;
                planDiv.style.flexDirection = ;
                planDiv.style.justifyContent = ;
                planDiv.style.height = ;

                planDiv.innerHTML = ;
                container.prepend(planDiv);
                safeCreateIcons();
            }
        });
    }

    const pedagogicPlansData = {
        lp1: {
            title: ,
            meta: ,
            body: 
        },
        lp2: {
            title: ,
            meta: ,
            body: 
        },
        lp3: {
            title: ,
            meta: ,
            body: 
        },
        custom: {
            title: ,
            meta: ,
            body: 
        }
    };

    const planModal = document.getElementById();
    const modalPlanTitle = document.getElementById();
    const modalPlanMeta = document.getElementById();
    const modalPlanBody = document.getElementById();
    const closePlanModalBtn = document.getElementById();
    const btnModalClosePlan = document.getElementById();
    const btnModalPrintPlan = document.getElementById();

    function openPedagogicPlanModal(planId) {
        if (!planModal) return;
        const plan = pedagogicPlansData[planId] || pedagogicPlansData.custom;

        modalPlanTitle.textContent = plan.title;
        modalPlanMeta.textContent = plan.meta;
        modalPlanBody.innerHTML = plan.body;

        planModal.classList.remove();
        safeCreateIcons();
    }

    function closePedagogicPlanModal() {
        if (planModal) planModal.classList.add();
    }

    if (closePlanModalBtn) closePlanModalBtn.addEventListener(, closePedagogicPlanModal);
    if (btnModalClosePlan) btnModalClosePlan.addEventListener(, closePedagogicPlanModal);
    
    if (btnModalPrintPlan) {
        btnModalPrintPlan.addEventListener(, () => {
            showToast(, );
            setTimeout(() => {
                window.print();
            }, 300);
        });
    }

    document.addEventListener(, (e) => {
        const btn = e.target.closest();
        if (btn) {
            e.preventDefault();
            const planId = btn.getAttribute();
            openPedagogicPlanModal(planId);
        }
    });

    
    
    
    const dbStudentSearch = document.getElementById();
    const dbStudentSchoolFilter = document.getElementById();
    const dbStudentNeeFilter = document.getElementById();
    const dbStudentsTableBody = document.getElementById();
    const dbStudentsPaginationInfo = document.getElementById();
    const btnDbStudentsPrev = document.getElementById();
    const btnDbStudentsNext = document.getElementById();

    const studentModal = document.getElementById();
    const closeStudentModalBtn = document.getElementById();
    
    let dbCurrentPage = 1;
    const dbPageSize = 50;
    let dbFilteredStudents = [];

    window.initAlunosTab = function(schools) {
        if (dbStudentSchoolFilter) {
            dbStudentSchoolFilter.innerHTML = ;
            schools.forEach(sch => {
                const opt = document.createElement();
                opt.value = sch;
                opt.textContent = sch.replace(/\s+/g, );
                dbStudentSchoolFilter.appendChild(opt);
            });
        }

        dbFilteredStudents = [...loadedStudents];
        dbCurrentPage = 1;
        renderDbStudents();
    };

    function applyDbFilters() {
        const query = dbStudentSearch.value.toLowerCase().normalize().replace(/[\u0300-\u036f]/g, );
        const schoolFilter = dbStudentSchoolFilter.value;
        const neeFilter = dbStudentNeeFilter.value;

        dbFilteredStudents = loadedStudents.filter(s => {
            const nameNorm = s.nome.toLowerCase().normalize().replace(/[\u0300-\u036f]/g, );
            const cpfNorm = (s.cpf || ).replace(/\D/g, );
            const matchQuery = nameNorm.includes(query) || s.matricula.includes(query) || cpfNorm.includes(query);
            const matchSchool = schoolFilter ===  || s.escola === schoolFilter;
            const hasNee = !!s.nee;
            const matchNee = neeFilter ===  || (neeFilter ===  && hasNee) || (neeFilter ===  && !hasNee);

            return matchQuery && matchSchool && matchNee;
        });

        dbCurrentPage = 1;
        renderDbStudents();
    }

    if (dbStudentSearch) dbStudentSearch.addEventListener(, applyDbFilters);
    if (dbStudentSchoolFilter) dbStudentSchoolFilter.addEventListener(, applyDbFilters);
    if (dbStudentNeeFilter) dbStudentNeeFilter.addEventListener(, applyDbFilters);

    if (btnDbStudentsPrev) {
        btnDbStudentsPrev.addEventListener(, () => {
            if (dbCurrentPage > 1) {
                dbCurrentPage--;
                renderDbStudents();
            }
        });
    }

    if (btnDbStudentsNext) {
        btnDbStudentsNext.addEventListener(, () => {
            const maxPage = Math.ceil(dbFilteredStudents.length / dbPageSize);
            if (dbCurrentPage < maxPage) {
                dbCurrentPage++;
                renderDbStudents();
            }
        });
    }

    function renderDbStudents() {
        if (!dbStudentsTableBody) return;
        dbStudentsTableBody.innerHTML = ;
        
        const startIndex = (dbCurrentPage - 1) * dbPageSize;
        const endIndex = Math.min(startIndex + dbPageSize, dbFilteredStudents.length);
        const pageStudents = dbFilteredStudents.slice(startIndex, endIndex);

        btnDbStudentsPrev.disabled = dbCurrentPage === 1;
        btnDbStudentsNext.disabled = endIndex >= dbFilteredStudents.length;

        if (dbFilteredStudents.length === 0) {
            dbStudentsPaginationInfo.textContent = ;
            dbStudentsTableBody.innerHTML = ;
            return;
        }

        dbStudentsPaginationInfo.textContent = ;

        pageStudents.forEach(s => {
            const tr = document.createElement();
            tr.style.borderBottom = ;
            tr.style.height = ;
            
            const stageClean = s.etapa.replace(, ).trim();
            const neeBadge = s.nee ?  : ;

            tr.innerHTML = ;
            dbStudentsTableBody.appendChild(tr);
        });

        const viewButtons = dbStudentsTableBody.querySelectorAll();
        viewButtons.forEach(btn => {
            btn.addEventListener(, () => {
                const mat = btn.getAttribute();
                const student = loadedStudents.find(s => s.matricula === mat);
                if (student) {
                    openStudentModal(student);
                }
            });
        });

        safeCreateIcons();
    }

    function openStudentModal(student) {
        document.getElementById().textContent = student.nome;
        document.getElementById().textContent = ;
        document.getElementById().textContent = student.cpf || ;
        document.getElementById().textContent = student.sexo ===  ?  : (student.sexo ===  ?  : );
        document.getElementById().textContent = student.nascimento || ;
        document.getElementById().textContent = student.cor || ;
        document.getElementById().textContent = student.mae || ;
        document.getElementById().textContent = student.pai || ;
        document.getElementById().textContent = student.endereco || ;
        document.getElementById().textContent = student.cep || ;
        document.getElementById().textContent = student.escola;
        document.getElementById().textContent = student.etapa;
        document.getElementById().textContent = student.data_matricula || ;
        
        const neeField = document.getElementById();
        if (student.nee) {
            neeField.className = ;
            neeField.textContent = student.nee;
        } else {
            neeField.className = ;
            neeField.textContent = ;
        }

        studentModal.classList.remove();
    }

    if (closeStudentModalBtn) {
        closeStudentModalBtn.addEventListener(, () => {
            studentModal.classList.add();
        });
    }

    if (studentModal) {
        studentModal.addEventListener(, (e) => {
            if (e.target === studentModal) {
                studentModal.classList.add();
            }
        });
    }

    
    
    
    const createSchoolModal = document.getElementById();
    const openCreateSchoolBtn = document.getElementById();
    const closeCreateSchoolBtn = document.getElementById();
    const createSchoolForm = document.getElementById();

    const createStudentModal = document.getElementById();
    const openCreateStudentBtn = document.getElementById();
    const closeCreateStudentBtn = document.getElementById();
    const createStudentForm = document.getElementById();
    const newStudentSchoolDropdown = document.getElementById();

    if (openCreateSchoolBtn) {
        openCreateSchoolBtn.addEventListener(, () => {
            createSchoolModal.classList.remove();
        });
    }
    if (closeCreateSchoolBtn) {
        closeCreateSchoolBtn.addEventListener(, () => {
            createSchoolModal.classList.add();
        });
    }
    if (createSchoolModal) {
        createSchoolModal.addEventListener(, (e) => {
            if (e.target === createSchoolModal) createSchoolModal.classList.add();
        });
    }

    if (createSchoolForm) {
        createSchoolForm.addEventListener(, (e) => {
            e.preventDefault();
            const schoolName = document.getElementById().value.trim().toUpperCase();
            const schoolInep = document.getElementById().value.trim();
            const schoolCep = document.getElementById().value.trim();
            const schoolAddress = document.getElementById().value.trim();

            if (!schoolName || !schoolInep) return;

            const schools = Array.from(new Set(loadedStudents.map(s => s.escola)));
            if (!schools.includes(schoolName)) {
                schools.push(schoolName);
                schools.sort();
                
                window.populateSchoolPanelSelector(schools);
                
                const newStudentMatricula =  + Math.floor(1000 + Math.random() * 9000);
                const newStudent = {
                    matricula: newStudentMatricula,
                    nome: ,
                    nascimento: ,
                    sexo: ,
                    cor: ,
                    mae: ,
                    pai: ,
                    endereco: schoolAddress || ,
                    cep: schoolCep || ,
                    nee: ,
                    escola: schoolName,
                    etapa: ,
                    data_matricula: ,
                    cpf: ,
                    avg_score: 75
                };
                loadedStudents.push(newStudent);

                
                dbEscolas.push({
                    id: ,
                    nome: schoolName,
                    rede_id: ,
                    codigo_inep: parseInt(schoolInep) || 0
                });
                dbTurmas.push({
                    id: ,
                    escola_id: ,
                    nome: ,
                    turno: ,
                    ano_letivo: 2026
                });
                dbAlunos.push({
                    id: ,
                    turma_id: ,
                    nome: ,
                    matricula: newStudentMatricula,
                    nee: ,
                    avg_score: 75
                });
                
                const metricStud = document.getElementById();
                if (metricStud) metricStud.textContent = ;
                window.initAlunosTab(schools);
                
                const tenantSelector = document.getElementById();
                if (tenantSelector) {
                    tenantSelector.innerHTML = ;
                    schools.forEach(sch => {
                        const opt = document.createElement();
                        opt.value = sch;
                        opt.textContent = sch;
                        tenantSelector.appendChild(opt);
                    });
                }
                recalculateNetworkStats();
                saveDatabaseState();
                showToast(, );
            } else {
                showToast(, );
            }

            createSchoolForm.reset();
            createSchoolModal.classList.add();
        });
    }

    if (openCreateStudentBtn) {
        openCreateStudentBtn.addEventListener(, () => {
            if (newStudentSchoolDropdown) {
                newStudentSchoolDropdown.innerHTML = ;
                dbEscolas.forEach(esc => {
                    const opt = document.createElement();
                    opt.value = esc.nome;
                    opt.textContent = esc.nome;
                    newStudentSchoolDropdown.appendChild(opt);
                });
            }
            const newStudentClassDropdown = document.getElementById();
            if (newStudentClassDropdown) {
                newStudentClassDropdown.innerHTML = ;
            }
            createStudentModal.classList.remove();
        });
    }

    if (newStudentSchoolDropdown) {
        newStudentSchoolDropdown.addEventListener(, () => {
            const selectedSchoolName = newStudentSchoolDropdown.value;
            const newStudentClassDropdown = document.getElementById();
            if (!newStudentClassDropdown) return;

            newStudentClassDropdown.innerHTML = ;
            
            const schoolObj = dbEscolas.find(e => e.nome === selectedSchoolName);
            if (!schoolObj) {
                newStudentClassDropdown.innerHTML = ;
                return;
            }

            const classes = dbTurmas.filter(t => t.escola_id === schoolObj.id);
            if (classes.length === 0) {
                newStudentClassDropdown.innerHTML = ;
                return;
            }

            newStudentClassDropdown.innerHTML = ;
            classes.forEach(c => {
                const opt = document.createElement();
                opt.value = c.id;
                opt.textContent = ;
                newStudentClassDropdown.appendChild(opt);
            });
        });
    }

    if (closeCreateStudentBtn) {
        closeCreateStudentBtn.addEventListener(, () => {
            createStudentModal.classList.add();
        });
    }
    if (createStudentModal) {
        createStudentModal.addEventListener(, (e) => {
            if (e.target === createStudentModal) createStudentModal.classList.add();
        });
    }

    if (createStudentForm) {
        createStudentForm.addEventListener(, (e) => {
            e.preventDefault();
            const name = document.getElementById().value.trim().toUpperCase();
            const cpf = document.getElementById().value.trim();
            const birth = document.getElementById().value;
            const sexo = document.getElementById().value;
            const color = document.getElementById().value;
            const nee = document.getElementById().value.trim();
            const mae = document.getElementById().value.trim().toUpperCase();
            const pai = document.getElementById().value.trim().toUpperCase();
            const address = document.getElementById().value.trim().toUpperCase();
            const cep = document.getElementById().value.trim();
            const matricula = document.getElementById().value.trim();
            const school = document.getElementById().value;
            const selectedClassId = document.getElementById().value;
            const start = document.getElementById().value;

            if (!name || !matricula || !school || !selectedClassId) {
                showToast(, );
                return;
            }

            const classObj = dbTurmas.find(t => t.id === selectedClassId);
            if (!classObj) return;

            const formatDate = (dateStr) => {
                if (!dateStr) return ;
                const parts = dateStr.split();
                return ;
            };

            const newStudent = {
                matricula,
                nome: name,
                nascimento: formatDate(birth),
                sexo,
                cor: color,
                mae,
                pai,
                endereco: address,
                cep,
                nee,
                escola: school,
                etapa: classObj.serie,
                turma_id: classObj.id,
                data_matricula: formatDate(start),
                cpf
            };

            newStudent.avg_score = 75;
            loadedStudents.push(newStudent);

            dbAlunos.push({
                id: ,
                turma_id: classObj.id,
                nome: name,
                matricula: matricula,
                nee: nee,
                avg_score: 75
            });
            
            recalculateNetworkStats();
            
            const metricStud = document.getElementById();
            if (metricStud) metricStud.textContent = ;
            
            const badgeCount = document.getElementById();
            if (badgeCount) badgeCount.textContent = loadedStudents.length.toLocaleString();
            
            const schools = Array.from(new Set(loadedStudents.map(s => s.escola))).sort();
            window.initAlunosTab(schools);
            
            window.populateSchoolPanelSelector(schools);
            
            initStudentSearch();
            renderRiskGoalsTable();
            renderHeatmapGrid();
            saveDatabaseState();

            showToast(, );
            createStudentForm.reset();
            createStudentModal.classList.add();
        });
    }

    
    const userMenuBtn = document.getElementById();
    const userDropdown = document.getElementById();

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener(, (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle();
        });

        document.addEventListener(, () => {
            userDropdown.classList.add();
        });
    }
    
    const tenantSelectorEl = document.getElementById();
    const sidebarNetworkLabel = document.getElementById();
    if (tenantSelectorEl && sidebarNetworkLabel) {
        tenantSelectorEl.addEventListener(, () => {
            sidebarNetworkLabel.textContent = tenantSelectorEl.options[tenantSelectorEl.selectedIndex].text;
            recalculateNetworkStats();
        });
    }

    
    
    
    const btnResetDb = document.getElementById();
    const resetConfirmModal = document.getElementById();
    const btnCancelReset = document.getElementById();
    const btnConfirmReset = document.getElementById();

    if (btnResetDb && resetConfirmModal) {
        btnResetDb.addEventListener(, () => {
            resetConfirmModal.classList.remove();
        });
    }

    if (btnCancelReset && resetConfirmModal) {
        btnCancelReset.addEventListener(, () => {
            resetConfirmModal.classList.add();
        });
    }

    if (resetConfirmModal) {
        resetConfirmModal.addEventListener(, (e) => {
            if (e.target === resetConfirmModal) resetConfirmModal.classList.add();
        });
    }

    if (btnConfirmReset && resetConfirmModal) {
        btnConfirmReset.addEventListener(, () => {
            resetConfirmModal.classList.add();
            
            
            localStorage.clear();
            dbEscolas = [];
            dbTurmas = [];
            dbAlunos = [];
            dbAvaliacoes = [];
            dbQuestoes = [];
            dbResultadosAluno = [];
            activeEvaluations = [];
            
            activeDescriptors = initInepDescriptors();
            
            saveDatabaseState();
            loadDatabaseState();
            
            renderCreatedEvents();
            renderOngoingAssessments();
            renderActiveDescriptors();
            renderQuestions();
            renderReferenceMatrix();
            showToast(, );
        });
    }

    
    
    
    let manualSchedule = [];

    function generateIACSugestedCalendar(targetIdeb) {
        const cronResult = document.getElementById();
        if (!cronResult) return;
        cronResult.innerHTML = ;

        const val = parseFloat(targetIdeb) || 6.0;
        let intensity = ;
        let tip = ;
        if (val >= 6.5) {
            intensity = ;
            tip = ;
        } else if (val >= 5.8) {
            intensity = ;
            tip = ;
        }

        const headerDiv = document.createElement();
        headerDiv.style.padding = ;
        headerDiv.style.borderRadius = ;
        headerDiv.style.border = ;
        headerDiv.style.background = ;
        headerDiv.style.marginBottom = ;
        headerDiv.innerHTML = ;
        cronResult.appendChild(headerDiv);

        const planWeeks = [
            { w: , lp: , mt: , action: val >= 6.5 ?  :  },
            { w: , lp: , mt: , action: val >= 6.5 ?  :  },
            { w: , lp: , mt: , action:  },
            { w: , type: , title: , action:  },
            { w: , lp: , mt: , action:  },
            { w: , lp: , mt: , action: val >= 6.5 ?  :  },
            { w: , lp: , mt: , action:  },
            { w: , type: , title: , action:  },
            { w: , lp: , mt: , action:  },
            { w: , lp: , mt: , action:  }
        ];

        planWeeks.forEach(week => {
            const row = document.createElement();
            row.style.padding = ;
            row.style.borderRadius = ;
            row.style.border = ;
            row.style.background = week.type ===  ?  : ;
            row.style.display = ;
            row.style.flexDirection = ;
            row.style.gap = ;
            row.style.marginBottom = ;

            if (week.type === ) {
                row.innerHTML = ;
            } else {
                row.innerHTML = ;
            }
            cronResult.appendChild(row);
        });

        safeCreateIcons();
    }

    function populateManualWeeksAndDescriptors() {
        const weekSelect = document.getElementById();
        const descSelect = document.getElementById();
        const subjectSelect = document.getElementById();

        if (weekSelect) {
            weekSelect.innerHTML = ;
            for (let i = 1; i <= 40; i++) {
                const opt = document.createElement();
                opt.value = ;
                opt.textContent = ;
                weekSelect.appendChild(opt);
            }
        }

        function updateDescriptorsDropdown() {
            if (!descSelect || !subjectSelect) return;
            descSelect.innerHTML = ;
            
            const subj = subjectSelect.value;
            if (subj === ) {
                FULL_INEP_MATRICES.portuguese.forEach(d => {
                    const opt = document.createElement();
                    opt.value = ;
                    opt.textContent = ;
                    descSelect.appendChild(opt);
                });
            } else if (subj === ) {
                FULL_INEP_MATRICES.math.forEach(d => {
                    const opt = document.createElement();
                    opt.value = ;
                    opt.textContent = ;
                    descSelect.appendChild(opt);
                });
            } else {
                FULL_INEP_MATRICES.science.forEach(d => {
                    const opt = document.createElement();
                    opt.value = ;
                    opt.textContent = ;
                    descSelect.appendChild(opt);
                });
            }
        }

        if (subjectSelect) {
            subjectSelect.addEventListener(, updateDescriptorsDropdown);
            updateDescriptorsDropdown();
        }
    }

    function renderManualScheduleTable() {
        const tableBody = document.getElementById();
        if (!tableBody) return;
        tableBody.innerHTML = ;

        if (manualSchedule.length === 0) {
            tableBody.innerHTML = ;
            return;
        }

        manualSchedule.sort((a, b) => {
            const numA = parseInt(a.week.replace(/\D/g, )) || 0;
            const numB = parseInt(b.week.replace(/\D/g, )) || 0;
            return numA - numB;
        });

        manualSchedule.forEach((item, idx) => {
            const tr = document.createElement();
            tr.style.borderBottom = ;
            tr.style.height = ;
            tr.innerHTML = ;
            tableBody.appendChild(tr);
        });

        tableBody.querySelectorAll().forEach(btn => {
            btn.addEventListener(, () => {
                const idx = parseInt(btn.getAttribute());
                manualSchedule.splice(idx, 1);
                renderManualScheduleTable();
                showToast(, );
            });
        });

        safeCreateIcons();
    }

    const btnCronIaMode = document.getElementById();
    const btnCronManualMode = document.getElementById();
    const cronIaPanel = document.getElementById();
    const cronManualPanel = document.getElementById();
    const targetIdebInput = document.getElementById();
    const btnAddCronManual = document.getElementById();

    if (btnCronIaMode && btnCronManualMode && cronIaPanel && cronManualPanel) {
        btnCronIaMode.addEventListener(, () => {
            btnCronIaMode.className = ;
            btnCronManualMode.className = ;
            cronIaPanel.classList.remove();
            cronManualPanel.classList.add();
        });

        btnCronManualMode.addEventListener(, () => {
            btnCronManualMode.className = ;
            btnCronIaMode.className = ;
            cronManualPanel.classList.remove();
            cronIaPanel.classList.add();
            renderManualScheduleTable();
        });
    }

    if (targetIdebInput) {
        targetIdebInput.addEventListener(, () => {
            const val = parseFloat(targetIdebInput.value) || 6.0;
            generateIACSugestedCalendar(val.toFixed(1));
            showToast(, );
        });
    }

    if (btnAddCronManual) {
        btnAddCronManual.addEventListener(, () => {
            const week = document.getElementById().value;
            const subject = document.getElementById().value;
            const descriptor = document.getElementById().value;

            const exists = manualSchedule.some(item => item.week === week && item.subject === subject);
            if (exists) {
                showToast(, );
                return;
            }

            manualSchedule.push({ week, subject, descriptor });
            renderManualScheduleTable();
            showToast(, );
        });
    }

    
    
    
    function populateQuestionCreatorDropdowns() {
        const iaSelect = document.getElementById();
        const manualSelect = document.getElementById();
        if (!iaSelect || !manualSelect) return;

        iaSelect.innerHTML = ;
        manualSelect.innerHTML = ;

        const allDescs = [];
        FULL_INEP_MATRICES.portuguese.forEach(d => allDescs.push({ code: d.codigo, text:  }));
        FULL_INEP_MATRICES.math.forEach(d => allDescs.push({ code: d.codigo, text:  }));
        FULL_INEP_MATRICES.science.forEach(d => allDescs.push({ code: d.codigo, text:  }));

        allDescs.forEach(d => {
            const opt1 = document.createElement();
            opt1.value = d.code;
            opt1.textContent = d.text.slice(0, 70) + (d.text.length > 70 ?  : );
            iaSelect.appendChild(opt1);

            const opt2 = document.createElement();
            opt2.value = d.code;
            opt2.textContent = d.text.slice(0, 70) + (d.text.length > 70 ?  : );
            manualSelect.appendChild(opt2);
        });
    }

    const btnAddQIa = document.getElementById();
    const btnAddQPdf = document.getElementById();
    const btnAddQManual = document.getElementById();

    const panelAddQIa = document.getElementById();
    const panelAddQPdf = document.getElementById();
    const panelAddQManual = document.getElementById();

    function resetAddQTabs() {
        [btnAddQIa, btnAddQPdf, btnAddQManual].forEach(btn => {
            if (btn) {
                btn.style.color = ;
                btn.style.fontWeight = ;
                btn.style.borderBottom = ;
            }
        });
        [panelAddQIa, panelAddQPdf, panelAddQManual].forEach(p => {
            if (p) p.classList.add();
        });
    }

    if (btnAddQIa) {
        btnAddQIa.onclick = () => {
            resetAddQTabs();
            btnAddQIa.style.color = ;
            btnAddQIa.style.fontWeight = ;
            btnAddQIa.style.borderBottom = ;
            panelAddQIa.classList.remove();
        };
    }
    if (btnAddQPdf) {
        btnAddQPdf.onclick = () => {
            resetAddQTabs();
            btnAddQPdf.style.color = ;
            btnAddQPdf.style.fontWeight = ;
            btnAddQPdf.style.borderBottom = ;
            panelAddQPdf.classList.remove();
        };
    }
    if (btnAddQManual) {
        btnAddQManual.onclick = () => {
            resetAddQTabs();
            btnAddQManual.style.color = ;
            btnAddQManual.style.fontWeight = ;
            btnAddQManual.style.borderBottom = ;
            panelAddQManual.classList.remove();
        };
    }

    const btnGenerateQIa = document.getElementById();
    if (btnGenerateQIa) {
        btnGenerateQIa.onclick = () => {
            const descCode = document.getElementById().value;
            const difficulty = document.getElementById().value;

            let comp = ;
            const isLP = FULL_INEP_MATRICES.portuguese.some(d => d.codigo === descCode);
            comp = isLP ?  : ;
            if (descCode.startsWith()) comp = ;

            const simulatedTexts = {
                D1: {
                    enunciado: ,
                    pergunta: ,
                    ops: [, , , ],
                    correta: 
                },
                D2: {
                    enunciado: ,
                    pergunta: ,
                    ops: [, , , ],
                    correta: 
                },
                D13: {
                    enunciado: ,
                    pergunta: ,
                    ops: [, , , ],
                    correta: 
                },
                default: {
                    enunciado: ,
                    pergunta: ,
                    ops: [, , , ],
                    correta: 
                }
            };

            const qData = simulatedTexts[descCode] || simulatedTexts.default;

            const newQ = {
                id: ,
                descritor: descCode,
                codigo_bncc: descCode,
                componente: comp,
                dificuldade: difficulty,
                nivel_bloom: ,
                enunciado: qData.enunciado + (qData.pergunta ?  + qData.pergunta : ),
                alternativas: qData.ops,
                correta: qData.correta,
                justificativa: 
            };
            rawQuestions.unshift(newQ);

            dbQuestoes.push({
                id: newQ.id,
                avaliacao_id: ,
                descritor_bncc_id: newQ.codigo_bncc,
                nivel_dificuldade: newQ.dificuldade
            });

            renderQuestions();
            showToast(, );
        };
    }

    const pdfFileInput = document.getElementById();
    const pdfDropzone = document.getElementById();
    const pdfFileInfo = document.getElementById();
    const btnImportQPdf = document.getElementById();

    if (pdfDropzone && pdfFileInput) {
        pdfDropzone.onclick = () => pdfFileInput.click();
        pdfFileInput.onchange = () => {
            if (pdfFileInput.files.length > 0) {
                pdfFileInfo.textContent = ;
                pdfFileInfo.style.display = ;
            }
        };
    }

    if (btnImportQPdf) {
        btnImportQPdf.onclick = () => {
            if (!pdfFileInput.files || pdfFileInput.files.length === 0) {
                showToast(, );
                return;
            }

            const mockQuestionsFromPdf = [
                {
                    id: ,
                    descritor: ,
                    codigo_bncc: ,
                    componente: ,
                    dificuldade: ,
                    nivel_bloom: ,
                    enunciado: ,
                    alternativas: [, , , ],
                    correta: ,
                    justificativa: 
                },
                {
                    id: ,
                    descritor: ,
                    codigo_bncc: ,
                    componente: ,
                    dificuldade: ,
                    nivel_bloom: ,
                    enunciado: ,
                    alternativas: [, , , ],
                    correta: ,
                    justificativa: 
                }
            ];

            mockQuestionsFromPdf.forEach(q => {
                rawQuestions.unshift(q);
                dbQuestoes.push({
                    id: q.id,
                    avaliacao_id: ,
                    descritor_bncc_id: q.codigo_bncc,
                    nivel_dificuldade: q.dificuldade
                });
            });
            renderQuestions();

            pdfFileInput.value = ;
            pdfFileInfo.style.display = ;
            showToast(, );
        };
    }

    const btnSaveQManual = document.getElementById();
    if (btnSaveQManual) {
        btnSaveQManual.onclick = () => {
            const descCode = document.getElementById().value;
            const difficulty = document.getElementById().value;
            const text = document.getElementById().value.trim();
            const opA = document.getElementById().value.trim();
            const opB = document.getElementById().value.trim();
            const opC = document.getElementById().value.trim();
            const opD = document.getElementById().value.trim();
            const correct = document.getElementById().value;

            if (!text || !opA || !opB || !opC || !opD) {
                showToast(, );
                return;
            }

            let comp = ;
            const isLP = FULL_INEP_MATRICES.portuguese.some(d => d.codigo === descCode);
            comp = isLP ?  : ;
            if (descCode.startsWith()) comp = ;

            const newQ = {
                id: ,
                descritor: descCode,
                codigo_bncc: descCode,
                componente: comp,
                dificuldade: difficulty,
                nivel_bloom: ,
                enunciado: text,
                alternativas: [, , , ],
                correta: correct,
                justificativa: 
            };
            rawQuestions.unshift(newQ);

            dbQuestoes.push({
                id: newQ.id,
                avaliacao_id: ,
                descritor_bncc_id: newQ.codigo_bncc,
                nivel_dificuldade: newQ.dificuldade
            });

            renderQuestions();
            
            document.getElementById().value = ;
            document.getElementById().value = ;
            document.getElementById().value = ;
            document.getElementById().value = ;
            document.getElementById().value = ;

            showToast(, );
        };
    }

    
    
    
    const schoolClassesModal = document.getElementById();
    const closeClassesModalBtn = document.getElementById();
    const modalClassesSchoolName = document.getElementById();
    const btnToggleNewClassForm = document.getElementById();
    const newClassFormContainer = document.getElementById();
    const createClassForm = document.getElementById();
    const btnCancelNewClass = document.getElementById();
    const modalClassesTableBody = document.getElementById();
    const newClassFormTitle = document.getElementById();
    const classEditIdInput = document.getElementById();

    let currentClassesSchoolName = ;

    function openSchoolClassesModal(schoolName) {
        if (!schoolClassesModal) return;
        currentClassesSchoolName = schoolName;
        modalClassesSchoolName.textContent = ;
        
        resetClassForm();
        renderSchoolClassesTable();

        schoolClassesModal.classList.remove();
        safeCreateIcons();
    }

    function closeSchoolClassesModal() {
        if (schoolClassesModal) schoolClassesModal.classList.add();
    }

    if (closeClassesModalBtn) closeClassesModalBtn.addEventListener(, closeSchoolClassesModal);
    if (schoolClassesModal) {
        schoolClassesModal.addEventListener(, (e) => {
            if (e.target === schoolClassesModal) closeSchoolClassesModal();
        });
    }

    if (btnToggleNewClassForm) {
        btnToggleNewClassForm.addEventListener(, () => {
            newClassFormContainer.classList.toggle();
        });
    }

    if (btnCancelNewClass) {
        btnCancelNewClass.addEventListener(, () => {
            resetClassForm();
        });
    }

    function resetClassForm() {
        if (createClassForm) createClassForm.reset();
        if (classEditIdInput) classEditIdInput.value = ;
        if (newClassFormTitle) newClassFormTitle.textContent = ;
        if (newClassFormContainer) newClassFormContainer.classList.add();
    }

    function renderSchoolClassesTable() {
        if (!modalClassesTableBody) return;
        modalClassesTableBody.innerHTML = ;

        const schoolObj = dbEscolas.find(e => e.nome === currentClassesSchoolName);
        if (!schoolObj) {
            modalClassesTableBody.innerHTML = ;
            return;
        }

        const classes = dbTurmas.filter(t => t.escola_id === schoolObj.id);
        if (classes.length === 0) {
            modalClassesTableBody.innerHTML = ;
            return;
        }

        classes.forEach(c => {
            const studentsCount = dbAlunos.filter(al => al.turma_id === c.id).length;

            const tr = document.createElement();
            tr.style.borderBottom = ;
            tr.style.height = ;

            tr.innerHTML = ;

            modalClassesTableBody.appendChild(tr);
        });

        const editBtns = modalClassesTableBody.querySelectorAll();
        editBtns.forEach(btn => {
            btn.addEventListener(, () => {
                const id = btn.getAttribute();
                const cObj = dbTurmas.find(t => t.id === id);
                if (cObj) {
                    classEditIdInput.value = cObj.id;
                    document.getElementById().value = cObj.nome;
                    document.getElementById().value = cObj.serie;
                    document.getElementById().value = cObj.turno;
                    document.getElementById().value = cObj.ano_letivo;
                    
                    newClassFormTitle.textContent = ;
                    newClassFormContainer.classList.remove();
                }
            });
        });

        const deleteBtns = modalClassesTableBody.querySelectorAll();
        deleteBtns.forEach(btn => {
            btn.addEventListener(, () => {
                const id = btn.getAttribute();
                if (confirm()) {
                    dbTurmas = dbTurmas.filter(t => t.id !== id);
                    dbAlunos.forEach(al => {
                        if (al.turma_id === id) al.turma_id = null;
                    });
                    showToast(, );
                    renderSchoolClassesTable();
                    recalculateNetworkStats();
                    renderDbSchools();
                    saveDatabaseState();
                }
            });
        });

        safeCreateIcons();
    }

    if (createClassForm) {
        createClassForm.addEventListener(, (e) => {
            e.preventDefault();
            const editId = classEditIdInput.value;
            const name = document.getElementById().value.trim();
            const stage = document.getElementById().value;
            const shift = document.getElementById().value;
            const year = parseInt(document.getElementById().value);

            const schoolObj = dbEscolas.find(e => e.nome === currentClassesSchoolName);
            if (!schoolObj) return;

            if (editId) {
                const cObj = dbTurmas.find(t => t.id === editId);
                if (cObj) {
                    cObj.nome = name;
                    cObj.serie = stage;
                    cObj.turno = shift;
                    cObj.ano_letivo = year;
                    showToast(, );
                }
            } else {
                dbTurmas.push({
                    id: ,
                    escola_id: schoolObj.id,
                    nome: name,
                    serie: stage,
                    turno: shift,
                    ano_letivo: year
                });
                showToast(, );
            }
            resetClassForm();
            renderSchoolClassesTable();
            recalculateNetworkStats();
            renderDbSchools();
            saveDatabaseState();
        });
    }

    
    function populateInterventionPlansSelectors() {
        const schoolSelect = document.getElementById();
        const classSelect = document.getElementById();
        if (!schoolSelect || !classSelect) return;

        schoolSelect.innerHTML = ;
        dbEscolas.forEach(s => {
            const opt = document.createElement();
            opt.value = s.nome;
            opt.textContent = s.nome;
            schoolSelect.appendChild(opt);
        });

        schoolSelect.removeEventListener(, updatePlanClasses);
        schoolSelect.addEventListener(, updatePlanClasses);

        classSelect.removeEventListener(, renderPedagogicPlansForClass);
        classSelect.addEventListener(, renderPedagogicPlansForClass);

        renderPedagogicPlansForClass();
    }

    function updatePlanClasses() {
        const schoolSelect = document.getElementById();
        const classSelect = document.getElementById();
        if (!schoolSelect || !classSelect) return;

        const schoolName = schoolSelect.value;
        classSelect.innerHTML = ;

        const schoolObj = dbEscolas.find(e => e.nome === schoolName);
        if (schoolObj) {
            const classes = dbTurmas.filter(t => t.escola_id === schoolObj.id);
            classes.forEach(c => {
                const opt = document.createElement();
                opt.value = c.id;
                opt.textContent = ;
                classSelect.appendChild(opt);
            });
        }
        renderPedagogicPlansForClass();
    }

    function renderPedagogicPlansForClass() {
        const container = document.getElementById();
        if (!container) return;
        container.innerHTML = ;

        const schoolSelect = document.getElementById();
        const classSelect = document.getElementById();
        const schoolName = schoolSelect ? schoolSelect.value : ;
        const classId = classSelect ? classSelect.value : ;

        if (!schoolName || !classId) {
            container.innerHTML = ;
            safeCreateIcons();
            return;
        }

        const stats = getBNCCCriticalSkills(, schoolName, classId, );
        const criticals = stats.filter(s => s.total > 0 && s.percent < 70);

        if (criticals.length === 0) {
            container.innerHTML = ;
            safeCreateIcons();
            return;
        }

        criticals.forEach(stat => {
            const isLP = stat.codigo.includes() || stat.codigo.startsWith();
            const compName = isLP ?  : ;
            const badgeClass = stat.percent < 50 ?  : ;
            const totalClassStudents = dbAlunos.filter(al => al.turma_id === classId).length;
            const affectedStudents = Math.round(totalClassStudents * (1 - stat.percent / 100));

            const planCard = document.createElement();
            planCard.className = ;
            planCard.style.border = ;
            planCard.style.padding = ;
            planCard.style.borderRadius = ;
            planCard.style.background = ;
            planCard.style.display = ;
            planCard.style.flexDirection = ;
            planCard.style.justifyContent = ;
            planCard.style.height = ;

            let planTitle = ;
            let planDesc = ;
            if (stat.codigo.includes()) {
                planTitle = ;
                planDesc = ;
            } else if (stat.codigo.includes() || stat.codigo.includes()) {
                planTitle = ;
                planDesc = ;
            } else if (stat.codigo.includes()) {
                planTitle = ;
                planDesc = ;
            }

            const planKey = ;
            pedagogicPlansData[planKey] = {
                title: planTitle,
                meta: ,
                body: 
            };

            planCard.innerHTML = ;
            container.appendChild(planCard);
        });

        safeCreateIcons();
    }

    
    
    
    let selectedIdebCity = ;

    function initIdebComparativo() {
        const stateSelect = document.getElementById();
        const citySearchInput = document.getElementById();
        const suggestionsBox = document.getElementById();
        const stageSelect = document.getElementById();

        if (!stateSelect || !citySearchInput || !suggestionsBox || !stageSelect) return;

        
        const states = Array.from(new Set(window.idebPublicoReferencia.map(item => item.uf))).sort();
        stateSelect.innerHTML = ;
        states.forEach(uf => {
            const opt = document.createElement();
            opt.value = uf;
            opt.textContent = uf ===  ?  : uf;
            stateSelect.appendChild(opt);
        });

        
        stateSelect.value = ;
        selectedIdebCity = ;
        citySearchInput.value = ;

        
        function renderSuggestions(filterText = ) {
            const selectedUf = stateSelect.value;
            let filteredCities = Array.from(new Set(
                window.idebPublicoReferencia
                    .filter(item => item.uf === selectedUf)
                    .map(item => item.municipio)
            )).sort();

            
            const stateAvgIdx = filteredCities.findIndex(c => c.includes());
            if (stateAvgIdx > -1) {
                const stateAvg = filteredCities.splice(stateAvgIdx, 1)[0];
                filteredCities.unshift(stateAvg);
            }

            
            if (filterText) {
                const query = filterText.toLowerCase();
                filteredCities = filteredCities.filter(c => c.toLowerCase().includes(query));
            }

            suggestionsBox.innerHTML = ;
            
            if (filteredCities.length === 0) {
                const emptyDiv = document.createElement();
                emptyDiv.style.padding = ;
                emptyDiv.style.color = ;
                emptyDiv.style.fontSize = ;
                emptyDiv.textContent = ;
                suggestionsBox.appendChild(emptyDiv);
                return;
            }

            filteredCities.forEach(city => {
                const div = document.createElement();
                div.style.padding = ;
                div.style.cursor = ;
                div.style.fontSize = ;
                div.style.color = ;
                div.style.borderBottom = ;
                div.style.transition = ;
                div.textContent = city;
                
                div.addEventListener(, () => {
                    div.style.backgroundColor = ;
                });
                div.addEventListener(, () => {
                    div.style.backgroundColor = ;
                });
                div.addEventListener(, () => {
                    citySearchInput.value = city;
                    selectedIdebCity = city;
                    suggestionsBox.classList.add();
                    updateIdebComparativoView();
                });
                suggestionsBox.appendChild(div);
            });
        }

        
        citySearchInput.addEventListener(, () => {
            suggestionsBox.classList.remove();
            renderSuggestions(citySearchInput.value);
        });

        
        citySearchInput.addEventListener(, (e) => {
            suggestionsBox.classList.remove();
            renderSuggestions(e.target.value);
        });

        
        stateSelect.addEventListener(, () => {
            const selectedUf = stateSelect.value;
            if (selectedUf === ) {
                selectedIdebCity = ;
            } else if (selectedUf === ) {
                selectedIdebCity = ;
            } else {
                const first = window.idebPublicoReferencia.find(item => item.uf === selectedUf);
                selectedIdebCity = first ? first.municipio : ;
            }
            citySearchInput.value = selectedIdebCity;
            suggestionsBox.classList.add();
            updateIdebComparativoView();
        });

        
        stageSelect.addEventListener(, updateIdebComparativoView);

        
        document.addEventListener(, (e) => {
            if (!citySearchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
                suggestionsBox.classList.add();
            }
        });

        
        updateIdebComparativoView();
    }

    function updateIdebComparativoView() {
        const stateSelect = document.getElementById();
        const citySearchInput = document.getElementById();
        const stageSelect = document.getElementById();

        if (!stateSelect || !citySearchInput || !stageSelect) return;

        const uf = stateSelect.value;
        const city = selectedIdebCity;
        const stage = stageSelect.value;

        const emptyState = document.getElementById();
        const resultsContainer = document.getElementById();

        
        const records = window.idebPublicoReferencia.filter(r => 
            r.uf === uf && r.municipio === city && r.etapa === stage
        ).sort((a, b) => a.ano - b.ano);

        if (records.length === 0) {
            if (emptyState) emptyState.classList.remove();
            if (resultsContainer) resultsContainer.classList.add();
            return;
        }

        if (emptyState) emptyState.classList.add();
        if (resultsContainer) resultsContainer.classList.remove();

        
        const latestRecord = records.find(r => r.ano === 2023) || records[records.length - 1];

        
        const kpiObserved = document.getElementById();
        const kpiTarget = document.getElementById();
        const kpiStatusContainer = document.getElementById();
        const kpiStatusText = document.getElementById();

        if (kpiObserved) kpiObserved.textContent = latestRecord.ideb_observado !== null ? latestRecord.ideb_observado.toFixed(1) : ;
        if (kpiTarget) kpiTarget.textContent = latestRecord.meta_projetada !== null ? latestRecord.meta_projetada.toFixed(1) : ;

        if (latestRecord.ideb_observado !== null && latestRecord.meta_projetada !== null) {
            const diff = latestRecord.ideb_observado - latestRecord.meta_projetada;
            const met = diff >= 0;

            if (kpiStatusContainer) {
                kpiStatusContainer.innerHTML = met 
                    ? 
                    : ;
            }

            if (kpiStatusText) {
                kpiStatusText.textContent = met 
                    ? 
                    : ;
            }
        } else {
            if (kpiStatusContainer) kpiStatusContainer.innerHTML = ;
            if (kpiStatusText) kpiStatusText.textContent = ;
        }

        
        renderIdebSvgChart(records);

        
        const projVal = document.getElementById();
        const projDesc = document.getElementById();

        if (latestRecord.ideb_observado !== null) {
            
            const stateRecords2023 = window.idebPublicoReferencia.filter(r => 
                r.uf === uf && r.ano === 2023 && r.etapa === stage && !r.municipio.includes() && r.municipio !== 
            );

            let metCount = 0;
            let totalCount = 0;
            stateRecords2023.forEach(r => {
                if (r.ideb_observado !== null && r.meta_projetada !== null) {
                    totalCount++;
                    if (r.ideb_observado >= r.meta_projetada) metCount++;
                }
            });

            
            const metRatio = totalCount > 0 ? (metCount / totalCount) : 0.5;
            let growthFactor = 0.2; 
            let trajectory = ;

            if (latestRecord.ideb_observado >= latestRecord.meta_projetada) {
                growthFactor = uf ===  ? 0.35 : 0.25;
                trajectory = ;
            } else {
                growthFactor = 0.15;
                trajectory = ;
            }

            const projectedIdeb = latestRecord.ideb_observado + growthFactor;

            if (projVal) projVal.textContent = projectedIdeb.toFixed(2);
            if (projDesc) {
                projDesc.textContent = ;
            }
        } else {
            if (projVal) projVal.textContent = ;
            if (projDesc) projDesc.textContent = ;
        }

        
        renderIdebRankingTable(uf, stage, city);

        safeCreateIcons();
    }

    function renderIdebSvgChart(records) {
        const container = document.getElementById();
        if (!container) return;

        const years = records.map(r => r.ano);
        const observed = records.map(r => r.ideb_observado || 0);
        const targets = records.map(r => r.meta_projetada || 0);

        const width = 550;
        const height = 240;
        const paddingLeft = 40;
        const paddingRight = 20;
        const paddingTop = 25;
        const paddingBottom = 35;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        const allVals = [...observed, ...targets].filter(v => v > 0);
        const maxVal = allVals.length > 0 ? Math.max(...allVals) + 0.5 : 10;
        const minVal = allVals.length > 0 ? Math.max(0, Math.min(...allVals) - 1.0) : 0;

        function getX(index) {
            if (years.length <= 1) return paddingLeft + chartWidth / 2;
            return paddingLeft + (index / (years.length - 1)) * chartWidth;
        }

        function getY(val) {
            if (val === 0) return paddingTop + chartHeight;
            return paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
        }

        let svgHtml = ;

        const steps = 4;
        for (let j = 0; j <= steps; j++) {
            const val = minVal + (j / steps) * (maxVal - minVal);
            const y = getY(val);
            svgHtml += ;
            svgHtml += ;
        }

        years.forEach((yr, idx) => {
            const x = getX(idx);
            svgHtml += ;
        });

        let obsPointsPath = ;
        let tgtPointsPath = ;

        observed.forEach((val, idx) => {
            if (val > 0) {
                const x = getX(idx);
                const y = getY(val);
                obsPointsPath += (obsPointsPath ===  ?  : ) + ;
            }
        });

        targets.forEach((val, idx) => {
            if (val > 0) {
                const x = getX(idx);
                const y = getY(val);
                tgtPointsPath += (tgtPointsPath ===  ?  : ) + ;
            }
        });

        if (tgtPointsPath !== ) {
            svgHtml += ;
        }

        if (obsPointsPath !== ) {
            svgHtml += ;
        }

        observed.forEach((val, idx) => {
            if (val > 0) {
                const x = getX(idx);
                const y = getY(val);
                svgHtml += ;
                svgHtml += ;
                svgHtml += ;
            }
        });

        targets.forEach((val, idx) => {
            if (val > 0) {
                const x = getX(idx);
                const y = getY(val);
                svgHtml += ;
                const obsVal = observed[idx];
                const textY = (obsVal && Math.abs(obsVal - val) < 0.3 && obsVal > val) ? y + 16 : y - 12;
                svgHtml += ;
            }
        });

        svgHtml += ;
        container.innerHTML = svgHtml;
    }

    function renderIdebRankingTable(uf, stage, currentCity) {
        const tableBody = document.getElementById();
        const cityCountEl = document.getElementById();
        if (!tableBody) return;

        tableBody.innerHTML = ;

        const candidates = window.idebPublicoReferencia.filter(r => 
            r.uf === uf && r.ano === 2023 && r.etapa === stage && 
            !r.municipio.includes() && r.municipio !== 
        );

        candidates.sort((a, b) => {
            const obsA = a.ideb_observado !== null ? a.ideb_observado : -1;
            const obsB = b.ideb_observado !== null ? b.ideb_observado : -1;
            return obsB - obsA;
        });

        if (cityCountEl) cityCountEl.textContent = ;

        if (candidates.length === 0) {
            tableBody.innerHTML = ;
            return;
        }

        candidates.forEach((c, idx) => {
            const isSelected = c.municipio === currentCity;
            const tr = document.createElement();
            
            if (isSelected) {
                tr.style.backgroundColor = ;
                tr.style.fontWeight = ;
                tr.style.borderLeft = ;
            } else {
                tr.style.borderBottom = ;
            }
            tr.style.height = ;

            const obsText = c.ideb_observado !== null ? c.ideb_observado.toFixed(1) : ;
            const tgtText = c.meta_projetada !== null ? c.meta_projetada.toFixed(1) : ;

            let statusBadge = ;
            if (c.ideb_observado !== null && c.meta_projetada !== null) {
                statusBadge = (c.ideb_observado >= c.meta_projetada)
                    ? 
                    : ;
            }

            tr.innerHTML = ;

            tableBody.appendChild(tr);
        });
    }

    
    
    const mobileMenuToggle = document.getElementById();
    const mobileMenuClose = document.getElementById();
    const sidebar = document.querySelector();

    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener(, () => {
            sidebar.classList.add();
        });
    }

    if (mobileMenuClose && sidebar) {
        mobileMenuClose.addEventListener(, () => {
            sidebar.classList.remove();
        });
    }

    const mobileMenuItems = document.querySelectorAll();
    mobileMenuItems.forEach(item => {
        item.addEventListener(, () => {
            if (window.innerWidth <= 1024 && sidebar) {
                sidebar.classList.remove();
            }
        });
    });

    
    loadDatabaseState();
    renderCreatedEvents();
    renderOngoingAssessments();
    renderActiveDescriptors();
    renderQuestions();
    renderReferenceMatrix();
    generateIACSugestedCalendar(6.0);
    populateManualWeeksAndDescriptors();
    renderManualScheduleTable();
    populateQuestionCreatorDropdowns();
    initIdebComparativo();
});

