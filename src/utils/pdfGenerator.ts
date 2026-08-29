import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { ExtractedData } from "@/types";

export async function generateContractsPdf(dataList: ExtractedData[]): Promise<Buffer[]> {
  const logoPath = path.join(process.cwd(), "public", "logo.png");

  const generateSinglePdf = (data: ExtractedData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        if (fs.existsSync(logoPath)) {
          const startY = doc.y;
          
          doc.image(logoPath, doc.page.margins.left, startY, {
            width: 150
          });

          const rightWidth = 250;
          const rightX = doc.page.width - doc.page.margins.right - rightWidth;
          const lineY = startY + 15;
          
          doc.lineWidth(1);
          doc.strokeColor("#D9534F");
          doc.moveTo(rightX, lineY).lineTo(rightX + rightWidth, lineY).stroke();
          
          doc.fillColor("black");
          doc.font("Helvetica-Bold").fontSize(10).text("MEDPRIME CLÍNICA GESTÃO E SAÚDE S.A", rightX, lineY + 6, { width: rightWidth, align: "right" });
          doc.font("Helvetica").fontSize(9).text("CNPJ. 23.481.981/0001-31", rightX, doc.y + 2, { width: rightWidth, align: "right" });

          doc.y = Math.max(doc.y, startY + 60);
          doc.x = doc.page.margins.left;
          doc.moveDown(2);
        }

        doc.font("Helvetica-Bold").fontSize(14).text(
          "CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS TÉCNICOS POR MEIO DE ASSOCIAÇÃO", 
          doc.page.margins.left, 
          doc.y, 
          { align: "center", width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
        );
        doc.moveDown(1.5);

        doc.font("Helvetica").fontSize(11).text(
          "De um lado MEDPRIME CLÍNICA GESTÃO E SAÚDE S/A, pessoa jurídica de direito privado, regularmente inscrita no CNPJ/MF sob o nº 23.481.981/0001-31, com sede na Rua Cajubi, nº 23, Bairro Santa Felicidade, CEP 82.015-130, em Curitiba/PR, neste ato representada nos termos do seu estatuto social por seu Diretor Presidente, Sr. LUÍS SILVA DOS SANTOS, brasileiro, empresário, portador do RG n° 6.159.215-6 PR e inscrito no CPF/MF sob o nº 922.284.109-34, de ora em diante denominada apenas MEDPRIME e de outro lado ", 
          doc.page.margins.left,
          doc.y,
          { continued: true, align: "justify", width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
        );
        doc.font("Helvetica-Bold").text(`${data.nome ? data.nome.toUpperCase() : ""}`, { continued: true });
        doc.font("Helvetica").text(`, ${data.nacionalidade ? data.nacionalidade.toLowerCase() : ""}, ${data.estadoCivil ? data.estadoCivil.toLowerCase() : ""}, ${data.profissao ? data.profissao.toLowerCase() : ""}, regularmente inscrito no CPF sob o nº ${data.cpf || "_________"}, residente e domiciliado(a) na ${data.endereco || "_________"}, CEP: ${data.cep || "_________"}, na cidade de ${data.cidade || "_________"}/${data.estado || "_________"}, de ora em diante denominado apenas ASSOCIADO.`, { align: "justify" });
        doc.moveDown(0.5);

        doc.font("Helvetica-Bold").text("Considerando que:");
        doc.moveDown(0.2);
        doc.font("Helvetica").text("(i) A MEDPRIME é empresa especializada que atua com habitualidade no desenvolvimento de atividades de atendimento hospitalar; atividade de atendimento em pronto-socorro e unidades hospitalares para atendimento a urgências, serviços de remoção de pacientes, exceto os serviços móveis de atendimento a urgências; atividade médica ambulatorial com recursos para realização de procedimentos cirúrgicos; atividade médica ambulatorial com recursos para realização de exames complementares; atividade médica ambulatorial restrita a consultas; e atividades de apoio à gestão de saúde;", { align: "justify" });
        doc.moveDown(0.3);
        doc.text("(ii) O ASSOCIADO atua com habitualidade na área de Clínico geral, pelo que assume deter conhecimentos técnicos e know-how para prestar serviços desta natureza;", { align: "justify" });
        doc.moveDown(0.3);
        doc.text("(iii) A MEDPRIME e o ASSOCIADO trocaram diversos contatos com o fito de regulamentar os termos do supramencionado instrumento de prestação de serviços técnicos, ora denominado CONTRATO, tendo estabelecido de forma conjunta todos os direitos, obrigações e prazos ora descritos no presente contrato. É que vem a MEDPRIME e o ASSOCIADO, considerando que há efetivo interesse – livre de consentimento e sem qualquer embaraço – das partes em mutuamente formalizar o presente instrumento, pelo que resolvem de comum acordo celebrar o CONTRATO nos termos que segue em adiante.", { align: "justify" });
        doc.moveDown(1);

        const addClause = (title: string, text: string) => {
          doc.font("Helvetica-Bold").text(title);
          doc.moveDown(0.2);
          doc.font("Helvetica").text(text, { align: "justify" });
          doc.moveDown(0.8);
        };

        addClause("CLÁUSULA PRIMEIRA – DO OBJETO", "1.1. O objeto do presente contrato é a prestação de serviços pelo ASSOCIADO com seus serviços na área de clínico geral, em contrato firmado pela CONTRATANTE no município de Ribeirão Preto, estado de São Paulo.\n\n1.2. O ASSOCIADO declara neste ato deter o conhecimento técnico necessário para o integral cumprimento do presente objeto, atestando deter plenas condições operacionais, técnicas, expertise e know-how para prestar os serviços contratados, não se admitindo, em nenhuma hipótese, a alegação de desconhecimento técnico.");
        addClause("CLÁUSULA SEGUNDA – DA OBRIGATORIEDADE DA APRESENTAÇÃO DE DOCUMENTAÇÃO PELO ASSOCIADO PARA EXECUÇÃO DOS SERVIÇOS:", "2.1. O ASSOCIADO afirma conhecer inequivocamente o inteiro teor e todas as exigências referentes aos serviços objeto do contrato, devendo apresentar à MEDPRIME, no ato da assinatura do presente instrumento, os seguintes documentos: Carteira profissional do CREMESP, Diploma Médico, Diploma de Especialidades (RQE), Comprovante de Endereço, Documentos Pessoais, Certidão de Regularidade expedida pelo CREMESP, Declaração de Regularidade Ético-profissional, Ficha cadastral e Autorização para tratamento de dados pessoais (LGPD).");
        addClause("CLÁUSULA TERCEIRA – DAS OBRIGAÇÕES ESPECÍFICAS DO ASSOCIADO", "3.1. Constituem obrigações do ASSOCIADO:\n\n3.1.1. Contribuir com a prestação de serviços médicos na área de clínico geral conforme previsto no objeto deste CONTRATO e de acordo com o que for solicitado pela MEDPRIME.\n\n3.1.2. Prestar atendimento integral à pessoa, independentemente de gênero, faixa etária, patologia ou condição de saúde, contemplando gestantes, crianças, adultos e idosos, a fim de acolher e manejar as mais diversas demandas e queixas, de natureza ginecológica, respiratória, cardiológica, urinária, entre outras, no âmbito da Estratégia de Saúde da Família.\n\n3.1.3. Fornecer à MEDPRIME, sempre que solicitado e com a menor brevidade possível, todas as informações relativas ao andamento dos serviços executados.\n\n3.1.4. Comunicar por escrito a MEDPRIME, caso tome conhecimento de qualquer situação que possa interferir, direta ou indiretamente, no estrito cumprimento do objeto descrito na CLÁUSULA PRIMEIRA, ou que possa causar prejuízos a quaisquer das partes ou terceiros;\n\n3.1.5. Esclarecer a MEDPRIME todas as dúvidas relativas aos serviços executados pelo ASSOCIADO neste CONTRATO;\n\n3.1.6. Observar os termos e condições estabelecidos neste CONTRATO e seus anexos, e cumprir fielmente as obrigações decorrentes deles, sempre respeitando os padrões e normas inerentes à atividade e ao objeto deste CONTRATO, às NORMAS TECNICAS DOS PROCEDIMENTOS ELENCADOS NESSE CONTRATO e demais conselhos e/ou órgãos reguladores;\n\n3.1.7. Cumprir os regulamentos internos em vigor ou que vierem a vigorar no local da prestação de serviço, ou outras normas que porventura venham a ser indicadas pela MEDPRIME, inclusive aqueles pertinentes à segurança;\n\n3.1.8. Não divulgar total ou parcialmente, por quaisquer meios e a qualquer tempo, quaisquer detalhes acerca da utilização dos produtos, documentos e/ou materiais objeto deste CONTRATO, sem prévia e formal anuência da MEDPRIME;\n\n3.1.9. Responsabilizar-se perante a MEDPRIME e terceiros por prejuízos que venha a causar, bem como isentar e manter a MEDPRIME livre de qualquer reclamação resultante da inobservância das obrigações e deveres profissionais;\n\n3.1.10. Para o esclarecimento de eventuais dúvidas na prestação dos serviços previstos neste contato deverá o ASSOCIADO contatar diretamente a MEDPRIME, devendo fazê-lo por escrito;\n\n3.1.11. Jamais se reportar diretamente à prefeitura do município ou qualquer outro órgão da Administração Pública acerca do objeto do presente CONTRATO sem o conhecimento prévio da MEDPRIME;\n\n3.2. A violação dos dispostos na CLÁUSULA TERCEIRA implicará na rescisão do presente CONTRATO, sem prejuízo da apuração de perdas e danos causados a MEDPRIME ou a terceiros.");
        
        addClause("CLÁUSULA QUARTA – DAS OBRIGAÇÕES ESPECÍFICAS DA MEDPRIME", "4.1. É responsabilidade da MEDPRIME:\n\n4.1.1. O fornecimento de todos os dados necessários e informações imprescindíveis ao desenvolvimento do objeto pelo ASSOCIADO;\n\n4.1.2. Informar previamente o ASSOCIADO sobre toda e qualquer anormalidade na contratação que possa influir no atendimento de pacientes;\n\n4.1.3. Zelar para que os serviços ora contratados sejam executados com diligência e perfeição, cumprindo rigorosamente as normas pertinentes e o estabelecido neste contrato, sem que, com isso, interfira na relação médico-paciente, bem como na conduta diagnóstica e/ou na proposta terapêutica adotadas pelo ASSOCIADO, desde que consentâneos com a ética e o saber científico preconizado na atualidade;\n\n4.1.4. Zelar para que o ASSOCIADO atenda o paciente dentro das normas impostas pelo exercício da profissão;\n\n4.1.5. Manter permanente contato com o ASSOCIADO, sempre que necessário, a fim de orientá-lo e informá-lo de detalhes do projeto que auxiliem na execução dos serviços previstos no objeto deste CONTRATO, bem como de eventuais alterações do mesmo;\n\n4.1.6. Notificar o ASSOCIADO, de forma imediata, sobre irregularidades observadas no cumprimento do presente CONTRATO;\n\n4.1.7. Efetuar os respectivos pagamentos na forma prevista na CLÁUSULA SEXTA deste contrato;");
        addClause("CLÁUSULA QUINTA – DO PRAZO DE VIGÊNCIA", "5.1. A vigência do presente instrumento contratual terá início no dia 1 de setembro de 2026, vigendo pelo prazo de 12 (doze) meses para ambas as partes, a contar da assinatura do presente instrumento, podendo ser prorrogado por igual período caso ocorra manifestação expressa das partes.");
        addClause("CLÁUSULA SEXTA – DOS ASPECTOS FINANCEIROS E DOS PRAZOS PARA PAGAMENTO", "6.1. Pela execução dos serviços, a MEDPRIME pagará ao ASSOCIADO a título de distribuição de lucros, o valor líquido de R$ 7.500,00 (sete mil e quinhentos reais) para execução de 20h (vinte) horas semanais, conforme ajustado em negociação comercial com o ASSOCIADO, a serem pagos por depósito em conta em nome do ASSOCIADO.\n\n6.2. A CONTRATANTE realizará o pagamento dos valores contidos nas Cláusulas 6.1 até o 20º (vigésimo) dia útil do mês subsequente ao da execução dos serviços realizados e assim sucessivamente, sendo que após eventual finalização contratual, os saldos residuais dos serviços prestados anteriormente serão pagos seguindo o mesmo fluxo financeiro estabelecido no contrato.");
        addClause("CLÁUSULA SÉTIMA - DAS CONDIÇÕES GERAIS", "7.1. As cláusulas e condições estabelecidas neste contrato poderão ser alteradas mediante acordo entre as partes, a qualquer tempo, através de documento escrito e firmado por ambas. Qualquer omissão ou tolerância de qualquer das partes em exigir o estrito cumprimento das obrigações ora contratadas ou em exercer qualquer direito decorrente deste CONTRATO não constituirão novação ou renúncia, nem afetará seu direito de exercê-lo a qualquer tempo, respeitados os prazos decadenciais e prescricionais previstos no Código Civil Brasileiro.\n\n7.2. A nulidade de qualquer cláusula ou condição deste contrato não afetará a validade ou exequibilidade das demais como um todo. Caso qualquer uma das cláusulas ou condições do presente contrato seja considerada nula, inválida ou inexequível, as partes comprometem-se a negociar em boa-fé a substituição de referida cláusula ou condição por outra equivalente que seja válida, eficaz e exequível.");
        addClause("CLÁUSULA OITAVA – DA AUSÊNCIA VÍNCULO TRABALHISTA", "8.1. As partes reconhecem que o ASSOCIADO exercerá sua atividade profissional de maneira livre e insubordinada e que o vínculo decorrente deste contrato é estritamente comercial, não se estabelecendo qualquer relação empregatícia entre as PARTES.");
        
        addClause("CLÁUSULA NONA – DAS HIPÓTESES DE RESCISÃO DO CONTRATO", "9.1. O presente contrato poderá ser rescindido unilateralmente pela MEDPRIME nos seguintes casos:\n9.1.1. Descumprimento das cláusulas contratuais, especificações, ou prazos estipulados neste CONTRATO e seus anexos pelo ASSOCIADO;\n9.1.2. O cumprimento irregular de cláusulas contratuais, especificações, ou prazos estipulados neste CONTRATO e seus anexos pelo ASSOCIADO;\n9.1.3. A lentidão no cumprimento das cláusulas contratuais, especificações, ou prazos estipulados neste CONTRATO e seus anexos pelo ASSOCIADO, levando a MEDPRIME a comprovar a impossibilidade da conclusão do objeto nos termos estipulados;\n9.1.4 O atraso injustificado no início da execução dos serviços objeto previsto neste CONTRATO e seus anexos;\n9.1.5 A paralisação na prestação dos serviços previstos neste CONTRATO e seus anexos, sem justa causa e sem prévia comunicação à MEDPRIME;\n\n9.2 O presente contrato poderá ser rescindido unilateralmente pelo ASSOCIADO nos seguintes casos:\n9.2.1 Descumprimento das cláusulas contratuais, especificações, ou prazos estipulados neste CONTRATO e seus anexos pela MEDPRIME;\n9.2.1 O atraso injustificado do pagamento previsto na Cláusula 6.1 por mais de 15 (quinze) dias;\n\n9.3 Poderá o presente instrumento ser rescindido por mútuo consentimento, ou a pedido de qualquer uma das partes, sem aplicação de multa por rescisão contratual, desde que ocorra comunicação prévia escrita à parte contrária com 30 (trinta) dias de antecedência, sendo mantido todos os serviços e pagamentos previstos neste instrumento, bem como a validade de todas as demais Cláusulas contratuais a contar da assinatura da solicitação de rescisão desmotivada até findo o referido prazo.\n\n9.4 Ocorrendo a rescisão unilateral desmotivada, por qualquer uma das partes, a parte prejudicada fará jus a multa contratual no valor equivalente a 100% da quantia prevista na Cláusula 6.1.\n\n9.5 A rescisão contratual não exime o ASSOCIADO da responsabilidade civil no que tange a reparação de eventuais danos, perdas ou prejuízos decorrentes da atividade prestada, seja em favor da MEDPRIME ou ainda em favor de terceiros.\n\n9.6 Na hipótese de ocorrência de rescisão motivada por ambas as partes, não aplicar-se-ão os itens 9.3 e 9.4 do presente instrumento.\n\n9.7 Caso ocorra rescisão amigável, por mútuo consentimento entre as partes, não será devida qualquer multa contratual, bem como as partes poderão dispensar o aviso prévio estabelecido no item 9.3, desde que expressamente pactuado no termo de distrato.");
        addClause("CLÁUSULA DÉCIMA – DAS ASSINATURAS DO CONTRATO:", "10.1. As partes declaram que as assinaturas do presente CONTRATO é realizada por quem de direito e possuem plenos poderes e capacidade para tanto; e poderá ser realizada por ferramenta de assinatura eletrônica e/ou digital, nos termos do parágrafo 2º, do artigo 10, da medida provisória 2.200 – 2/2001 e, caso o sejam, também constituem obrigações válidas e exigíveis, para todos os fins legais, representando a vontade de todos que o assinam, como prova documental e título executivo extrajudicial, para todos os fins e efeitos.");
        addClause("CLÁUSULA DÉCIMA PRIMEIRA - DA ELEIÇÃO DO FORO E DO TÍTULO EXECUTIVO:", "11.1 Para dirimir quaisquer dúvidas ou controvérsias relativas ao presente instrumento contratual, as partes elegem o foro de Curitiba/PR com renúncia expressa a qualquer outro, por mais privilegiado que seja.\n\n11.2 E por assim estarem certos e de acordo, assinam o presente instrumento particular na presença de duas testemunhas, em 02 (duas) vias de igual teor e forma.");

        doc.moveDown(1);
        doc.text(`Curitiba, ${new Date().toLocaleDateString("pt-BR")}.`, { align: "right" });
        doc.moveDown(2);

        doc.text("______________________________________________________", { align: "center" });
        doc.font("Helvetica-Bold").text("MEDPRIME CLÍNICA GESTÃO E SAÚDE S/A", { align: "center" });
        doc.moveDown(2);
        
        doc.font("Helvetica").text("______________________________________________________", { align: "center" });
        doc.font("Helvetica-Bold").text(`${data.nome ? data.nome.toUpperCase() : ""}`, { align: "center" });
        doc.moveDown(3);

        doc.font("Helvetica-Bold").text("TESTEMUNHAS:");
        doc.moveDown(2);
        
        doc.font("Helvetica").text("__________________________                    __________________________");
        doc.text("Nome:                                                         Nome:");
        doc.text("RG:                                                             RG:");
        doc.text("CPF:                                                            CPF:");

        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  };

  return Promise.all(dataList.map(generateSinglePdf));
}
