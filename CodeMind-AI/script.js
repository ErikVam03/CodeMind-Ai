const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const welcome = document.getElementById("welcome");
const newChat = document.getElementById("newChat");
const menuButton = document.getElementById("menuButton");
const sidebar = document.querySelector(".sidebar");

// ================= HISTÓRICO DA CONVERSA =================

let conversationHistory = [];

// ================= ENVIAR MENSAGEM =================

async function sendMessage(text = null) {
    const message = text || input.value.trim();

    if (!message) return;

    welcome.style.display = "none";

    input.value = "";
    input.style.height = "auto";

    // Adiciona mensagem do usuário na tela
    addMessage("user", message);

    // Guarda mensagem no histórico
    conversationHistory.push({
        role: "user",
        content: message
    });

    const loading = addLoading();

    try {
        const response = await fetch("/.netlify/functions/chat", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message,
                history: conversationHistory
            })
        });

        const data = await response.json();

        loading.remove();

        if (!response.ok) {
            throw new Error(
                data.error ||
                `Erro ${response.status} ao conectar com a IA.`
            );
        }

        // Adiciona resposta da IA na tela
        addMessage("ai", data.reply);

        // Guarda resposta da IA no histórico
        conversationHistory.push({
            role: "assistant",
            content: data.reply
        });

    } catch (error) {
        loading.remove();

        // Remove a última mensagem do histórico
        // se a requisição falhar
        conversationHistory.pop();

        addMessage(
            "ai",
            "⚠️ Erro ao conectar com a IA:\n\n" +
            error.message
        );

        console.error("Erro da CodeMind:", error);
    }
}

// ================= INDICADOR DE CARREGAMENTO =================

function addLoading() {
    const loading = document.createElement("div");
    loading.className = "message ai";

    const avatar = document.createElement("div");
    avatar.className = "avatar ai-avatar";
    avatar.textContent = "</>";

    const content = document.createElement("div");
    content.className = "message-content";

    content.innerHTML =
        'Pensando<span class="loading-dots">...</span>';

    loading.appendChild(avatar);
    loading.appendChild(content);

    chat.appendChild(loading);

    chat.scrollTop = chat.scrollHeight;

    return loading;
}

// ================= ADICIONAR MENSAGEM =================

function addMessage(type, text) {
    const message = document.createElement("div");
    message.className = "message " + type;

    const avatar = document.createElement("div");

    avatar.className =
        "avatar " +
        (type === "ai" ? "ai-avatar" : "user-avatar");

    avatar.textContent =
        type === "ai" ? "</>" : "VOCÊ";

    const content = document.createElement("div");
    content.className = "message-content";

    if (type === "ai") {
        content.innerHTML = formatAIResponse(text);
    } else {
        content.textContent = text;
    }

    message.appendChild(avatar);
    message.appendChild(content);

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;
}

// ================= FORMATAR RESPOSTA DA IA =================

function formatAIResponse(text) {
    const escaped = escapeHTML(text);

    return escaped
        .replace(
            /```(\w+)?\n?([\s\S]*?)```/g,
            '<div class="code-block">' +
            '<div class="code-header">' +
            '<span>$1</span>' +
            '<button class="copy-code">Copiar</button>' +
            '</div>' +
            '<pre>$2</pre>' +
            '</div>'
        )
        .replace(/\n/g, "<br>");
}

// ================= EVITAR HTML MALICIOSO =================

function escapeHTML(text) {
    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

// ================= COPIAR CÓDIGO =================

document.addEventListener("click", function(event) {

    if (!event.target.classList.contains("copy-code")) {
        return;
    }

    const codeBlock =
        event.target.closest(".code-block");

    if (!codeBlock) return;

    const code =
        codeBlock.querySelector("pre").innerText;

    navigator.clipboard.writeText(code);

    event.target.textContent = "Copiado!";

    setTimeout(function() {
        event.target.textContent = "Copiar";
    }, 1500);
});

// ================= BOTÃO ENVIAR =================

sendButton.addEventListener("click", function() {
    sendMessage();
});

// ================= ENTER ENVIA =================

input.addEventListener("keydown", function(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {
        event.preventDefault();

        sendMessage();
    }
});

// ================= AJUSTAR ALTURA =================

input.addEventListener("input", function() {

    this.style.height = "auto";

    this.style.height =
        Math.min(this.scrollHeight, 150) + "px";
});

// ================= SUGESTÕES =================

document
    .querySelectorAll(".suggestion")
    .forEach(function(button) {

        button.addEventListener("click", function() {

            sendMessage(
                button.textContent.trim()
            );

        });

    });

// ================= NOVA CONVERSA =================

newChat.addEventListener("click", function() {

    // Limpa histórico
    conversationHistory = [];

    // Limpa mensagens
    chat.innerHTML = "";

    // Coloca tela inicial novamente
    chat.appendChild(welcome);

    welcome.style.display = "block";

    input.value = "";
    input.style.height = "auto";

    input.focus();
});

// ================= MENU NO CELULAR =================

menuButton.addEventListener("click", function() {

    sidebar.classList.toggle("open");

});

// ================= FECHAR MENU =================

document.addEventListener("click", function(event) {

    if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        event.target !== menuButton
    ) {
        sidebar.classList.remove("open");
    }

});
