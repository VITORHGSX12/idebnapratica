const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType
} = require('docx');

async function generateDocx() {
  const primaryColor = '1E3A8A'; // Deep Navy Blue
  const secondaryColor = '0D9488'; // Teal
  const darkTextColor = '1F2937'; // Slate Dark
  const lightBgColor = 'F3F4F6'; // Light Gray
  const borderNavy = '2563EB';

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: [
          // Header / Institutional Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'SECRETARIA MUNICIPAL DE EDUCAÇÃO - SEMED',
                bold: true,
                size: 24,
                color: primaryColor,
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: 'PREFEITURA MUNICIPAL DE GONÇALVES DIAS - MA',
                size: 20,
                color: '4B5563',
                font: 'Calibri'
              }),
              new TextRun({
                text: '\nPLATAFORMA EDUCACIONAL IDEB NA PRÁTICA',
                bold: true,
                size: 22,
                color: secondaryColor,
                font: 'Calibri'
              })
            ]
          }),

          // Divider Line Box
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            border: {
              bottom: {
                color: borderNavy,
                space: 4,
                style: BorderStyle.SINGLE,
                size: 12
              }
            },
            children: [
              new TextRun({
                text: 'COMUNICADO TÉCNICO E INFORMATIVO Nº 01/2026',
                bold: true,
                size: 26,
                color: primaryColor,
                font: 'Calibri'
              })
            ]
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            spacing: { after: 300 },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { fill: lightBgColor, type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Para:',
                            bold: true,
                            size: 20,
                            font: 'Calibri',
                            color: darkTextColor
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Gestão Educacional, Equipe Pedagógica, Diretores e Professores',
                            size: 20,
                            font: 'Calibri',
                            color: darkTextColor
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { fill: lightBgColor, type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Assunto:',
                            bold: true,
                            size: 20,
                            font: 'Calibri',
                            color: darkTextColor
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Estabilização de Conexão, Conclusão de Auditoria de Segurança e Monitoramento Contínuo',
                            bold: true,
                            size: 20,
                            font: 'Calibri',
                            color: darkTextColor
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { fill: lightBgColor, type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Data:',
                            bold: true,
                            size: 20,
                            font: 'Calibri',
                            color: darkTextColor
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '12 de Setembro de 2026',
                            size: 20,
                            font: 'Calibri',
                            color: darkTextColor
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          // Section 1: Contexto
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: '1. Contexto e Esclarecimento sobre Relatos de Instabilidade',
                bold: true,
                size: 22,
                color: primaryColor,
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 160, line: 276 },
            children: [
              new TextRun({
                text: 'Prezados Gestores e Educadores,\n\n',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              }),
              new TextRun({
                text: 'Informamos que foi identificado e completamente solucionado um ajuste de infraestrutura de rede que afetou a sincronização de dados da plataforma ',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              }),
              new TextRun({
                text: 'IDEB na Prática',
                bold: true,
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              }),
              new TextRun({
                text: ' entre os dias ',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              }),
              new TextRun({
                text: '12 de agosto de 2026 e 12 de setembro de 2026 (~31 dias)',
                bold: true,
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              }),
              new TextRun({
                text: '.',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 160, line: 276 },
            children: [
              new TextRun({
                text: 'Durante esse intervalo, a comunicação entre o endereço de acesso web e os serviços de processamento em nuvem apresentou interrupções intermitentes. Essa oscilação explica eventuais relatos pontuais de usuários sobre lentidão no salvamento de formulários, dificuldades momentâneas de login ou mensagens de erro de sincronização.',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              })
            ]
          }),

          // Section 2: Resolução
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: '2. Diagnóstico e Resolução Técnica',
                bold: true,
                size: 22,
                color: primaryColor,
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 160, line: 276 },
            children: [
              new TextRun({
                text: 'A causa raiz foi uma divergência de apontamento no roteamento de nuvem após uma modernização dos servidores. O ajuste foi executado, testado e validado em ambiente de produção com 100% de sucesso. A plataforma encontra-se ',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              }),
              new TextRun({
                text: 'plenamente estabilizada, com tempos de resposta imediatos e conexões seguras restabelecidas.',
                bold: true,
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              })
            ]
          }),

          // Section 3: Monitoramento
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: '3. Implantação de Monitoramento Automático em Tempo Real',
                bold: true,
                size: 22,
                color: primaryColor,
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 160, line: 276 },
            children: [
              new TextRun({
                text: 'Para assegurar máxima confiabilidade e prevenir qualquer recorrência futura, foi ativado um sistema de ',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              }),
              new TextRun({
                text: 'monitoramento contínuo de disponibilidade (Health Check)',
                bold: true,
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              }),
              new TextRun({
                text: '. Esse mecanismo testa automaticamente a integridade do sistema a cada 30 minutos e dispara alertas automáticos e instantâneos para a equipe técnica caso qualquer instabilidade venha a ocorrer, garantindo atendimento em minutos e não mais em dias ou semanas.',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              })
            ]
          }),

          // Section 4: Conclusão da Auditoria de Segurança
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: '4. Conclusão da Auditoria Abrangente de Segurança e LGPD',
                bold: true,
                size: 22,
                color: primaryColor,
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 160, line: 276 },
            children: [
              new TextRun({
                text: 'Paralelamente à correção de estabilidade, foi concluído com êxito um ciclo rigoroso de ',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              }),
              new TextRun({
                text: 'auditoria de segurança da informação',
                bold: true,
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              }),
              new TextRun({
                text: '. Foram implementadas camadas adicionais de proteção de dados, controle de acesso estrito e criptografia de ponta a ponta para blindar os cadastros de alunos, notas e informações escolares, em conformidade com as melhores práticas institucionais e regulatórias.',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              })
            ]
          }),

          // Section 5: Orientações
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: '5. Orientações aos Usuários',
                bold: true,
                size: 22,
                color: primaryColor,
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 360, line: 276 },
            children: [
              new TextRun({
                text: '• Os usuários podem continuar utilizando a plataforma normalmente pelo link oficial.\n',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              }),
              new TextRun({
                text: '• Não é necessária nenhuma ação técnica por parte dos professores ou gestores.\n',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              }),
              new TextRun({
                text: '• Caso algum usuário tenha deixado de registrar alguma informação no período citado, recomendamos verificar se seus lançamentos foram concluídos com sucesso.\n',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              }),
              new TextRun({
                text: '• O canal de suporte técnico da SEMED permanece à disposição para qualquer auxílio.',
                font: 'Calibri',
                size: 21,
                color: darkTextColor
              })
            ]
          }),

          // Signature Block
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 60 },
            children: [
              new TextRun({
                text: 'EQUIPE TÉCNICA E DE TECNOLOGIA EDUCACIONAL',
                bold: true,
                size: 20,
                color: primaryColor,
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Plataforma IDEB na Prática | SEMED Gonçalves Dias - MA',
                size: 18,
                color: '6B7280',
                font: 'Calibri'
              })
            ]
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '..', 'COMUNICADO_INSTABILIDADE_E_AUDITORIA_SEMED.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Documento Word gerado com sucesso em: ${outputPath}`);
}

generateDocx().catch(err => {
  console.error('Erro ao gerar docx:', err);
  process.exit(1);
});
