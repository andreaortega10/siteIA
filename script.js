
const aiToggle = document.getElementById("aiToggle");
const azureLabel = document.getElementById("azureLabel");
const geminiLabel = document.getElementById("geminiLabel");

const voiceButton = document.getElementById("voiceButton");
const voiceIcon = document.getElementById("voiceIcon");
const voiceListening = document.getElementById("voiceListening");

let recognition = null;
let isListening = false;

let historicoConversa = [];

const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const chatContainer = document.getElementById("chatContainer");
const chatEmptyState = document.getElementById("chatEmptyState");

const themeToggleButton = document.getElementById("themeToggleButton");
const themeToggleIcon = document.getElementById("themeToggleIcon");
const logoutButton = document.getElementById("logoutButton");

const warningToastElement = document.getElementById("warningToast");
const toastMessage = document.getElementById("toastMessage");
const warningToast = new bootstrap.Toast(warningToastElement);

const logoutModalElement = document.getElementById("logoutModal");
const logoutModal = new bootstrap.Modal(logoutModalElement);

let iaSelecionada = "azure";

// reconhecimento por palavra-chave
let wakeRecognition = null;
let wakeListening = false;
let modoEscutaAtiva = false;
const palavraChave = "ola web";
const wakeModeToggle = document.getElementById("wakeModeToggle");

wakeModeToggle.addEventListener("change", () => {

    modoEscutaAtiva = wakeModeToggle.checked;

    if (modoEscutaAtiva) {

        mostrarAviso("Escuta ativa ligada. Diga: Olá Web.");

        iniciarEscutaPalavraChave();

    } else {

        mostrarAviso("Escuta ativa desligada.");

        pararEscutaPalavraChave();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeAI();
    configurarReconhecimentoVoz();
    iniciarEscutaPalavraChave();
});

sendButton.addEventListener("click", enviarMensagem);

userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        enviarMensagem();
    }
});

themeToggleButton.addEventListener("click", alternarTema);

logoutButton.addEventListener("click", () => {
    logoutModal.show();
});

aiToggle.addEventListener("change", () => {
    iaSelecionada = aiToggle.checked ? "gemini" : "azure";

    atualizarTextoToggleIA();

    localStorage.setItem("webgen-ia", iaSelecionada);
});

voiceButton.addEventListener("click", alternarReconhecimentoVoz);

function configurarEscutaPalavraChave() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        mostrarAviso("Seu navegador não suporta escuta por palavra-chave.");
        return;
    }

    wakeRecognition = new SpeechRecognition();
    wakeRecognition.lang = "pt-BR";
    wakeRecognition.continuous = false;
    wakeRecognition.interimResults = false;

    wakeRecognition.onstart = () => {
        wakeListening = true;
        console.log("Escutando palavra-chave...");
    };

    wakeRecognition.onresult = (event) => {
        const resultado = event.results[0][0].transcript;

        const texto = resultado
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        console.log("Reconhecido na escuta ativa:", texto);

        if (texto.includes(palavraChave)) {
            responderAtivacaoPorVoz();
        }
    };

    wakeRecognition.onerror = (event) => {
        console.warn("Erro na escuta por palavra-chave:", event.error);
    };

    wakeRecognition.onend = () => {
        wakeListening = false;

        if (modoEscutaAtiva) {
            setTimeout(() => {
                iniciarEscutaPalavraChave();
            }, 800);
        }

        if (modoEscutaAtiva) {
            setTimeout(() => {
                iniciarEscutaPalavraChave();
            }, 800);
        }
    };
}

function iniciarEscutaPalavraChave() {
    if (!wakeRecognition) {
        configurarEscutaPalavraChave();
    }

    if (!wakeRecognition || wakeListening || !modoEscutaAtiva) {
        return;
    }

    try {
        wakeRecognition.start();
    } catch (erro) {
        console.warn("A escuta já estava ativa.");
    }
}

function pararEscutaPalavraChave() {
    if (wakeRecognition && wakeListening) {
        wakeRecognition.stop();
    }

    wakeListening = false;
}
function responderAtivacaoPorVoz() {
    mostrarAviso("Olá Web reconhecido. Pode falar sua mensagem.");

    const mensagem = "Olá, estou ouvindo. Pode falar sua mensagem.";

    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();

        const fala = new SpeechSynthesisUtterance(mensagem);
        fala.lang = "pt-BR";

        fala.onend = () => {
            setTimeout(() => {
                alternarReconhecimentoVoz();
            }, 500);
        };

        window.speechSynthesis.speak(fala);
    } else {
        alternarReconhecimentoVoz();
    }
}

function initializeAI() {
    const iaSalva = localStorage.getItem("webgen-ia") || "azure";

    iaSelecionada = iaSalva;
    aiToggle.checked = iaSelecionada === "gemini";

    atualizarTextoToggleIA();
}

function atualizarTextoToggleIA() {
    if (iaSelecionada === "gemini") {
        azureLabel.classList.remove("active-ai");
        geminiLabel.classList.add("active-ai");
    } else {
        geminiLabel.classList.remove("active-ai");
        azureLabel.classList.add("active-ai");
    }
}

function enviarMensagem() {
    const texto = userInput.value.trim();

    if (texto === "") {
        mostrarAviso("Digite uma mensagem antes de enviar.");
        return;
    }

    if (chatEmptyState) {
        chatEmptyState.style.display = "none";
    }

    adicionarMensagem(texto, "usuario");

    historicoConversa.push({
        role: "user",
        content: texto
    });

    userInput.value = "";

    setTimeout(async () => {
        const pensando = mostrarPensando();

        try {
            const resposta = await chamarIA(texto);

            pensando.remove();

            adicionarMensagem(resposta, "ia");

            historicoConversa.push({
                role: "assistant",
                content: resposta
            });

        } catch (erro) {
            console.error("Erro ao responder:", erro);

            pensando.remove();

            adicionarMensagem(
                "Não consegui gerar uma resposta agora. Verifique o console para mais detalhes.",
                "ia"
            );
        }
    }, 300);
}

function adicionarMensagem(texto, tipo) {
    const mensagem = document.createElement("div");
    mensagem.classList.add("chat-message");

    if (tipo === "usuario") {
        mensagem.classList.add("user-message");
        mensagem.textContent = texto;

        chatContainer.appendChild(mensagem);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return;
    }

    mensagem.classList.add("ai-message");

    const conteudoMensagem = document.createElement("div");
    conteudoMensagem.classList.add("ai-message-content");

    const botaoOuvir = document.createElement("button");
    botaoOuvir.classList.add("speak-btn");
    botaoOuvir.innerHTML = `<i class="bi bi-volume-up-fill"></i>`;
    botaoOuvir.title = "Ouvir resposta";

    const indicadorFala = document.createElement("span");
    indicadorFala.classList.add("speaking-indicator", "d-none");
    indicadorFala.textContent = "IA falando...";

    botaoOuvir.addEventListener("click", () => {
        if (botaoOuvir.classList.contains("speaking")) {
            pararAudioAzure();
        } else {
            falarTextoAzure(texto, botaoOuvir, indicadorFala);
        }
    });

    mensagem.appendChild(conteudoMensagem);
    mensagem.appendChild(botaoOuvir);
    mensagem.appendChild(indicadorFala);
    chatContainer.appendChild(mensagem);

    efeitoDigitando(conteudoMensagem, texto);
}

function mostrarPensando() {
    const pensando = document.createElement("div");
    pensando.classList.add("chat-message", "ai-message");

    pensando.innerHTML = `
        <div class="thinking">
            Pensando<span>.</span><span>.</span><span>.</span>
        </div>
    `;

    chatContainer.appendChild(pensando);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return pensando;
}

function efeitoDigitando(elemento, textoOriginal) {
    let indice = 0;
    let textoParcial = "";

    const intervalo = setInterval(() => {
        textoParcial += textoOriginal.charAt(indice);

        const textoLimpo = limparMarkdownVisual(textoParcial);

        elemento.innerHTML = `
            <div class="ai-response-block">
                <p>${textoLimpo}</p>
            </div>
        `;

        indice++;
        chatContainer.scrollTop = chatContainer.scrollHeight;

        if (indice >= textoOriginal.length) {
            clearInterval(intervalo);

            elemento.innerHTML = `
                <div class="ai-response-block">
                    ${marked.parse(textoOriginal)}
                </div>
            `;
        }
    }, 15);
}

function limparMarkdownVisual(texto) {
    return texto
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/`/g, "")
        .replace(/#{1,6}\s/g, "")
        .replace(/>\s/g, "")
        .replace(/-\s/g, "• ")
        .replace(/\n{3,}/g, "\n\n");
}

function mostrarAviso(mensagem) {
    toastMessage.textContent = mensagem;
    warningToast.show();
}

function initializeTheme() {
    const temaSalvo = localStorage.getItem("webgen-theme") || "dark";
    aplicarTema(temaSalvo);
}

function alternarTema() {
    const temaAtual = document.documentElement.getAttribute("data-theme");
    const novoTema = temaAtual === "dark" ? "light" : "dark";

    aplicarTema(novoTema);
}

function aplicarTema(tema) {
    document.documentElement.setAttribute("data-theme", tema);
    localStorage.setItem("webgen-theme", tema);

    themeToggleIcon.className = tema === "light"
        ? "bi bi-sun-fill"
        : "bi bi-moon-stars-fill";
}

async function carregarConfiguracao() {
    const resposta = await fetch("config.json");

    if (!resposta.ok) {
        throw new Error("Arquivo config.json não encontrado.");
    }

    return await resposta.json();
}

async function chamarIA(mensagemUsuario) {
    try {
        const config = await carregarConfiguracao();

        const erroChave = validarChaveIA(config);

        if (erroChave) {
            mostrarAviso(erroChave);
            return erroChave;
        }

        if (iaSelecionada === "gemini") {
            return await chamarIAGemini(mensagemUsuario, config);
        }

        return await chamarIAAzure(mensagemUsuario, config);

    } catch (erro) {
        console.error("Erro ao carregar configuração:", erro);

        const mensagemErro = "Não foi possível carregar as configurações das IAs. Verifique o arquivo config.json.";
        mostrarAviso(mensagemErro);

        return mensagemErro;
    }
}

async function chamarIAAzure(mensagemUsuario, config) {
    try {
        const resposta = await fetch(config.AZURE_ENDPOINT, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "api-key": config.AZURE_API_KEY
            },

            body: JSON.stringify({
                instructions: `
                    Você é uma assistente de IA chamada WebGen AI.
                    Responda de forma natural, simples e didática.
                    Ajude o usuário a entender conceitos de tecnologia.
                    Se não souber algo, diga que ainda está em construção.
                `,

                input: historicoConversa.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),

                max_output_tokens: 1000,
                model: config.AZURE_MODEL
            })
        });

        const dados = await resposta.json();
        console.log("Resposta Azure:", dados);

        if (!resposta.ok) {
            console.error("Erro Azure:", dados);
            const mensagemErro = "A Azure GPT não está disponível no momento. Tente trocar para Gemini ou verifique a configuração.";
            mostrarAviso(mensagemErro);
            return mensagemErro;
        }

        const mensagem = dados.output?.find(item => item.type === "message");
        const conteudoTexto = mensagem?.content?.find(item => item.type === "output_text");

        return (
            dados.output_text ||
            conteudoTexto?.text ||
            dados.choices?.[0]?.message?.content ||
            dados.choices?.[0]?.input?.content ||
            "A Azure respondeu, mas não consegui interpretar o formato da resposta."
        );

    } catch (erro) {
        console.error("Erro Azure:", erro);
        return "Não foi possível conectar à Azure. Verifique se o config.json está correto e se o projeto está rodando pelo Live Server.";
    }
}

async function chamarIAGemini(mensagemUsuario, config) {
    try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.GEMINI_MODEL}:generateContent?key=${config.GEMINI_API_KEY}`;

        const resposta = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [
                        {
                            text: `
                                Você é a assistente do sistema WebGen AI.
                                Responda de forma natural, clara e didática.
                                Use parágrafos curtos.
                                Evite excesso de Markdown.
                                Se não souber algo, diga que ainda está em construção e atualização.
                            `
                        }
                    ]
                },
                contents: historicoConversa.map(msg => ({
                    role: msg.role === "assistant" ? "model" : "user",
                    parts: [
                        {
                            text: msg.content
                        }
                    ]
                })),

                generationConfig: {
                    maxOutputTokens: 1000,
                    temperature: 0.8
                }
            })
        });

        const dados = await resposta.json();
        console.log("Resposta Gemini:", dados);

        if (!resposta.ok) {
            console.error("Erro Gemini:", dados);
            const mensagemErro = "O Gemini não está disponível no momento. Tente trocar para Azure GPT ou verifique a configuração.";
            mostrarAviso(mensagemErro);
            return mensagemErro;
        }

        return (
            dados.candidates?.[0]?.content?.parts?.[0]?.text ||
            "O Gemini respondeu, mas não consegui interpretar o formato da resposta."
        );

    } catch (erro) {
        console.error("Erro Gemini:", erro);
        return "Não foi possível conectar ao Gemini. Verifique o config.json e se o projeto está rodando pelo Live Server.";
    }
}

function validarChaveIA(config) {
    if (iaSelecionada === "azure") {
        if (
            !config.AZURE_API_KEY ||
            config.AZURE_API_KEY.includes("<") ||
            !config.AZURE_ENDPOINT ||
            !config.AZURE_MODEL
        ) {
            return "A versão Azure GPT não está disponível. Verifique a chave, endpoint e modelo da Azure ou selecione Gemini.";
        }
    }

    if (iaSelecionada === "gemini") {
        if (
            !config.GEMINI_API_KEY ||
            config.GEMINI_API_KEY.includes("<") ||
            !config.GEMINI_MODEL
        ) {
            return "A versão Gemini não está disponível. Verifique a chave do Gemini ou selecione Azure GPT.";
        }
    }

    return null;
}

    recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;



function configurarReconhecimentoVoz() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        voiceButton.disabled = true;
        mostrarAviso("Seu navegador não suporta reconhecimento de voz. Use o Google Chrome.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isListening = true;

        userInput.disabled = true;
        userInput.placeholder = "";

        voiceButton.classList.add("listening");
        voiceIcon.className = "bi bi-mic-mute-fill";
        voiceListening.classList.remove("d-none");

        sendButton.disabled = true;
        sendButton.classList.add("disabled-send");
        sendButton.setAttribute("aria-disabled", "true");
    };

    recognition.onresult = (event) => {
        const textoReconhecido = event.results[0][0].transcript;
        userInput.value = textoReconhecido;
    };

    recognition.onerror = (event) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        mostrarAviso("Não consegui reconhecer sua fala. Tente novamente ou digite sua mensagem.");
    };

    recognition.onend = () => {
        isListening = false;

        userInput.disabled = false;
        userInput.placeholder = "Digite sua pergunta ou descreva a ideia do seu sistema...";
        userInput.focus();

        voiceButton.classList.remove("listening");
        voiceIcon.className = "bi bi-mic-fill";
        voiceListening.classList.add("d-none");

        sendButton.disabled = false;
        sendButton.classList.remove("disabled-send");
        sendButton.removeAttribute("aria-disabled");
    };

    recognition.onnomatch = () => {
        mostrarAviso("Não consegui entender o que foi dito. Tente novamente ou digite sua mensagem.");
    };
}

function alternarReconhecimentoVoz() {
    if (modoEscutaAtiva) {
        pararEscutaPalavraChave();
    }

    if (!recognition) {
        configurarReconhecimentoVoz();
    }

    if (!recognition) {
        return;
    }

    if (isListening) {
        recognition.stop();
        return;
    }

    recognition.start();
}

let audioAtual = null;
let botaoFalaAtual = null;
let indicadorFalaAtual = null;

async function falarTextoAzure(texto, botao, indicador) {
    try {
        const config = await carregarConfiguracao();

        const textoLimpo = limparTextoParaVoz(texto);

        if (!textoLimpo) {
            mostrarAviso("Não há texto válido para reproduzir.");
            return;
        }

        pararAudioAzure();

        botaoFalaAtual = botao;
        indicadorFalaAtual = indicador;

        botao.innerHTML = `<i class="bi bi-stop-fill"></i>`;
        botao.title = "Parar áudio";
        botao.classList.add("speaking");

        if (indicador) {
            indicador.classList.remove("d-none");
        }

        sendButton.disabled = true;
        sendButton.classList.add("disabled-send");

        const ssml = `
<speak version='1.0' xml:lang='pt-BR'>
    <voice name='${config.AZURE_SPEECH_VOICE}'>
        ${escaparXML(textoLimpo)}
    </voice>
</speak>`;

        const resposta = await fetch(config.AZURE_SPEECH_ENDPOINT, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": config.AZURE_SPEECH_KEY,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": config.AZURE_SPEECH_OUTPUT_FORMAT
            },
            body: ssml
        });

        if (!resposta.ok) {
            console.error("Erro Azure Speech:", await resposta.text());
            resetarBotaoFala(botao);
            mostrarAviso("Não foi possível gerar o áudio pela Azure Speech.");
            return;
        }

        const audioBlob = await resposta.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        audioAtual = new Audio(audioUrl);

        audioAtual.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resetarBotaoFala(botao);
            esconderIndicadorFala(indicador);

            sendButton.disabled = false;
            sendButton.classList.remove("disabled-send");

            audioAtual = null;
            botaoFalaAtual = null;
            indicadorFalaAtual = null;
        };

        audioAtual.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            resetarBotaoFala(botao);
            esconderIndicadorFala(indicador);

            sendButton.disabled = false;
            sendButton.classList.remove("disabled-send");

            mostrarAviso("Erro ao reproduzir o áudio gerado.");

            audioAtual = null;
            botaoFalaAtual = null;
            indicadorFalaAtual = null;
        };

        audioAtual.play();

    } catch (erro) {
        console.error("Erro Text to Speech:", erro);
        resetarBotaoFala(botao);
        mostrarAviso("Erro ao conectar com o serviço de voz da Azure.");
    }
}

function pararAudioAzure() {
    if (audioAtual) {
        audioAtual.pause();
        audioAtual.currentTime = 0;
        audioAtual = null;
    }

    if (botaoFalaAtual) {
        resetarBotaoFala(botaoFalaAtual);
        botaoFalaAtual = null;
    }

    if (indicadorFalaAtual) {
        esconderIndicadorFala(indicadorFalaAtual);
        indicadorFalaAtual = null;
    }

    sendButton.disabled = false;
    sendButton.classList.remove("disabled-send");
}

function esconderIndicadorFala(indicador) {
    if (indicador) {
        indicador.classList.add("d-none");
    }
}

function resetarBotaoFala(botao) {
    botao.innerHTML = `<i class="bi bi-volume-up-fill"></i>`;
    botao.title = "Ouvir resposta";
    botao.classList.remove("speaking");
}

function limparTextoParaVoz(texto) {
    return texto
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
        .replace(/[\u{2600}-\u{27BF}]/gu, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/_(.*?)_/g, "$1")
        .replace(/`{1,3}([\s\S]*?)`{1,3}/g, "$1")
        .replace(/#{1,6}\s*/g, "")
        .replace(/>\s*/g, "")
        .replace(/[-*+]\s/g, "")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1")
        .replace(/\n+/g, ". ")
        .replace(/\s+/g, " ")
        .trim();
}

function escaparXML(texto) {
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function limparTextoParaVoz(texto) {
    return texto
        // remove emojis
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
        .replace(/[\u{2600}-\u{27BF}]/gu, "")

        // remove markdown
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/_(.*?)_/g, "$1")
        .replace(/`{1,3}([\s\S]*?)`{1,3}/g, "$1")
        .replace(/#{1,6}\s*/g, "")
        .replace(/>\s*/g, "")
        .replace(/[-*+]\s/g, "")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1")

        // limpa quebras
        .replace(/\n+/g, ". ")
        .replace(/\s+/g, " ")
        .trim();
}

function pararFala(botao) {
    window.speechSynthesis.cancel();
    resetarBotaoFala(botao);
}

function resetarBotaoFala(botao) {
    botao.innerHTML = `<i class="bi bi-volume-up-fill"></i>`;
    botao.title = "Ouvir resposta";
    botao.classList.remove("speaking");
}

// como implementar o fluxo de mensagens utilizando a Azure -> stream
// https://learn.microsoft.com/pt-br/azure/foundry/openai/how-to/responses?view=foundry&tabs=rest-api