const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const welcome = document.getElementById("welcome");
const newChat = document.getElementById("newChat");
const menuButton = document.getElementById("menuButton");
const sidebar = document.querySelector(".sidebar");

// Enviar mensagem
async function sendMessage(text = null) {
    const message = text || input.value.trim();

    if (!message) return;

    welcome.style.display = "none";

    input.value = "";
    input.style.height = "auto";

    addMessage("user", message);

    const loading = addLoading();

    try {
        const response = await fetch("/.netlify/functions/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        loading.remove();

        if (!response.ok) {
            throw new Error(data.error || "Erro ao conectar com a IA.");
        }

        addMessage("ai", data.reply);

    } catch (error) {
        loading.remove();

        addMessage(
            "ai",
            "⚠️ A IA ainda não está conectada. Vamos configurar essa parte agora."
        );

        console.error(error);
    }
}

// Adicionar mensagem
function addMessage(type, text) {
    const message = document.createElement("div");
    message.className = "message " + type;

    const avatar = document.createElement("div");
    avatar.className = "avatar " +
        (type === "ai" ? "ai-avatar" : "user-avatar");

    avatar.textContent = type === "ai" ? "</>" : "VOCÊ";

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

// Formatar resposta da IA
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

// Evitar código HTML malicioso
function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Copiar código
document.addEventListener("click", function(event) {
    if (!event.target.classList.contains("copy-code")) {
        return;
    }

    const codeBlock = event.target.closest(".code-block");

    if (!codeBlock) return;

    const code = codeBlock.querySelector("pre").innerText;

    navigator.clipboard.writeText(code);

    event.target.textContent = "Copiado!";

    setTimeout(function() {
        event.target.textContent = "Copiar";
    }, 1500);
});

// Botão enviar
sendButton.addEventListener("click", function() {
    sendMessage();
});

// Enter envia a mensagem
input.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// Ajustar altura do campo
input.addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height =
        Math.min(this.scrollHeight, 150) + "px";
});

// Sugestões
document.querySelectorAll(".suggestion").forEach(function(button) {
    button.addEventListener("click", function() {
        sendMessage(button.textContent.trim());
    });
});

// Nova conversa
newChat.addEventListener("click", function() {
    chat.innerHTML = "";
    chat.appendChild(welcome);

    welcome.style.display = "block";

    input.value = "";
    input.style.height = "auto";

    input.focus();
});

// Menu no celular
menuButton.addEventListener("click", function() {
    sidebar.classList.toggle("open");
});

// Fechar menu
document.addEventListener("click", function(event) {
    if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        event.target !== menuButton
    ) {
        sidebar.classList.remove("open");
    }
});