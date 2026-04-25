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

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
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

    const resposta = await chamarIAAzure(texto);

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



function formatarResposta(texto) {
    return `
        <div class="ai-response-block">
            <p>${marked.parse(texto)}</p>
        </div>
    `;
}

function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
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

    if (tema === "light") {
        themeToggleIcon.className = "bi bi-sun-fill";
    } else {
        themeToggleIcon.className = "bi bi-moon-stars-fill";
    }
}

async function carregarConfiguracao() {
    const resposta = await fetch("config.json");

    if (!resposta.ok) {
        throw new Error("Arquivo config.json não encontrado.");
    }

    return await resposta.json();
}

async function chamarIAAzure(mensagemUsuario) {
    try {
        const config = await carregarConfiguracao();

        const resposta = await fetch(config.AZURE_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": config.AZURE_API_KEY
            },
            body: JSON.stringify({
                instructions: "Você é uma assistente de IA chamada WebGen AI. Responda de forma natural, simples e didática. Ajude o usuário a entender conceitos de tecnologia, criação de sistemas web e funcionamento da plataforma. Se não souber algo, diga que ainda está em construção e atualização.",
    
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
        console.log(dados);

        if (!resposta.ok) {
            console.error("Erro da Azure:", dados);
            return "Não consegui acessar a IA no momento. Verifique no console qual erro a Azure retornou.";
        }

        const mensagem = dados.output?.find(item => item.type === "message");

        const conteudoTexto = mensagem?.content?.find(item => item.type === "output_text");

        return (
            dados.output_text ||
            conteudoTexto?.text ||
            dados.choices?.[0]?.message?.content ||
            dados.choices?.[0]?.input?.content ||
            "A IA respondeu, mas não consegui interpretar o formato da resposta."
        );

    } catch (erro) {
        console.error("Erro:", erro);
        return "Não foi possível conectar à IA. Verifique se o config.json está correto e se o projeto está rodando pelo Live Server.";
    }
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

// efeito de resposta com efeitos (negrito, italic, parágrafos)
function efeitoDigitando(elemento, texto) {
    let i = 0;
    let textoParcial = "";

    const intervalo = setInterval(() => {
        textoParcial += texto.charAt(i);

        // MOSTRA TEXTO SIMPLES durante digitação
        elemento.innerHTML = `
            <div class="ai-response-block">
                <p>${textoParcial}</p>
            </div>
        `;

        i++;
        chatContainer.scrollTop = chatContainer.scrollHeight;

        if (i >= texto.length) {
            clearInterval(intervalo);

            // AQUI converte para Markdown corretamente
            elemento.innerHTML = `
                <div class="ai-response-block">
                    ${marked.parse(texto)}
                </div>
            `;
        }
    }, 15);
}
