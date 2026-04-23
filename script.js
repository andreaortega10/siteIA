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

    setTimeout(() => {
        const resposta = gerarRespostaIA(texto);
        adicionarMensagem(resposta, "ia");
    }, 500);
}

function adicionarMensagem(texto, tipo) {
    const mensagem = document.createElement("div");
    mensagem.classList.add("chat-message");

    if (tipo === "usuario") {
        mensagem.classList.add("user-message");
        mensagem.textContent = texto;
    } else {
        mensagem.classList.add("ai-message");
        mensagem.innerHTML = formatarResposta(texto);
    }

    chatContainer.appendChild(mensagem);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function gerarRespostaIA(mensagemUsuario) {
    const texto = normalizarTexto(mensagemUsuario);

    if (texto === "oi" || texto === "ola" || texto.includes("bom dia") || texto.includes("boa tarde") || texto.includes("boa noite")) {
        return "Olá! Eu sou a assistente do WebGen AI. Posso te ajudar a entender a plataforma ou começar a organizar a ideia de um sistema web.";
    }

    if (texto.includes("qual seu nome") || texto.includes("seu nome") || texto.includes("como voce se chama")) {
        return "Meu nome é WebGen AI. Eu sou uma IA simulada criada para interagir com o usuário e auxiliar na criação de ideias para sistemas web.";
    }

    if (texto.includes("idade") || texto.includes("quantos anos voce tem")) {
        return "Eu não tenho idade como uma pessoa. Sou uma inteligência artificial simulada e ainda estou em fase de construção e atualização.";
    }

    if (texto.includes("o que e ia") || texto.includes("inteligencia artificial") || texto.includes("para que serve IA") || texto.includes("ia") || texto.includes("IA")) {
        return "IA significa Inteligência Artificial. De forma simples, é uma tecnologia criada para simular certas capacidades humanas, como interpretar perguntas, organizar informações e gerar respostas.";
    }

    if (texto.includes("o que e o webgen") || texto.includes("para que serve") || texto.includes("o que esse site faz")) {
        return "O WebGen AI é uma plataforma pensada para ajudar usuários a transformar ideias em propostas de sistemas web. A ideia é que você descreva o que deseja criar, e a plataforma te ajude a organizar esse projeto.";
    }

    if (texto.includes("como comecar") || texto.includes("como usar") || texto.includes("por onde comeco") || texto.includes("por onde eu comeco")) {
        return "Para começar, você pode escrever uma pergunta ou descrever uma ideia de sistema. Por exemplo: quero criar uma loja virtual, um sistema de clínica ou uma plataforma de cursos.";
    }

    if (texto.includes("o que voce faz") || texto.includes("como voce ajuda")) {
        return "Eu ajudo respondendo perguntas iniciais, explicando conceitos básicos e simulando uma orientação para criação de sistemas web.";
    }

    if (texto.includes("html")) {
        return "HTML é usado para criar a estrutura de uma página web. Com ele, colocamos títulos, textos, botões, formulários, imagens e outras partes do site.";
    }

    if (texto.includes("css")) {
        return "CSS é usado para cuidar do visual da página. Ele define cores, tamanhos, espaçamentos, fontes, alinhamentos e efeitos visuais.";
    }

    if (texto.includes("javascript") || texto.includes("js")) {
        return "JavaScript é usado para deixar o site interativo. Ele permite ações como enviar mensagens, abrir janelas, trocar tema e responder ao usuário.";
    }

    if (texto.includes("criar sistema") || texto.includes("quero um sistema") || texto.includes("quero criar") || texto.includes("site")) {
        return "Entendi. Podemos começar definindo o objetivo do sistema, o público que vai usar, as principais funcionalidades e as telas necessárias. Depois disso, fica mais fácil pensar na estrutura do projeto.";
    }

    return "Ainda estou em construção e atualização, então não sei responder isso com precisão. Mas posso te ajudar com perguntas sobre IA, criação de sistemas, HTML, CSS, JavaScript ou sobre o próprio WebGen AI.";
}

function formatarResposta(texto) {
    return `
        <div class="ai-response-block">
            <p>${escaparHTML(texto)}</p>
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