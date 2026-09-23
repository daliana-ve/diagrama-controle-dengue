
// ==========================================================
// MONITORAMENTO EPIDEMIOLÓGICO DA DENGUE
// Regional de Saúde de Colatina
// ==========================================================


// ----------------------------------------------------------
// VARIÁVEIS GLOBAIS
// ----------------------------------------------------------

let metadados = null;
let indicadoresMunicipios = [];
let serieTemporal = [];
let perfilEpidemiologico = [];
let perfilClinico = [];
let laboratorioSorotipos = [];
let qualidadeVigilancia = [];
let diagramaMunicipal = [];
let referenciaRegional = [];



// ----------------------------------------------------------
// CARREGAR JSON
// ----------------------------------------------------------

async function carregarJSON(caminho) {

    const resposta = await fetch(caminho);

    if (!resposta.ok) {
        throw new Error(
            `Erro ao carregar ${caminho}: ${resposta.status}`
        );
    }

    return await resposta.json();
}


// ----------------------------------------------------------
// CARREGAR CSV
// ----------------------------------------------------------

function carregarCSV(caminho) {

    return new Promise((resolve, reject) => {

        Papa.parse(caminho, {

            download: true,
            header: true,
            skipEmptyLines: true,

            complete: function(resultado) {

                if (resultado.errors.length > 0) {
                    console.warn(
                        "Avisos na leitura do CSV:",
                        resultado.errors
                    );
                }

                resolve(resultado.data);
            },

            error: function(erro) {
                reject(erro);
            }

        });

    });

}


// ----------------------------------------------------------
// PREENCHER SELETOR DE MUNICÍPIOS
// ----------------------------------------------------------

function preencherMunicipios() {

    const seletor = document.getElementById(
        "filtro-municipio"
    );

    const municipios = indicadoresMunicipios
        .map(d => d.MUNICIPIO)
        .filter(Boolean)
        .sort((a, b) =>
            a.localeCompare(
                b,
                "pt-BR"
            )
        );

    municipios.forEach(municipio => {

        const opcao = document.createElement(
            "option"
        );

        opcao.value = municipio;
        opcao.textContent = municipio;

        seletor.appendChild(opcao);

    });

}


// ----------------------------------------------------------
// ATUALIZAR CABEÇALHO
// ----------------------------------------------------------

function atualizarCabecalho() {

    const elemento = document.getElementById(
        "atualizacao"
    );

    const ultimaSE =
        metadados.ultima_se_diagnostico;

    const ano =
        metadados.ano;

    const data =
        metadados.data_referencia_base;

    let texto =
        `Dados atualizados até a SE ${ultimaSE}/${ano}`;

    if (data) {
        texto += ` • Base até ${data}`;
    }

    elemento.textContent = texto;

}


// ----------------------------------------------------------
// INICIALIZAR DASHBOARD
// ----------------------------------------------------------

async function iniciarDashboard() {

    try {

        console.log(
            "Iniciando dashboard..."
        );

        // Metadados
        metadados = await carregarJSON(
            "dados/metadados.json"
        );

        console.log(
            "Metadados carregados:",
            metadados
        );

        // Indicadores municipais
        indicadoresMunicipios = await carregarCSV(
            "dados/indicadores_municipios.csv"
        );

        console.log(
            "Municípios carregados:",
            indicadoresMunicipios.length
        );

        // Série temporal
        serieTemporal = await carregarCSV(
            "dados/serie_temporal.csv"
        );

        console.log(
            "Série temporal carregada:",
            serieTemporal.length,
            "linhas"
        );

        // Perfil epidemiológico
        perfilEpidemiologico = await carregarCSV(
            "dados/perfil_epidemiologico.csv"
        );

        console.log(
            "Perfil epidemiológico carregado:",
            perfilEpidemiologico.length,
            "linhas"
        );

        // Perfil clínico
        perfilClinico = await carregarCSV(
            "dados/perfil_clinico.csv"
        );

        console.log(
            "Perfil clínico carregado:",
            perfilClinico.length,
            "linhas"
        );

        // Laboratório e sorotipos
        laboratorioSorotipos = await carregarCSV(
            "dados/laboratorio_sorotipos.csv"
        );

        console.log(
            "Laboratório e sorotipos carregados:",
            laboratorioSorotipos.length,
            "linhas"
        );

        // Qualidade da vigilância
        qualidadeVigilancia = await carregarCSV(
            "dados/qualidade_vigilancia.csv"
        );

        // Diagrama de controle
        diagramaMunicipal = await carregarCSV(
            "painel_dengue_regional_2026.csv"
        );

        referenciaRegional = await carregarCSV(
            "referencia_regional_dengue.csv"
        );

        console.log(
            "Qualidade da vigilância carregada:",
            qualidadeVigilancia.length,
            "linhas"
        );

        // Cabeçalho
        atualizarCabecalho();

        // Seletor
        preencherMunicipios();

        // KPIs iniciais — Regional
        atualizarKPIs();

        // Curva epidêmica inicial
        atualizarSerieTemporal();
        atualizarDiagramaControle();

        // Perfil epidemiológico
        atualizarPerfilEpidemiologico();

        // Perfil clínico
        atualizarPerfilClinico();

        // Laboratório e sorotipos
        atualizarLaboratorio();

        // Qualidade da vigilância
        atualizarQualidadeVigilancia();

        console.log(
            "Dashboard inicializado com sucesso."
        );

    }

    catch (erro) {

        console.error(
            "Erro ao iniciar o dashboard:",
            erro
        );

        const elemento =
            document.getElementById(
                "atualizacao"
            );

        elemento.textContent =
            "Erro ao carregar os dados.";

    }

}


// ----------------------------------------------------------
// EXECUTAR QUANDO A PÁGINA ESTIVER PRONTA
// ----------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    iniciarDashboard
);


// ==========================================================
// KPIs
// ==========================================================

function numero(valor) {

    const n = Number(valor);

    return Number.isFinite(n)
        ? n
        : 0;
}


function formatarInteiro(valor) {

    return numero(valor).toLocaleString(
        "pt-BR",
        {
            maximumFractionDigits: 0
        }
    );
}


function formatarDecimal(valor) {

    return numero(valor).toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    );
}


// ----------------------------------------------------------
// CALCULAR DADOS REGIONAIS
// ----------------------------------------------------------

function obterDadosRegional() {

    const soma = campo =>
        indicadoresMunicipios.reduce(
            (total, linha) =>
                total + numero(linha[campo]),
            0
        );

    const populacao =
        soma("POPULACAO_2024");

    const casosProvaveis =
        soma("CASOS_PROVAVEIS");

    const casos4SE =
        soma("CASOS_ULTIMAS_4_SE");

    const alarmeGrave =
        soma("ALARME_GRAVE");

    const obitos =
        soma("OBITOS_DENGUE");

    return {

        CASOS_PROVAVEIS:
            casosProvaveis,

        INCIDENCIA_ACUMULADA:
            populacao > 0
                ? casosProvaveis / populacao * 100000
                : 0,

        CASOS_ULTIMAS_4_SE:
            casos4SE,

        INCIDENCIA_ULTIMAS_4_SE:
            populacao > 0
                ? casos4SE / populacao * 100000
                : 0,

        EM_INVESTIGACAO:
            soma("EM_INVESTIGACAO"),

        HOSPITALIZADOS:
            soma("HOSPITALIZADOS"),

        ALARME_GRAVE:
            alarmeGrave,

        OBITOS_DENGUE:
            obitos,

        LETALIDADE_PERC:
            alarmeGrave > 0
                ? obitos / alarmeGrave * 100
                : null
    };
}


// ----------------------------------------------------------
// OBTER DADOS DO TERRITÓRIO
// ----------------------------------------------------------

function obterDadosTerritorio(territorio) {

    if (territorio === "REGIONAL") {
        return obterDadosRegional();
    }

    return indicadoresMunicipios.find(
        linha =>
            linha.MUNICIPIO === territorio
    );
}


// ----------------------------------------------------------
// ATUALIZAR CARTÕES
// ----------------------------------------------------------

function atualizarKPIs() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;

    const dados =
        obterDadosTerritorio(
            territorio
        );

    if (!dados) {
        console.warn(
            "Território não encontrado:",
            territorio
        );
        return;
    }

    document.getElementById(
        "kpi-casos-provaveis"
    ).textContent =
        formatarInteiro(
            dados.CASOS_PROVAVEIS
        );

    document.getElementById(
        "kpi-incidencia"
    ).textContent =
        formatarDecimal(
            dados.INCIDENCIA_ACUMULADA
        );

    document.getElementById(
        "kpi-casos-4se"
    ).textContent =
        formatarInteiro(
            dados.CASOS_ULTIMAS_4_SE
        );

    document.getElementById(
        "kpi-incidencia-4se"
    ).textContent =
        formatarDecimal(
            dados.INCIDENCIA_ULTIMAS_4_SE
        );

    document.getElementById(
        "kpi-investigacao"
    ).textContent =
        formatarInteiro(
            dados.EM_INVESTIGACAO
        );

    document.getElementById(
        "kpi-hospitalizados"
    ).textContent =
        formatarInteiro(
            dados.HOSPITALIZADOS
        );

    document.getElementById(
        "kpi-gravidade"
    ).textContent =
        formatarInteiro(
            dados.ALARME_GRAVE
        );

    document.getElementById(
        "kpi-obitos"
    ).textContent =
        formatarInteiro(
            dados.OBITOS_DENGUE
        );


    // ------------------------------------------------------
    // LETALIDADE
    // Nossa metodologia:
    // óbitos por dengue /
    // (sinais de alarme + dengue grave)
    // ------------------------------------------------------

    const elementoLetalidade =
        document.getElementById(
            "detalhe-letalidade"
        );

    if (
        dados.LETALIDADE_PERC !== null
        &&
        dados.LETALIDADE_PERC !== ""
        &&
        !isNaN(
            Number(
                dados.LETALIDADE_PERC
            )
        )
    ) {

        elementoLetalidade.textContent =
            "Letalidade: " +
            formatarDecimal(
                dados.LETALIDADE_PERC
            ) +
            "%";

    } else {

        elementoLetalidade.textContent =
            "Sem denominador para letalidade";

    }


    // ------------------------------------------------------
    // PERÍODO DAS ÚLTIMAS 4 SE
    // ------------------------------------------------------

    const inicio =
        metadados
        .periodo_ultimas_4_se
        .se_inicial;

    const fim =
        metadados
        .periodo_ultimas_4_se
        .se_final;

    document.getElementById(
        "detalhe-4se"
    ).textContent =
        `SE ${inicio} a ${fim}/${metadados.ano}`;
}


// ----------------------------------------------------------
// ALTERAÇÃO DO MUNICÍPIO
// ----------------------------------------------------------

document.addEventListener(
    "change",
    function(evento) {

        if (
            evento.target.id ===
            "filtro-municipio"
        ) {

            atualizarKPIs();
            atualizarSerieTemporal();
            atualizarPerfilEpidemiologico();
            atualizarPerfilClinico();
            atualizarLaboratorio();
            atualizarQualidadeVigilancia();

        }

    }
);


// ==========================================================
// CURVA EPIDÊMICA
// Semana Epidemiológica de Diagnóstico
// ==========================================================

function atualizarSerieTemporal() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;

    const ultimaSE =
        Number(
            metadados.ultima_se_diagnostico
        );


    // ------------------------------------------------------
    // DADOS DO TERRITÓRIO
    // ------------------------------------------------------

    const dadosTerritorio =
        serieTemporal
        .filter(
            linha =>
                linha.MUNICIPIO === territorio
        )
        .sort(
            (a, b) =>
                Number(a.SE_DIAGNOSTICO) -
                Number(b.SE_DIAGNOSTICO)
        );


    // ------------------------------------------------------
    // SEMANAS 1 ATÉ A ÚLTIMA SE OBSERVADA
    //
    // IMPORTANTE:
    // As semanas posteriores continuam no eixo X,
    // mas NÃO são representadas como zero casos.
    // ------------------------------------------------------

    const dadosObservados =
        dadosTerritorio.filter(
            linha =>
                Number(linha.SE_DIAGNOSTICO)
                <= ultimaSE
        );


    const semanas =
        dadosObservados.map(
            linha =>
                Number(linha.SE_DIAGNOSTICO)
        );

    const casos =
        dadosObservados.map(
            linha =>
                Number(linha.CASOS_PROVAVEIS) || 0
        );


    // ------------------------------------------------------
    // CURVA
    // ------------------------------------------------------

    const trace = {

        x: semanas,

        y: casos,

        type: "scatter",

        mode: "lines+markers",

        name: "Casos prováveis",

        hovertemplate:
            "<b>SE %{x}</b><br>" +
            "Casos prováveis: %{y:,d}" +
            "<extra></extra>",

        line: {
            width: 3
        },

        marker: {
            size: 6
        }

    };


    // ------------------------------------------------------
    // LAYOUT
    // ------------------------------------------------------

    const layout = {

        title: {

            text:
                "Casos prováveis por semana epidemiológica de diagnóstico",

            font: {
                size: 17
            },

            x: 0.02,

            xanchor: "left"
        },


        margin: {
            l: 65,
            r: 30,
            t: 75,
            b: 65
        },


        xaxis: {

            title:
                "Semana epidemiológica de diagnóstico",

            range: [
                0.5,
                53.5
            ],

            tickmode:
                "linear",

            tick0:
                1,

            dtick:
                2
        },


        yaxis: {

            title:
                "Casos prováveis",

            rangemode:
                "tozero"
        },


        hovermode:
            "x unified",


        // --------------------------------------------------
        // LINHA DA ÚLTIMA SE OBSERVADA
        // --------------------------------------------------

        shapes: [

            {
                type:
                    "line",

                x0:
                    ultimaSE + 0.5,

                x1:
                    ultimaSE + 0.5,

                y0:
                    0,

                y1:
                    1,

                yref:
                    "paper",

                line: {

                    width:
                        1,

                    dash:
                        "dot"
                }
            }

        ],


        annotations: [

            {
                x:
                    ultimaSE,

                y:
                    1,

                xref:
                    "x",

                yref:
                    "paper",

                text:
                    `Dados disponíveis até a SE ${ultimaSE}`,

                showarrow:
                    false,

                xanchor:
                    "right",

                yanchor:
                    "bottom",

                font: {
                    size: 11
                }
            },

            {
                x:
                    (ultimaSE + 53) / 2,

                y:
                    0.5,

                xref:
                    "x",

                yref:
                    "paper",

                text:
                    "Semanas ainda não disponíveis",

                showarrow:
                    false,

                textangle:
                    -90,

                font: {
                    size: 10
                },

                opacity:
                    0.55
            }

        ],


        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)"
    };


    // ------------------------------------------------------
    // CONFIGURAÇÃO
    // ------------------------------------------------------

    const config = {

        responsive:
            true,

        displaylogo:
            false,

        locale:
            "pt-BR",

        modeBarButtonsToRemove: [
            "lasso2d",
            "select2d"
        ]

    };


    // ------------------------------------------------------
    // ATUALIZAR GRÁFICO
    // ------------------------------------------------------

    Plotly.react(

        "grafico-serie-temporal",

        [trace],

        layout,

        config

    );

}


// ==========================================================
// PERFIL EPIDEMIOLÓGICO
// ==========================================================

function obterPerfil(territorio, indicador) {

    return perfilEpidemiologico.filter(
        linha =>
            linha.MUNICIPIO === territorio &&
            linha.INDICADOR === indicador
    );
}


// ----------------------------------------------------------
// SEXO
// ----------------------------------------------------------

function atualizarGraficoSexo() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;

    const dados =
        obterPerfil(
            territorio,
            "SEXO"
        );

    const ordem = [
        "Feminino",
        "Masculino",
        "Ignorado",
        "Não informado"
    ];

    const dadosOrdenados =
        ordem
        .map(categoria => {

            const registro =
                dados.find(
                    d =>
                        d.CATEGORIA === categoria
                );

            return {
                categoria: categoria,
                casos: registro
                    ? Number(registro.CASOS) || 0
                    : 0
            };

        })
        .filter(
            d => d.casos > 0
        );


    const total =
        dadosOrdenados.reduce(
            (soma, d) =>
                soma + d.casos,
            0
        );


    const trace = {

        x: dadosOrdenados.map(
            d => d.categoria
        ),

        y: dadosOrdenados.map(
            d => d.casos
        ),

        type: "bar",

        text:
            dadosOrdenados.map(
                d =>
                    total > 0
                    ? (
                        d.casos /
                        total *
                        100
                      ).toFixed(1)
                      .replace(".", ",") + "%"
                    : "0%"
            ),

        textposition:
            "auto",

        hovertemplate:
            "<b>%{x}</b><br>" +
            "Casos: %{y}<br>" +
            "%{text}" +
            "<extra></extra>"
    };


    const layout = {

        title: {
            text:
                "Casos prováveis segundo sexo",
            font: {
                size: 16
            },
            x: 0.02
        },

        margin: {
            l: 55,
            r: 20,
            t: 65,
            b: 60
        },

        xaxis: {
            title: ""
        },

        yaxis: {
            title: "Casos prováveis",
            rangemode: "tozero"
        },

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        showlegend:
            false
    };


    Plotly.react(
        "grafico-sexo",
        [trace],
        layout,
        {
            responsive: true,
            displaylogo: false
        }
    );
}


// ----------------------------------------------------------
// FAIXA ETÁRIA
// ----------------------------------------------------------

function atualizarGraficoFaixaEtaria() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;

    const dados =
        obterPerfil(
            territorio,
            "FAIXA_ETARIA"
        );


    const ordem = [
        "<1",
        "1–4",
        "5–9",
        "10–19",
        "20–29",
        "30–39",
        "40–49",
        "50–59",
        "60–69",
        "70–79",
        "80+"
    ];


    const valores =
        ordem.map(
            categoria => {

                const registro =
                    dados.find(
                        d =>
                            d.CATEGORIA === categoria
                    );

                return registro
                    ? Number(registro.CASOS) || 0
                    : 0;
            }
        );


    const total =
        valores.reduce(
            (a, b) => a + b,
            0
        );


    const percentuais =
        valores.map(
            valor =>
                total > 0
                ? (
                    valor /
                    total *
                    100
                  ).toFixed(1)
                  .replace(".", ",") + "%"
                : "0%"
        );


    const trace = {

        x: ordem,

        y: valores,

        type: "bar",

        text:
            percentuais,

        textposition:
            "auto",

        hovertemplate:
            "<b>%{x} anos</b><br>" +
            "Casos: %{y}<br>" +
            "%{text}" +
            "<extra></extra>"
    };


    const layout = {

        title: {
            text:
                "Casos prováveis segundo faixa etária",
            font: {
                size: 16
            },
            x: 0.02
        },

        margin: {
            l: 55,
            r: 20,
            t: 65,
            b: 70
        },

        xaxis: {
            title:
                "Faixa etária"
        },

        yaxis: {
            title:
                "Casos prováveis",
            rangemode:
                "tozero"
        },

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        showlegend:
            false
    };


    Plotly.react(
        "grafico-faixa-etaria",
        [trace],
        layout,
        {
            responsive: true,
            displaylogo: false
        }
    );
}


// ----------------------------------------------------------
// ATUALIZAR PERFIL
// ----------------------------------------------------------

function atualizarPerfilEpidemiologico() {

    atualizarGraficoSexo();
    atualizarGraficoFaixaEtaria();
    atualizarGraficoRacaCor();
    atualizarGraficoGestantes();
    atualizarGraficoComorbidades();

}


// ==========================================================
// RAÇA/COR
// ==========================================================

function atualizarGraficoRacaCor() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;

    const dados =
        obterPerfil(
            territorio,
            "RACA_COR"
        );


    const ordem = [
        "Branca",
        "Preta",
        "Amarela",
        "Parda",
        "Indígena",
        "Ignorado",
        "Não informado"
    ];


    const dadosOrdenados =
        ordem
        .map(categoria => {

            const registro =
                dados.find(
                    d =>
                        d.CATEGORIA === categoria
                );

            return {
                categoria: categoria,
                casos: registro
                    ? Number(registro.CASOS) || 0
                    : 0
            };

        })
        .filter(
            d => d.casos > 0
        );


    const total =
        dadosOrdenados.reduce(
            (soma, d) =>
                soma + d.casos,
            0
        );


    const percentuais =
        dadosOrdenados.map(
            d =>
                total > 0
                ? (
                    d.casos /
                    total *
                    100
                  ).toFixed(1)
                  .replace(".", ",") + "%"
                : "0%"
        );


    const trace = {

        x:
            dadosOrdenados.map(
                d => d.categoria
            ),

        y:
            dadosOrdenados.map(
                d => d.casos
            ),

        type:
            "bar",

        text:
            percentuais,

        textposition:
            "auto",

        hovertemplate:
            "<b>%{x}</b><br>" +
            "Casos: %{y}<br>" +
            "%{text}" +
            "<extra></extra>"
    };


    const layout = {

        title: {

            text:
                "Casos prováveis segundo raça/cor",

            font: {
                size: 16
            },

            x: 0.02
        },

        margin: {
            l: 55,
            r: 20,
            t: 65,
            b: 70
        },

        xaxis: {
            title: ""
        },

        yaxis: {

            title:
                "Casos prováveis",

            rangemode:
                "tozero"
        },

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        showlegend:
            false
    };


    Plotly.react(

        "grafico-raca-cor",

        [trace],

        layout,

        {
            responsive: true,
            displaylogo: false
        }

    );

}


// ==========================================================
// GESTANTES
// ==========================================================

function atualizarGraficoGestantes() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;


    // ------------------------------------------------------
    // TOTAL DE GESTANTES
    // ------------------------------------------------------

    const dadosGestantes =
        obterPerfil(
            territorio,
            "GESTANTES"
        );


    const totalGestantes =
        dadosGestantes.reduce(
            (soma, linha) =>
                soma +
                (
                    Number(
                        linha.CASOS
                    ) || 0
                ),
            0
        );


    // ------------------------------------------------------
    // TRIMESTRE GESTACIONAL
    // ------------------------------------------------------

    const dadosTrimestre =
        obterPerfil(
            territorio,
            "TRIMESTRE_GESTACIONAL"
        );


    const ordem = [

        "1º trimestre",

        "2º trimestre",

        "3º trimestre",

        "Idade gestacional ignorada"

    ];


    const valores =
        ordem.map(
            categoria => {

                const registro =
                    dadosTrimestre.find(
                        d =>
                            d.CATEGORIA ===
                            categoria
                    );

                return registro
                    ? Number(
                        registro.CASOS
                      ) || 0
                    : 0;

            }
        );


    // ------------------------------------------------------
    // CASO SEM GESTANTES
    // ------------------------------------------------------

    if (totalGestantes === 0) {

        const layoutSemDados = {

            title: {

                text:
                    "Casos prováveis em gestantes",

                font: {
                    size: 16
                },

                x: 0.02
            },

            annotations: [

                {
                    text:
                        "Nenhum caso provável em gestante no período",

                    x: 0.5,
                    y: 0.5,

                    xref: "paper",
                    yref: "paper",

                    showarrow:
                        false,

                    font: {
                        size: 15
                    }
                }

            ],

            xaxis: {
                visible: false
            },

            yaxis: {
                visible: false
            },

            margin: {
                l: 30,
                r: 30,
                t: 65,
                b: 30
            },

            paper_bgcolor:
                "rgba(0,0,0,0)",

            plot_bgcolor:
                "rgba(0,0,0,0)"
        };


        Plotly.react(

            "grafico-gestantes",

            [],

            layoutSemDados,

            {
                responsive: true,
                displaylogo: false
            }

        );

        return;
    }


    // ------------------------------------------------------
    // PERCENTUAIS ENTRE AS GESTANTES
    // ------------------------------------------------------

    const percentuais =
        valores.map(
            valor =>
                totalGestantes > 0
                ? (
                    valor /
                    totalGestantes *
                    100
                  ).toFixed(1)
                  .replace(".", ",") + "%"
                : "0%"
        );


    const trace = {

        x:
            ordem,

        y:
            valores,

        type:
            "bar",

        text:
            percentuais,

        textposition:
            "auto",

        hovertemplate:
            "<b>%{x}</b><br>" +
            "Casos: %{y}<br>" +
            "%{text}" +
            "<extra></extra>"
    };


    const layout = {

        title: {

            text:
                `Casos prováveis em gestantes: ${totalGestantes}`,

            font: {
                size: 16
            },

            x: 0.02
        },

        margin: {
            l: 55,
            r: 20,
            t: 65,
            b: 85
        },

        xaxis: {

            title: "",

            tickangle:
                -15
        },

        yaxis: {

            title:
                "Casos",

            rangemode:
                "tozero",

            dtick:
                1
        },

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        showlegend:
            false
    };


    Plotly.react(

        "grafico-gestantes",

        [trace],

        layout,

        {
            responsive: true,
            displaylogo: false
        }

    );

}


// ==========================================================
// COMORBIDADES
// ==========================================================

function atualizarGraficoComorbidades() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;


    const dados =
        obterPerfil(
            territorio,
            "COMORBIDADE"
        );


    // ------------------------------------------------------
    // ORDEM PADRONIZADA
    // ------------------------------------------------------

    const ordem = [

        "Diabetes",

        "Hepatopatias",

        "Doenças hematológicas",

        "Doença renal crônica",

        "Doença ácido-péptica"

    ];


    const dadosOrdenados =
        ordem.map(
            categoria => {

                const registro =
                    dados.find(
                        d =>
                            d.CATEGORIA === categoria
                    );

                return {

                    categoria:
                        categoria,

                    casos:
                        registro
                        ? Number(
                            registro.CASOS
                          ) || 0
                        : 0

                };

            }
        );


    // ------------------------------------------------------
    // DENOMINADOR = CASOS PROVÁVEIS DO TERRITÓRIO
    // ------------------------------------------------------

    const dadosTerritorio =
        obterDadosTerritorio(
            territorio
        );


    const totalProvaveis =
        dadosTerritorio
        ? Number(
            dadosTerritorio.CASOS_PROVAVEIS
          ) || 0
        : 0;


    const percentuais =
        dadosOrdenados.map(
            d =>
                totalProvaveis > 0
                ? (
                    d.casos /
                    totalProvaveis *
                    100
                  ).toFixed(1)
                  .replace(".", ",") + "%"
                : "0%"
        );


    // ------------------------------------------------------
    // VERIFICAR SE HÁ ALGUMA COMORBIDADE REGISTRADA
    // ------------------------------------------------------

    const totalMarcacoes =
        dadosOrdenados.reduce(
            (soma, d) =>
                soma + d.casos,
            0
        );


    if (totalMarcacoes === 0) {

        const layoutSemDados = {

            title: {

                text:
                    "Comorbidades registradas",

                font: {
                    size: 16
                },

                x: 0.02
            },

            annotations: [

                {
                    text:
                        "Nenhuma comorbidade registrada entre os casos prováveis",

                    x:
                        0.5,

                    y:
                        0.5,

                    xref:
                        "paper",

                    yref:
                        "paper",

                    showarrow:
                        false,

                    font: {
                        size: 14
                    }
                }

            ],

            xaxis: {
                visible: false
            },

            yaxis: {
                visible: false
            },

            margin: {
                l: 30,
                r: 30,
                t: 65,
                b: 30
            },

            paper_bgcolor:
                "rgba(0,0,0,0)",

            plot_bgcolor:
                "rgba(0,0,0,0)"
        };


        Plotly.react(

            "grafico-comorbidades",

            [],

            layoutSemDados,

            {
                responsive: true,
                displaylogo: false
            }

        );

        return;
    }


    // ------------------------------------------------------
    // GRÁFICO
    // ------------------------------------------------------

    const trace = {

        y:
            dadosOrdenados.map(
                d => d.categoria
            ),

        x:
            dadosOrdenados.map(
                d => d.casos
            ),

        type:
            "bar",

        orientation:
            "h",

        text:
            percentuais,

        textposition:
            "auto",

        customdata:
            percentuais,

        hovertemplate:
            "<b>%{y}</b><br>" +
            "Casos: %{x}<br>" +
            "% dos casos prováveis: %{customdata}" +
            "<extra></extra>"
    };


    const layout = {

        title: {

            text:
                "Comorbidades registradas entre os casos prováveis",

            font: {
                size: 16
            },

            x: 0.02
        },

        margin: {
            l: 180,
            r: 30,
            t: 70,
            b: 55
        },

        xaxis: {

            title:
                "Casos",

            rangemode:
                "tozero",

            dtick:
                1
        },

        yaxis: {

            title: "",

            autorange:
                "reversed"
        },

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        showlegend:
            false
    };


    Plotly.react(

        "grafico-comorbidades",

        [trace],

        layout,

        {
            responsive: true,
            displaylogo: false
        }

    );

}


// ==========================================================
// PERFIL CLÍNICO
// ==========================================================

function obterPerfilClinico(
    territorio,
    tipo
) {

    return perfilClinico.filter(
        linha =>
            linha.TERRITORIO === territorio &&
            linha.TIPO === tipo
    );

}


// ----------------------------------------------------------
// SINAIS E SINTOMAS GERAIS
// ----------------------------------------------------------

function atualizarGraficoSintomas() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;


    const dados =
        obterPerfilClinico(
            territorio,
            "SINTOMA"
        );


    // ------------------------------------------------------
    // CONVERTER VALORES
    // ------------------------------------------------------

    const dadosTratados =
        dados.map(
            linha => ({

                indicador:
                    linha.INDICADOR,

                casos:
                    Number(
                        linha.CASOS
                    ) || 0,

                denominador:
                    Number(
                        linha.DENOMINADOR
                    ) || 0,

                percentual:
                    Number(
                        linha.PERCENTUAL
                    ) || 0

            })
        );


    // ------------------------------------------------------
    // ORDENAR DO MAIS FREQUENTE PARA O MENOS FREQUENTE
    // ------------------------------------------------------

    dadosTratados.sort(
        (a, b) =>
            b.casos - a.casos
    );


    // ------------------------------------------------------
    // CASO NÃO HAJA DADOS
    // ------------------------------------------------------

    if (dadosTratados.length === 0) {

        Plotly.react(

            "grafico-sintomas",

            [],

            {

                title: {
                    text:
                        "Sinais e sintomas entre os casos prováveis",
                    x: 0.02,
                    font: {
                        size: 16
                    }
                },

                annotations: [
                    {
                        text:
                            "Sem dados disponíveis para o território selecionado",
                        x: 0.5,
                        y: 0.5,
                        xref: "paper",
                        yref: "paper",
                        showarrow: false
                    }
                ],

                xaxis: {
                    visible: false
                },

                yaxis: {
                    visible: false
                },

                paper_bgcolor:
                    "rgba(0,0,0,0)",

                plot_bgcolor:
                    "rgba(0,0,0,0)"

            },

            {
                responsive: true,
                displaylogo: false
            }

        );

        return;
    }


    // ------------------------------------------------------
    // TEXTOS DOS PERCENTUAIS
    // ------------------------------------------------------

    const percentuais =
        dadosTratados.map(
            d =>
                d.percentual
                .toFixed(1)
                .replace(".", ",")
                + "%"
        );


    // ------------------------------------------------------
    // GRÁFICO
    // ------------------------------------------------------

    const trace = {

        y:
            dadosTratados.map(
                d => d.indicador
            ),

        x:
            dadosTratados.map(
                d => d.casos
            ),

        type:
            "bar",

        orientation:
            "h",

        text:
            percentuais,

        textposition:
            "auto",

        customdata:
            dadosTratados.map(
                d => [
                    d.denominador,
                    d.percentual
                        .toFixed(1)
                        .replace(".", ",")
                ]
            ),

        hovertemplate:
            "<b>%{y}</b><br>" +
            "Casos: %{x}<br>" +
            "Denominador: %{customdata[0]}<br>" +
            "Percentual: %{customdata[1]}%" +
            "<extra></extra>"

    };


    const layout = {

        title: {

            text:
                "Sinais e sintomas entre os casos prováveis",

            x:
                0.02,

            font: {
                size: 16
            }

        },


        margin: {

            l:
                180,

            r:
                40,

            t:
                70,

            b:
                55

        },


        xaxis: {

            title:
                "Casos",

            rangemode:
                "tozero"

        },


        yaxis: {

            title: "",

            // Como os dados estão do maior para o menor,
            // reversed coloca o mais frequente no topo.
            autorange:
                "reversed"

        },


        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        showlegend:
            false

    };


    Plotly.react(

        "grafico-sintomas",

        [trace],

        layout,

        {

            responsive:
                true,

            displaylogo:
                false,

            modeBarButtonsToRemove: [
                "lasso2d",
                "select2d"
            ]

        }

    );

}


// ----------------------------------------------------------
// ATUALIZAR PERFIL CLÍNICO
// ----------------------------------------------------------

function atualizarPerfilClinico() {

    atualizarGraficoSintomas();
    atualizarGraficoSinaisAlarme();
    atualizarGraficoGravidade();

}


// ==========================================================
// SINAIS DE ALARME
// ==========================================================

function atualizarGraficoSinaisAlarme() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;


    const dados =
        obterPerfilClinico(
            territorio,
            "SINAL_ALARME"
        );


    // ------------------------------------------------------
    // TRATAR DADOS
    // ------------------------------------------------------

    const dadosTratados =
        dados.map(
            linha => ({

                indicador:
                    linha.INDICADOR,

                casos:
                    Number(
                        linha.CASOS
                    ) || 0,

                denominador:
                    Number(
                        linha.DENOMINADOR
                    ) || 0,

                percentual:
                    Number(
                        linha.PERCENTUAL
                    ) || 0

            })
        );


    // ------------------------------------------------------
    // IDENTIFICAR DENOMINADOR
    // ------------------------------------------------------

    const denominador =
        dadosTratados.length > 0
        ? dadosTratados[0].denominador
        : 0;


    // ------------------------------------------------------
    // TERRITÓRIO SEM CASOS COM SINAIS DE ALARME
    // ------------------------------------------------------

    if (denominador === 0) {

        Plotly.react(

            "grafico-sinais-alarme",

            [],

            {

                title: {

                    text:
                        "Sinais de alarme",

                    x:
                        0.02,

                    font: {
                        size: 16
                    }

                },


                annotations: [

                    {

                        text:
                            "Sem casos classificados como dengue com sinais de alarme no período",

                        x:
                            0.5,

                        y:
                            0.5,

                        xref:
                            "paper",

                        yref:
                            "paper",

                        showarrow:
                            false,

                        align:
                            "center",

                        font: {
                            size: 14
                        }

                    }

                ],


                xaxis: {
                    visible: false
                },

                yaxis: {
                    visible: false
                },


                margin: {

                    l: 30,
                    r: 30,
                    t: 65,
                    b: 30

                },


                paper_bgcolor:
                    "rgba(0,0,0,0)",

                plot_bgcolor:
                    "rgba(0,0,0,0)"

            },

            {

                responsive:
                    true,

                displaylogo:
                    false

            }

        );

        return;
    }


    // ------------------------------------------------------
    // ORDENAR DO MAIS FREQUENTE PARA O MENOS FREQUENTE
    // ------------------------------------------------------

    dadosTratados.sort(
        (a, b) =>
            b.casos - a.casos
    );


    // ------------------------------------------------------
    // PERCENTUAIS
    // ------------------------------------------------------

    const percentuais =
        dadosTratados.map(
            d =>
                d.percentual
                .toFixed(1)
                .replace(".", ",")
                + "%"
        );


    // ------------------------------------------------------
    // GRÁFICO
    // ------------------------------------------------------

    const trace = {

        y:
            dadosTratados.map(
                d => d.indicador
            ),

        x:
            dadosTratados.map(
                d => d.casos
            ),

        type:
            "bar",

        orientation:
            "h",

        text:
            percentuais,

        textposition:
            "auto",

        customdata:
            dadosTratados.map(
                d => [

                    d.denominador,

                    d.percentual
                        .toFixed(1)
                        .replace(".", ",")

                ]
            ),

        hovertemplate:
            "<b>%{y}</b><br>" +
            "Casos: %{x}<br>" +
            "Casos com sinais de alarme: %{customdata[0]}<br>" +
            "Percentual: %{customdata[1]}%" +
            "<extra></extra>"

    };


    const layout = {

        title: {

            text:
                `Sinais de alarme — ${denominador} casos classificados`,

            x:
                0.02,

            font: {
                size: 16
            }

        },


        margin: {

            l:
                230,

            r:
                40,

            t:
                75,

            b:
                55

        },


        xaxis: {

            title:
                "Casos",

            rangemode:
                "tozero",

            nticks:
                8

        },


        yaxis: {

            title: "",

            autorange:
                "reversed"

        },


        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        showlegend:
            false

    };


    Plotly.react(

        "grafico-sinais-alarme",

        [trace],

        layout,

        {

            responsive:
                true,

            displaylogo:
                false,

            modeBarButtonsToRemove: [
                "lasso2d",
                "select2d"
            ]

        }

    );

}


// ==========================================================
// CRITÉRIOS DE GRAVIDADE
// ==========================================================

function atualizarGraficoGravidade() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;


    const dados =
        obterPerfilClinico(
            territorio,
            "CRITERIO_GRAVIDADE"
        );


    // ------------------------------------------------------
    // TRATAR DADOS
    // ------------------------------------------------------

    const dadosTratados =
        dados.map(
            linha => ({

                indicador:
                    linha.INDICADOR,

                casos:
                    Number(
                        linha.CASOS
                    ) || 0,

                denominador:
                    Number(
                        linha.DENOMINADOR
                    ) || 0,

                percentual:
                    Number(
                        linha.PERCENTUAL
                    ) || 0

            })
        );


    // ------------------------------------------------------
    // DENOMINADOR
    // ------------------------------------------------------

    const denominador =
        dadosTratados.length > 0
        ? dadosTratados[0].denominador
        : 0;


    // ------------------------------------------------------
    // SEM CASOS GRAVES
    // ------------------------------------------------------

    if (denominador === 0) {

        Plotly.react(

            "grafico-gravidade",

            [],

            {

                title: {

                    text:
                        "Critérios de gravidade",

                    x:
                        0.02,

                    font: {
                        size: 16
                    }

                },


                annotations: [

                    {

                        text:
                            "Sem casos de dengue grave no período",

                        x:
                            0.5,

                        y:
                            0.5,

                        xref:
                            "paper",

                        yref:
                            "paper",

                        showarrow:
                            false,

                        font: {
                            size: 15
                        }

                    }

                ],


                xaxis: {
                    visible: false
                },

                yaxis: {
                    visible: false
                },


                margin: {

                    l: 30,
                    r: 30,
                    t: 65,
                    b: 30

                },


                paper_bgcolor:
                    "rgba(0,0,0,0)",

                plot_bgcolor:
                    "rgba(0,0,0,0)"

            },

            {

                responsive:
                    true,

                displaylogo:
                    false

            }

        );

        return;
    }


    // ------------------------------------------------------
    // MOSTRAR APENAS CRITÉRIOS PRESENTES
    // ------------------------------------------------------

    const criteriosPresentes =
        dadosTratados
        .filter(
            d => d.casos > 0
        )
        .sort(
            (a, b) =>
                b.casos - a.casos
        );


    // ------------------------------------------------------
    // CASO EXCEPCIONAL:
    // HÁ CASOS GRAVES, MAS NENHUM CRITÉRIO NO ARQUIVO
    // ------------------------------------------------------

    if (criteriosPresentes.length === 0) {

        Plotly.react(

            "grafico-gravidade",

            [],

            {

                title: {

                    text:
                        `Critérios de gravidade — ${denominador} casos graves`,

                    x:
                        0.02,

                    font: {
                        size: 16
                    }

                },


                annotations: [

                    {

                        text:
                            "Não há critérios de gravidade disponíveis no arquivo agregado",

                        x:
                            0.5,

                        y:
                            0.5,

                        xref:
                            "paper",

                        yref:
                            "paper",

                        showarrow:
                            false,

                        font: {
                            size: 14
                        }

                    }

                ],


                xaxis: {
                    visible: false
                },

                yaxis: {
                    visible: false
                },


                paper_bgcolor:
                    "rgba(0,0,0,0)",

                plot_bgcolor:
                    "rgba(0,0,0,0)"

            },

            {
                responsive: true,
                displaylogo: false
            }

        );

        return;
    }


    // ------------------------------------------------------
    // GRÁFICO
    // ------------------------------------------------------

    const trace = {

        y:
            criteriosPresentes.map(
                d => d.indicador
            ),

        x:
            criteriosPresentes.map(
                d => d.casos
            ),

        type:
            "bar",

        orientation:
            "h",


        // Mostrar número absoluto na barra
        text:
            criteriosPresentes.map(
                d =>
                    d.casos === 1
                    ? "1 caso"
                    : `${d.casos} casos`
            ),

        textposition:
            "auto",


        // Percentual fica no hover
        customdata:
            criteriosPresentes.map(
                d => [

                    d.denominador,

                    d.percentual
                        .toFixed(1)
                        .replace(".", ",")

                ]
            ),


        hovertemplate:
            "<b>%{y}</b><br>" +
            "Casos: %{x}<br>" +
            "Total de casos graves: %{customdata[0]}<br>" +
            "Percentual entre os casos graves: %{customdata[1]}%" +
            "<extra></extra>"

    };


    const layout = {

        title: {

            text:
                `Critérios de gravidade — ${denominador} casos graves`,

            x:
                0.02,

            font: {
                size: 16
            }

        },


        margin: {

            l:
                300,

            r:
                40,

            t:
                75,

            b:
                55

        },


        xaxis: {

            title:
                "Número de casos",

            rangemode:
                "tozero",

            dtick:
                1

        },


        yaxis: {

            title: "",

            autorange:
                "reversed"

        },


        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        showlegend:
            false

    };


    Plotly.react(

        "grafico-gravidade",

        [trace],

        layout,

        {

            responsive:
                true,

            displaylogo:
                false,

            modeBarButtonsToRemove: [
                "lasso2d",
                "select2d"
            ]

        }

    );

}


// ==========================================================
// LABORATÓRIO E SOROTIPOS
// ==========================================================


// ----------------------------------------------------------
// RESULTADOS LABORATORIAIS — REGIONAL
// ----------------------------------------------------------

function atualizarGraficoLaboratorio() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;


    // ------------------------------------------------------
    // FILTRAR RESULTADOS LABORATORIAIS DO TERRITÓRIO
    // ------------------------------------------------------

    const dados =
        laboratorioSorotipos.filter(
            linha =>
                linha.TIPO ===
                "RESULTADO_LABORATORIAL"
                &&
                linha.TERRITORIO === territorio
        );


    const testes = [
        "NS1",
        "RT-PCR",
        "IgM"
    ];


    // ------------------------------------------------------
    // CATEGORIAS DOS RESULTADOS
    // ------------------------------------------------------

    const resultadosPossiveis = [
        "Positivo",
        "Negativo",
        "Reagente",
        "Não reagente",
        "Inconclusivo",
        "Não realizado",
        "Sem preenchimento"
    ];


    // ------------------------------------------------------
    // CORES
    // Mantemos a lógica visual do painel
    // ------------------------------------------------------

    const cores = {
        "Positivo": "#2E7D32",
        "Reagente": "#2E7D32",

        "Negativo": "#C62828",
        "Não reagente": "#C62828",

        "Inconclusivo": "#F9A825",

        "Não realizado": "#90A4AE",

        "Sem preenchimento": "#BDBDBD"
    };


    // ------------------------------------------------------
    // CRIAR UMA TRACE PARA CADA RESULTADO
    // ------------------------------------------------------

    const traces = [];

    resultadosPossiveis.forEach(
        resultado => {

            const valores =
                testes.map(
                    teste => {

                        const registro =
                            dados.find(
                                linha =>
                                    linha.CATEGORIA === teste
                                    &&
                                    linha.RESULTADO === resultado
                            );

                        return registro
                            ? Number(registro.CASOS)
                            : 0;
                    }
                );


            // Não criar série totalmente zerada
            if (
                valores.some(
                    valor => valor > 0
                )
            ) {

                traces.push({

                    x: testes,

                    y: valores,

                    name: resultado,

                    type: "bar",

                    marker: {
                        color:
                            cores[resultado]
                    },

                    hovertemplate:
                        "<b>%{x}</b><br>" +
                        resultado +
                        ": %{y:,}<extra></extra>"

                });

            }

        }
    );


    // ------------------------------------------------------
    // CASO NÃO HAJA DADOS
    // ------------------------------------------------------

    if (dados.length === 0) {

        Plotly.react(

            "grafico-laboratorio",

            [],

            {
                title: {
                    text:
                        "Resultados dos exames laboratoriais",
                    x: 0.02,
                    font: {
                        size: 16
                    }
                },

                annotations: [
                    {
                        text:
                            "Sem dados laboratoriais disponíveis para o território selecionado",
                        x: 0.5,
                        y: 0.5,
                        xref: "paper",
                        yref: "paper",
                        showarrow: false,
                        font: {
                            size: 14
                        }
                    }
                ],

                xaxis: {
                    visible: false
                },

                yaxis: {
                    visible: false
                },

                margin: {
                    l: 40,
                    r: 20,
                    t: 60,
                    b: 40
                },

                paper_bgcolor:
                    "rgba(0,0,0,0)",

                plot_bgcolor:
                    "rgba(0,0,0,0)"
            },

            {
                responsive: true,
                displaylogo: false
            }

        );

        return;
    }


    // ------------------------------------------------------
    // TÍTULO DINÂMICO
    // ------------------------------------------------------

    const nomeTerritorio =
        territorio === "REGIONAL"
            ? "Regional"
            : territorio;


    // ------------------------------------------------------
    // LAYOUT
    // ------------------------------------------------------

    const layout = {

        title: {
            text:
                `Resultados dos exames laboratoriais — ${nomeTerritorio}`,
            x: 0.02,
            font: {
                size: 16
            }
        },

        barmode: "stack",

        margin: {
            l: 60,
            r: 20,
            t: 65,
            b: 60
        },

        xaxis: {
            title: {
                text: "Exame"
            },
            fixedrange: true
        },

        yaxis: {
            title: {
                text: "Número de casos"
            },
            rangemode: "tozero",
            fixedrange: true
        },

        legend: {
            orientation: "h",
            y: -0.20,
            x: 0
        },

        hovermode: "closest",

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)"
    };


    // ------------------------------------------------------
    // DESENHAR
    // ------------------------------------------------------

    Plotly.react(

        "grafico-laboratorio",

        traces,

        layout,

        {
            responsive: true,
            displaylogo: false
        }

    );

}



function atualizarGraficoSorotipos() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;


    // ------------------------------------------------------
    // FILTRAR SOROTIPOS DO TERRITÓRIO
    //
    // Estrutura real do CSV:
    // CATEGORIA = RT-PCR
    // RESULTADO = DENV-1 / DENV-2 / DENV-3 / DENV-4
    // ------------------------------------------------------

    const dados =
        laboratorioSorotipos.filter(
            linha =>
                linha.TIPO === "SOROTIPO_TERRITORIO"
                &&
                linha.TERRITORIO === territorio
                &&
                linha.CATEGORIA === "RT-PCR"
        );


    const ordem = [
        "DENV-1",
        "DENV-2",
        "DENV-3",
        "DENV-4"
    ];


    // ------------------------------------------------------
    // BUSCAR SOROTIPO NA COLUNA RESULTADO
    // ------------------------------------------------------

    const valores =
        ordem.map(
            sorotipo => {

                const registro =
                    dados.find(
                        d =>
                            d.RESULTADO === sorotipo
                    );

                return registro
                    ? Number(
                        registro.CASOS
                      ) || 0
                    : 0;

            }
        );


    const total =
        valores.reduce(
            (a, b) => a + b,
            0
        );


    // ------------------------------------------------------
    // SEM SOROTIPO IDENTIFICADO
    // ------------------------------------------------------

    if (total === 0) {

        Plotly.react(

            "grafico-sorotipos",

            [],

            {

                title: {

                    text:
                        "Sorotipos identificados por RT-PCR",

                    x:
                        0.02,

                    font: {
                        size: 16
                    }

                },

                annotations: [

                    {

                        text:
                            "Nenhum sorotipo identificado por RT-PCR no território selecionado",

                        x:
                            0.5,

                        y:
                            0.5,

                        xref:
                            "paper",

                        yref:
                            "paper",

                        showarrow:
                            false,

                        align:
                            "center",

                        font: {
                            size: 14
                        }

                    }

                ],

                xaxis: {
                    visible: false
                },

                yaxis: {
                    visible: false
                },

                margin: {
                    l: 30,
                    r: 30,
                    t: 65,
                    b: 30
                },

                paper_bgcolor:
                    "rgba(0,0,0,0)",

                plot_bgcolor:
                    "rgba(0,0,0,0)"

            },

            {

                responsive:
                    true,

                displaylogo:
                    false

            }

        );

        return;
    }


    // ------------------------------------------------------
    // MOSTRAR SOMENTE SOROTIPOS IDENTIFICADOS
    // ------------------------------------------------------

    const dadosPresentes =
        ordem
        .map(
            (sorotipo, i) => ({

                sorotipo:
                    sorotipo,

                casos:
                    valores[i]

            })
        )
        .filter(
            d =>
                d.casos > 0
        );


    // ------------------------------------------------------
    // GRÁFICO
    // ------------------------------------------------------

    const trace = {

        x:
            dadosPresentes.map(
                d => d.sorotipo
            ),

        y:
            dadosPresentes.map(
                d => d.casos
            ),

        type:
            "bar",

        text:
            dadosPresentes.map(
                d =>
                    formatarInteiro(
                        d.casos
                    )
            ),

        textposition:
            "auto",

        hovertemplate:
            "<b>%{x}</b><br>" +
            "Amostras com sorotipo identificado: %{y}" +
            "<extra></extra>"

    };


    const layout = {

        title: {

            text:
                `Sorotipos identificados por RT-PCR — ${formatarInteiro(total)} amostras`,

            x:
                0.02,

            font: {
                size: 16
            }

        },

        margin: {
            l: 70,
            r: 30,
            t: 75,
            b: 65
        },

        xaxis: {

            title:
                "Sorotipo",

            categoryorder:
                "array",

            categoryarray:
                ordem
        },

        yaxis: {

            title:
                "Amostras com sorotipo identificado",

            rangemode:
                "tozero"
        },

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        showlegend:
            false

    };


    Plotly.react(

        "grafico-sorotipos",

        [trace],

        layout,

        {

            responsive:
                true,

            displaylogo:
                false

        }

    );

}


// ----------------------------------------------------------
// ATUALIZAR BLOCO LABORATORIAL
// ----------------------------------------------------------

function atualizarLaboratorio() {

    atualizarGraficoLaboratorio();
    atualizarGraficoSorotipos();
    atualizarGraficoSorotiposSE();

}


// ==========================================================
// SOROTIPOS POR SEMANA EPIDEMIOLÓGICA DE DIAGNÓSTICO
// ==========================================================

function atualizarGraficoSorotiposSE() {

    const ultimaSE =
        Number(
            metadados.ultima_se_diagnostico
        ) || 53;


    // ------------------------------------------------------
    // FILTRAR SÉRIE TEMPORAL DE SOROTIPOS
    //
    // Estrutura do CSV:
    // TIPO = SOROTIPO_SE
    // TERRITORIO = REGIONAL
    // RESULTADO = DENV-1 ... DENV-4
    // SE_DIAGNOSTICO = semana
    // ------------------------------------------------------

    const dados =
        laboratorioSorotipos.filter(
            linha =>
                linha.TIPO === "SOROTIPO_SE"
                &&
                linha.TERRITORIO === "REGIONAL"
                &&
                Number(linha.SE_DIAGNOSTICO) <= ultimaSE
        );


    const ordem = [
        "DENV-1",
        "DENV-2",
        "DENV-3",
        "DENV-4"
    ];


    const traces = [];


    // ------------------------------------------------------
    // CRIAR UMA SÉRIE PARA CADA SOROTIPO IDENTIFICADO
    // ------------------------------------------------------

    ordem.forEach(
        sorotipo => {

            const dadosSorotipo =
                dados
                .filter(
                    d =>
                        d.RESULTADO === sorotipo
                )
                .sort(
                    (a, b) =>
                        Number(a.SE_DIAGNOSTICO)
                        -
                        Number(b.SE_DIAGNOSTICO)
                );


            const totalSorotipo =
                dadosSorotipo.reduce(
                    (soma, d) =>
                        soma +
                        (Number(d.CASOS) || 0),
                    0
                );


            // Não criar linha para sorotipo nunca identificado
            if (totalSorotipo === 0) {
                return;
            }


            traces.push({

                x:
                    dadosSorotipo.map(
                        d =>
                            Number(
                                d.SE_DIAGNOSTICO
                            )
                    ),

                y:
                    dadosSorotipo.map(
                        d =>
                            Number(
                                d.CASOS
                            ) || 0
                    ),

                name:
                    sorotipo,

                type:
                    "scatter",

                mode:
                    "lines+markers",

                line: {
                    width: 3
                },

                marker: {
                    size: 7
                },

                hovertemplate:
                    "<b>" + sorotipo + "</b><br>" +
                    "SE de diagnóstico: %{x}<br>" +
                    "Amostras: %{y}" +
                    "<extra></extra>"

            });

        }
    );


    // ------------------------------------------------------
    // CASO NÃO HAJA SOROTIPO IDENTIFICADO
    // ------------------------------------------------------

    if (traces.length === 0) {

        Plotly.react(

            "grafico-sorotipos-se",

            [],

            {

                title: {
                    text:
                        "Distribuição temporal dos sorotipos",
                    x: 0.02
                },

                annotations: [
                    {
                        text:
                            "Nenhum sorotipo identificado por RT-PCR no período",
                        x: 0.5,
                        y: 0.5,
                        xref: "paper",
                        yref: "paper",
                        showarrow: false
                    }
                ],

                xaxis: {
                    visible: false
                },

                yaxis: {
                    visible: false
                },

                paper_bgcolor:
                    "rgba(0,0,0,0)",

                plot_bgcolor:
                    "rgba(0,0,0,0)"

            },

            {
                responsive: true,
                displaylogo: false
            }

        );

        return;
    }


    // ------------------------------------------------------
    // TOTAL DE AMOSTRAS COM SOROTIPO IDENTIFICADO
    // ------------------------------------------------------

    const total =
        dados.reduce(
            (soma, d) =>
                soma +
                (Number(d.CASOS) || 0),
            0
        );


    // ------------------------------------------------------
    // LAYOUT
    // ------------------------------------------------------

    const layout = {

        title: {

            text:
                `Sorotipos identificados por RT-PCR segundo SE de diagnóstico — ${formatarInteiro(total)} amostras`,

            x:
                0.02,

            font: {
                size: 16
            }

        },


        margin: {

            l: 70,
            r: 40,
            t: 80,
            b: 70

        },


        xaxis: {

            title:
                "Semana epidemiológica de diagnóstico",

            range:
                [0.5, 53.5],

            dtick:
                2,

            tick0:
                1

        },


        yaxis: {

            title:
                "Amostras com sorotipo identificado",

            rangemode:
                "tozero",

            dtick:
                5

        },


        legend: {

            orientation:
                "h",

            x:
                0,

            y:
                -0.20

        },


        shapes: [

            {

                type:
                    "line",

                x0:
                    ultimaSE + 0.5,

                x1:
                    ultimaSE + 0.5,

                y0:
                    0,

                y1:
                    1,

                xref:
                    "x",

                yref:
                    "paper",

                line: {

                    width:
                        1,

                    dash:
                        "dot"

                }

            }

        ],


        annotations: [

            {

                text:
                    `Dados disponíveis até a SE ${ultimaSE}`,

                x:
                    ultimaSE,

                y:
                    1.08,

                xref:
                    "x",

                yref:
                    "paper",

                showarrow:
                    false,

                xanchor:
                    "right",

                font: {
                    size: 11
                }

            },


            {

                text:
                    "Semanas ainda não disponíveis",

                x:
                    (ultimaSE + 53) / 2,

                y:
                    0.50,

                xref:
                    "x",

                yref:
                    "paper",

                showarrow:
                    false,

                textangle:
                    -90,

                font: {
                    size: 11
                }

            }

        ],


        hovermode:
            "x unified",


        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)"

    };


    Plotly.react(

        "grafico-sorotipos-se",

        traces,

        layout,

        {

            responsive:
                true,

            displaylogo:
                false,

            modeBarButtonsToRemove: [
                "lasso2d",
                "select2d"
            ]

        }

    );

}


// ==========================================================
// QUALIDADE DA VIGILÂNCIA
// ==========================================================

function obterIndicadorQualidade(
    territorio,
    indicador
) {

    const registro =
        qualidadeVigilancia.find(
            linha =>
                linha.TERRITORIO === territorio
                &&
                linha.INDICADOR === indicador
        );

    if (!registro) {

        return {
            casos: 0,
            denominador: null,
            percentual: null
        };

    }


    const denominador =
        registro.DENOMINADOR === ""
        || registro.DENOMINADOR === null
        || registro.DENOMINADOR === undefined
        ? null
        : Number(registro.DENOMINADOR);


    const percentual =
        registro.PERCENTUAL === ""
        || registro.PERCENTUAL === null
        || registro.PERCENTUAL === undefined
        ? null
        : Number(registro.PERCENTUAL);


    return {

        casos:
            Number(registro.CASOS) || 0,

        denominador:
            Number.isFinite(denominador)
            ? denominador
            : null,

        percentual:
            Number.isFinite(percentual)
            ? percentual
            : null

    };

}


// ----------------------------------------------------------
// OPORTUNIDADE DE ENCERRAMENTO
// ----------------------------------------------------------

function atualizarGraficoEncerramento() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;


    const oportunos =
        obterIndicadorQualidade(
            territorio,
            "Encerrados em até 60 dias"
        );


    const atrasados =
        obterIndicadorQualidade(
            territorio,
            "Encerrados após 60 dias"
        );


    const vencidos =
        obterIndicadorQualidade(
            territorio,
            "Abertos com prazo vencido"
        );


    const denominador =
        oportunos.denominador
        ??
        atrasados.denominador
        ??
        vencidos.denominador
        ??
        0;


    if (denominador === 0) {

        Plotly.react(

            "grafico-encerramento",

            [],

            {

                title: {
                    text:
                        "Oportunidade de encerramento",
                    x: 0.02
                },

                annotations: [
                    {
                        text:
                            "Sem casos avaliáveis para o indicador",
                        x: 0.5,
                        y: 0.5,
                        xref: "paper",
                        yref: "paper",
                        showarrow: false
                    }
                ],

                xaxis: {
                    visible: false
                },

                yaxis: {
                    visible: false
                },

                paper_bgcolor:
                    "rgba(0,0,0,0)",

                plot_bgcolor:
                    "rgba(0,0,0,0)"

            },

            {
                responsive: true,
                displaylogo: false
            }

        );

        return;
    }


    const categorias = [
        "Encerrados em até 60 dias",
        "Encerrados após 60 dias",
        "Abertos com prazo vencido"
    ];


    const valores = [
        oportunos.casos,
        atrasados.casos,
        vencidos.casos
    ];


    const percentuais =
        valores.map(
            valor =>
                denominador > 0
                ? valor / denominador * 100
                : 0
        );


    const trace = {

        y:
            categorias,

        x:
            valores,

        type:
            "bar",

        orientation:
            "h",

        text:
            percentuais.map(
                (p, i) =>
                    `${formatarInteiro(valores[i])} (${p
                        .toFixed(1)
                        .replace(".", ",")}%)`
            ),

        textposition:
            "auto",

        customdata:
            percentuais.map(
                p =>
                    p.toFixed(1)
                     .replace(".", ",")
            ),

        hovertemplate:
            "<b>%{y}</b><br>" +
            "Casos: %{x}<br>" +
            "Percentual: %{customdata}%<br>" +
            `Casos avaliáveis: ${denominador}` +
            "<extra></extra>"

    };


    const layout = {

        title: {

            text:
                `Oportunidade de encerramento — ${formatarInteiro(denominador)} casos avaliáveis`,

            x:
                0.02,

            font: {
                size: 16
            }

        },

        margin: {
            l: 210,
            r: 40,
            t: 75,
            b: 55
        },

        xaxis: {

            title:
                "Notificações",

            rangemode:
                "tozero"
        },

        yaxis: {

            autorange:
                "reversed",

            title: ""
        },

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        showlegend:
            false

    };


    Plotly.react(

        "grafico-encerramento",

        [trace],

        layout,

        {
            responsive: true,
            displaylogo: false
        }

    );

}


// ----------------------------------------------------------
// PENDÊNCIAS E INCONSISTÊNCIAS
// ----------------------------------------------------------

function atualizarPendenciasQualidade() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;


    const investigacao =
        obterIndicadorQualidade(
            territorio,
            "Em investigação há mais de 60 dias"
        );


    const sorotipoInconsistente =
        obterIndicadorQualidade(
            territorio,
            "Sorotipo preenchido com RT-PCR não positivo"
        );


    const pcrSemSorotipo =
        obterIndicadorQualidade(
            territorio,
            "RT-PCR positivo sem sorotipo identificado"
        );


    const container =
        document.getElementById(
            "cards-qualidade"
        );


    if (!container) {
        return;
    }


    function percentualTexto(item) {

        if (
            item.percentual === null
            ||
            !Number.isFinite(item.percentual)
        ) {
            return "";
        }

        return `
            <div class="kpi-detalhe">
                ${item.percentual
                    .toFixed(1)
                    .replace(".", ",")}%
            </div>
        `;
    }


    container.innerHTML = `

        <div class="card">

            <div class="kpi-titulo">
                Investigação &gt; 60 dias
            </div>

            <div class="kpi-valor">
                ${formatarInteiro(
                    investigacao.casos
                )}
            </div>

            <div class="kpi-detalhe">
                Casos ainda em investigação
                com prazo superior a 60 dias
            </div>

        </div>


        <div class="card">

            <div class="kpi-titulo">
                Sorotipo × RT-PCR inconsistente
            </div>

            <div class="kpi-valor">
                ${formatarInteiro(
                    sorotipoInconsistente.casos
                )}
            </div>

            ${percentualTexto(
                sorotipoInconsistente
            )}

            <div class="kpi-detalhe">
                Sorotipo preenchido em registro
                sem RT-PCR positivo
            </div>

        </div>


        <div class="card">

            <div class="kpi-titulo">
                RT-PCR positivo sem sorotipo
            </div>

            <div class="kpi-valor">
                ${formatarInteiro(
                    pcrSemSorotipo.casos
                )}
            </div>

            ${percentualTexto(
                pcrSemSorotipo
            )}

            <div class="kpi-detalhe">
                RT-PCR positivo sem identificação
                de sorotipo registrada
            </div>

        </div>

    `;

}


// ----------------------------------------------------------
// ATUALIZAR BLOCO
// ----------------------------------------------------------

function atualizarQualidadeVigilancia() {

    atualizarGraficoEncerramento();
    atualizarPendenciasQualidade();

}


// ==========================================================
// DIAGRAMA DE CONTROLE DA DENGUE
// ==========================================================

// ----------------------------------------------------------
// Conversão numérica robusta
// Aceita tanto 164.75 quanto 164,75
// ----------------------------------------------------------

function numeroDiagrama(valor) {

    if (
        valor === null
        ||
        valor === undefined
        ||
        valor === ""
    ) {
        return null;
    }

    const convertido =
        Number(
            String(valor)
            .trim()
            .replace(",", ".")
        );

    return Number.isFinite(convertido)
        ? convertido
        : null;

}


// ----------------------------------------------------------
// Normalização simples para comparar municípios
// ----------------------------------------------------------

function normalizarMunicipioDiagrama(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase();

}


// ----------------------------------------------------------
// OBTER REFERÊNCIA DO TERRITÓRIO
// ----------------------------------------------------------

function obterReferenciaDiagrama(territorio) {

    // ======================================================
    // REGIONAL
    // ======================================================

    if (territorio === "REGIONAL") {

        return referenciaRegional
            .map(
                linha => ({

                    se:
                        numeroDiagrama(
                            linha.SE
                        ),

                    mediana:
                        numeroDiagrama(
                            linha.Mediana
                        ),

                    q1:
                        numeroDiagrama(
                            linha["Q1"]
                        ),

                    q3:
                        numeroDiagrama(
                            linha["Q3"]
                        )

                })
            )
            .filter(
                d =>
                    d.se !== null
            )
            .sort(
                (a, b) =>
                    a.se - b.se
            );

    }


    // ======================================================
    // MUNICÍPIO
    // ======================================================

    const territorioNormalizado =
        normalizarMunicipioDiagrama(
            territorio
        );


    return diagramaMunicipal
        .filter(
            linha =>
                normalizarMunicipioDiagrama(
                    linha["Municipio"]
                )
                ===
                territorioNormalizado
        )
        .map(
            linha => ({

                se:
                    numeroDiagrama(
                        linha.SE
                    ),

                mediana:
                    numeroDiagrama(
                        linha.Mediana
                    ),

                q1:
                    numeroDiagrama(
                        linha["Q1"]
                    ),

                q3:
                    numeroDiagrama(
                        linha["Q3"]
                    )

            })
        )
        .filter(
            d =>
                d.se !== null
        )
        .sort(
            (a, b) =>
                a.se - b.se
        );

}


// ----------------------------------------------------------
// OBTER CASOS OBSERVADOS
//
// IMPORTANTE:
// usamos serie_temporal.csv, portanto os casos permanecem
// baseados na SEMANA EPIDEMIOLÓGICA DE DIAGNÓSTICO.
// ----------------------------------------------------------

function obterCasosDiagrama(
    territorio,
    ultimaSE
) {

    return serieTemporal
        .filter(
            linha =>
                linha.MUNICIPIO === territorio
                &&
                Number(
                    linha.SE_DIAGNOSTICO
                ) <= ultimaSE
        )
        .map(
            linha => ({

                se:
                    Number(
                        linha.SE_DIAGNOSTICO
                    ),

                casos:
                    Number(
                        linha.CASOS_PROVAVEIS
                    ) || 0

            })
        )
        .sort(
            (a, b) =>
                a.se - b.se
        );

}


// ----------------------------------------------------------
// ATUALIZAR DIAGRAMA
// ----------------------------------------------------------

function atualizarDiagramaControle() {

    const territorio =
        document.getElementById(
            "filtro-municipio"
        ).value;


    const ultimaSE =
        Number(
            metadados.ultima_se_diagnostico
        ) || 53;


    const referencia =
        obterReferenciaDiagrama(
            territorio
        );


    const observados =
        obterCasosDiagrama(
            territorio,
            ultimaSE
        );


    // ------------------------------------------------------
    // SEM REFERÊNCIA
    // ------------------------------------------------------

    if (referencia.length === 0) {

        Plotly.react(

            "grafico-diagrama-controle",

            [],

            {

                title: {
                    text:
                        "Diagrama de Controle",
                    x: 0.02
                },

                annotations: [
                    {
                        text:
                            "Referência histórica não disponível para o território selecionado",
                        x: 0.5,
                        y: 0.5,
                        xref: "paper",
                        yref: "paper",
                        showarrow: false
                    }
                ],

                xaxis: {
                    visible: false
                },

                yaxis: {
                    visible: false
                },

                paper_bgcolor:
                    "rgba(0,0,0,0)",

                plot_bgcolor:
                    "rgba(0,0,0,0)"

            },

            {
                responsive: true,
                displaylogo: false
            }

        );

        return;
    }


    // ------------------------------------------------------
    // REFERÊNCIA HISTÓRICA
    // ------------------------------------------------------

    const semanas =
        referencia.map(
            d => d.se
        );


    const mediana =
        referencia.map(
            d => d.mediana
        );


    const q1 =
        referencia.map(
            d => d.q1
        );


    const q3 =
        referencia.map(
            d => d.q3
        );


    // ------------------------------------------------------
    // CASOS OBSERVADOS
    // ------------------------------------------------------

    const semanasObservadas =
        observados.map(
            d => d.se
        );


    const casosObservados =
        observados.map(
            d => d.casos
        );


    // ------------------------------------------------------
    // IDENTIFICAR PONTOS ACIMA DO Q3
    // ------------------------------------------------------

    const mapaQ3 =
        new Map(
            referencia.map(
                d => [
                    Number(d.se),
                    Number(d.q3)
                ]
            )
        );


    const acimaQ3 =
        observados.filter(
            d => {

                const limite =
                    mapaQ3.get(
                        Number(d.se)
                    );

                return (
                    Number.isFinite(limite)
                    &&
                    d.casos > limite
                );

            }
        );


    // ------------------------------------------------------
    // TRACES
    // ------------------------------------------------------

    
    // ------------------------------------------------------
    // CANAL ENDÊMICO COLORIDO
    //
    // Faixas:
    // 0 → Q1
    // Q1 → Mediana
    // Mediana → Q3
    // acima do Q3
    // ------------------------------------------------------

    const traceBase = {

        x: semanas,
        y: semanas.map(() => 0),

        type: "scatter",
        mode: "lines",

        line: {
            width: 0
        },

        hoverinfo: "skip",
        showlegend: false

    };


    // ------------------------------------------------------
    // FAIXA 0 → Q1
    // ------------------------------------------------------

    const traceQ1 = {

        x: semanas,
        y: q1,

        type: "scatter",
        mode: "lines",

        name: "Q1",

        line: {
            color: "rgba(46, 125, 50, 0.85)",
            width: 1.5
        },

        fill: "tonexty",
        fillcolor: "rgba(76, 175, 80, 0.24)",

        hovertemplate:
            "SE %{x}<br>" +
            "Q1: %{y:.1f}" +
            "<extra></extra>"

    };


    // ------------------------------------------------------
    // FAIXA Q1 → MEDIANA
    // ------------------------------------------------------

    const traceMediana = {

        x: semanas,
        y: mediana,

        type: "scatter",
        mode: "lines",

        name: "Mediana",

        line: {
            color: "rgba(210, 160, 0, 0.95)",
            width: 1.8,
            dash: "dash"
        },

        fill: "tonexty",
        fillcolor: "rgba(255, 215, 0, 0.20)",

        hovertemplate:
            "SE %{x}<br>" +
            "Mediana: %{y:.1f}" +
            "<extra></extra>"

    };


    // ------------------------------------------------------
    // FAIXA MEDIANA → Q3
    // ------------------------------------------------------

    const traceQ3 = {

        x: semanas,
        y: q3,

        type: "scatter",
        mode: "lines",

        name: "Q3",

        line: {
            color: "rgba(230, 126, 34, 0.95)",
            width: 2
        },

        fill: "tonexty",
        fillcolor: "rgba(255, 152, 0, 0.22)",

        hovertemplate:
            "SE %{x}<br>" +
            "Q3: %{y:.1f}" +
            "<extra></extra>"

    };


    // ------------------------------------------------------
    // LIMITE SUPERIOR VISUAL PARA A FAIXA ACIMA DO Q3
    //
    // Serve somente para colorir a área acima do Q3.
    // Não representa um novo indicador epidemiológico.
    // ------------------------------------------------------

    const maiorReferencia = Math.max(
        ...q3.filter(
            valor => Number.isFinite(valor)
        ),
        ...casosObservados.filter(
            valor => Number.isFinite(valor)
        ),
        1
    );


    const tetoCanal =
        maiorReferencia * 1.12;


    const traceAcimaQ3 = {

        x: semanas,
        y: semanas.map(
            () => tetoCanal
        ),

        type: "scatter",
        mode: "lines",

        line: {
            width: 0
        },

        fill: "tonexty",
        fillcolor: "rgba(244, 67, 54, 0.08)",

        hoverinfo: "skip",
        showlegend: false

    };


const traceCasos = {

        x:
            semanasObservadas,

        y:
            casosObservados,

        type:
            "scatter",

        mode:
            "lines+markers",

        name:
            `Casos prováveis ${metadados.ano}`,

        line: {
            color: "#1565C0",
            width: 3.5
        },

        marker: {
            color: "#1565C0",
            size: 7
        },

        hovertemplate:
            "<b>Casos prováveis</b><br>" +
            "SE de diagnóstico: %{x}<br>" +
            "Casos: %{y}" +
            "<extra></extra>"

    };


    const traces = [
        traceBase,
        traceQ1,
        traceMediana,
        traceQ3,
        traceAcimaQ3,
        traceCasos
    ];


    // ------------------------------------------------------
    // PONTOS ACIMA DO Q3
    // ------------------------------------------------------

    if (acimaQ3.length > 0) {

        traces.push({

            x:
                acimaQ3.map(
                    d => d.se
                ),

            y:
                acimaQ3.map(
                    d => d.casos
                ),

            type:
                "scatter",

            mode:
                "markers",

            name:
                "Acima do Q3",

            marker: {
                color: "#D32F2F",
                size: 11,
                symbol: "diamond",
                line: {
                    color: "#FFFFFF",
                    width: 1
                }
            },

            hovertemplate:
                "<b>Acima do Q3</b><br>" +
                "SE %{x}<br>" +
                "Casos: %{y}" +
                "<extra></extra>"

        });

    }


    // ------------------------------------------------------
    // LAYOUT
    // ------------------------------------------------------

    const layout = {

        title: {

            text:
                "Diagrama de Controle — casos prováveis por SE de diagnóstico",

            x:
                0.02,

            font: {
                size: 16
            }

        },


        margin: {
            l: 70,
            r: 40,
            t: 80,
            b: 80
        },


        xaxis: {

            title:
                "Semana epidemiológica de diagnóstico",

            range:
                [0.5, 53.5],

            tick0:
                1,

            dtick:
                2

        },


        yaxis: {

            title:
                "Casos prováveis",

            rangemode:
                "tozero"
        },


        legend: {

            orientation:
                "h",

            x:
                0,

            y:
                -0.20
        },


        shapes: [

            {

                type:
                    "line",

                x0:
                    ultimaSE + 0.5,

                x1:
                    ultimaSE + 0.5,

                y0:
                    0,

                y1:
                    1,

                xref:
                    "x",

                yref:
                    "paper",

                line: {
                    width: 1,
                    dash: "dot"
                }

            }

        ],


        annotations: [

            {

                text:
                    `Dados disponíveis até a SE ${ultimaSE}`,

                x:
                    ultimaSE,

                y:
                    1.07,

                xref:
                    "x",

                yref:
                    "paper",

                showarrow:
                    false,

                xanchor:
                    "right",

                font: {
                    size: 11
                }

            }

        ],


        hovermode:
            "x unified",


        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)"

    };


    Plotly.react(

        "grafico-diagrama-controle",

        traces,

        layout,

        {

            responsive:
                true,

            displaylogo:
                false,

            modeBarButtonsToRemove: [
                "lasso2d",
                "select2d"
            ]

        }

    );

}

