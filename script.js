const aiToggle = document.getElementById("aiToggle");
const azureLabel = document.getElementById("azureLabel");
const geminiLabel = document.getElementById("geminiLabel");

const voiceButton = document.getElementById("voiceButton");
const voiceIcon = document.getElementById("voiceIcon");
const voiceListening = document.getElementById("voiceListening");

let recognition = null;
let isListening = false;

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

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeAI();
    configurarReconhecimentoVoz();
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

    userInput.value = "";

    setTimeout(async () => {
        const pensando = mostrarPensando();

        const resposta = await chamarIA(texto);

        pensando.remove();

        adicionarMensagem(resposta, "ia");
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
    chatContainer.appendChild(mensagem);

    efeitoDigitando(mensagem, texto);
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

                input: [
                    {
                        role: "user",
                        content: mensagemUsuario
                    }
                ],

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
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: mensagemUsuario
                            }
                        ]
                    }
                ],
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
    };

    recognition.onresult = (event) => {
        const textoReconhecido = event.results[0][0].transcript;

        userInput.value = textoReconhecido;
    };

    recognition.onerror = (event) => {

    console.error("Erro no reconhecimento de voz:", event.error);

    let mensagemErro = "";

    switch (event.error) {

        case "no-speech":
            mensagemErro = "Não consegui ouvir nenhuma fala. Tente novamente ou digite sua mensagem.";
            break;

        case "audio-capture":
            mensagemErro = "Não encontrei um microfone disponível no dispositivo.";
            break;

        case "not-allowed":
            mensagemErro = "Permissão do microfone negada. Ative o acesso ao microfone no navegador.";
            break;

        case "network":
            mensagemErro = "Erro de conexão durante o reconhecimento de voz.";
            break;

        default:
            mensagemErro = "Não consegui reconhecer sua fala. Tente novamente ou digite sua mensagem.";
    }

    mostrarAviso(mensagemErro);
};

recognition.onnomatch = () => {
    mostrarAviso("Não consegui entender o que foi dito. Tente novamente ou digite sua mensagem.");
};

    recognition.onend = () => {
        isListening = false;

        userInput.disabled = false;
        userInput.placeholder = "Digite sua pergunta ou descreva a ideia do seu sistema...";
        userInput.focus();

        voiceButton.classList.remove("listening");
        voiceIcon.className = "bi bi-mic-fill";

        voiceListening.classList.add("d-none");
    };
}

function alternarReconhecimentoVoz() {
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