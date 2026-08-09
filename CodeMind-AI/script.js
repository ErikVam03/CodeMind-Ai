const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const welcome = document.getElementById("welcome");
const newChat = document.getElementById("newChat");
const menuButton = document.getElementById("menuButton");
const sidebar = document.querySelector(".sidebar");

/* ================= SUPABASE ================= */

const SUPABASE_URL = "https://rdmfqaxhmiujmxhhkqio.supabase.co";

const SUPABASE_KEY =
"sb_publishable_wuIZ16tYEiKAaX5mebmc6Q_KIXdzHiC";

const supabaseClient =
window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

/* ================= LOGIN ================= */

const loginButton = document.getElementById("loginButton");
const loginModal = document.getElementById("loginModal");
const closeLogin = document.getElementById("closeLogin");

const googleLogin = document.getElementById("googleLogin");
const emailLogin = document.getElementById("emailLogin");
const createAccount = document.getElementById("createAccount");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");

/* Abrir login */

if (loginButton) {

loginButton.addEventListener("click", function() {

    loginModal.classList.add("open");

});

}

/* Fechar login */

if (closeLogin) {

closeLogin.addEventListener("click", function() {

    loginModal.classList.remove("open");

});

}

/* Fechar clicando fora */

if (loginModal) {

loginModal.addEventListener("click", function(event) {

    if (event.target === loginModal) {

        loginModal.classList.remove("open");

    }

});

}

/* Login com Google */

if (googleLogin) {

googleLogin.addEventListener("click", async function() {

    loginMessage.textContent = "Conectando com Google...";

    const { error } =
        await supabaseClient.auth.signInWithOAuth({

            provider: "google",

            options: {

                redirectTo:
                    window.location.origin

            }

        });

    if (error) {

        loginMessage.textContent =
            "Erro ao entrar com Google: " +
            error.message;

        console.error(error);

    }

});

}

/* Login com e-mail */

if (emailLogin) {

emailLogin.addEventListener("click", async function() {

    const email =
        loginEmail.value.trim();

    const password =
        loginPassword.value;


    if (!email || !password) {

        loginMessage.textContent =
            "Digite seu e-mail e sua senha.";

        return;

    }


    loginMessage.textContent =
        "Entrando...";


    const { error } =
        await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

        });


    if (error) {

        loginMessage.textContent =
            "Erro ao entrar: " +
            error.message;

        return;

    }


    loginMessage.textContent =
        "Login realizado!";

    loginModal.classList.remove("open");

    atualizarUsuario();

});

}

/* Criar conta */

if (createAccount) {

createAccount.addEventListener("click", async function() {

    const email =
        loginEmail.value.trim();

    const password =
        loginPassword.value;


    if (!email || !password) {

        loginMessage.textContent =
            "Digite um e-mail e uma senha.";

        return;

    }


    if (password.length < 6) {

        loginMessage.textContent =
            "A senha precisa ter pelo menos 6 caracteres.";

        return;

    }


    loginMessage.textContent =
        "Criando sua conta...";


    const { error } =
        await supabaseClient.auth.signUp({

            email: email,

            password: password,

            options: {

                emailRedirectTo:
                    window.location.origin

            }

        });


    if (error) {

        loginMessage.textContent =
            "Erro ao criar conta: " +
            error.message;

        return;

    }


    loginMessage.textContent =
        "Conta criada! Verifique seu e-mail para confirmar.";

});

}

/* ================= USUÁRIO ================= */

async function atualizarUsuario() {

const { data } =
    await supabaseClient.auth.getUser();

const user = data.user;


if (!user) {

    if (loginButton) {

        loginButton.textContent =
            "Entrar / Criar conta";

    }

    return;

}


const nome =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuário";


if (loginButton) {

    loginButton.textContent =
        "👤 " + nome;

}

}

/* Verificar login ao carregar */

atualizarUsuario();

/* Detectar login/logout */

supabaseClient.auth.onAuthStateChange(

function(event, session) {

    atualizarUsuario();

}

);

/* ================= ENVIAR MENSAGEM ================= */

async function sendMessage(text = null) {

const message =
    text || input.value.trim();


if (!message) return;


welcome.style.display = "none";

input.value = "";

input.style.height = "auto";


addMessage("user", message);


const loading =
    addLoading();


try {

    const response =
        await fetch(
            "/.netlify/functions/chat",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    message: message

                })

            }
        );


    const data =
        await response.json();


    loading.remove();


    if (!response.ok) {

        throw new Error(

            data.error ||
            `Erro ${response.status} ao conectar com a IA.`

        );

    }


    addMessage(
        "ai",
        data.reply
    );


} catch (error) {

    loading.remove();


    addMessage(

        "ai",

        "⚠️ Erro ao conectar com a IA:\n\n" +
        error.message

    );


    console.error(
        "Erro da CodeMind:",
        error
    );

}

}

/* ================= CARREGAMENTO ================= */

function addLoading() {

const loading =
    document.createElement("div");

loading.className =
    "message ai";


const avatar =
    document.createElement("div");

avatar.className =
    "avatar ai-avatar";

avatar.textContent =
    "</>";


const content =
    document.createElement("div");

content.className =
    "message-content";

content.innerHTML =
    'Pensando<span class="loading-dots">...</span>';


loading.appendChild(avatar);

loading.appendChild(content);


chat.appendChild(loading);

chat.scrollTop =
    chat.scrollHeight;


return loading;

}

/* ================= MENSAGEM ================= */

function addMessage(type, text) {

const message =
    document.createElement("div");

message.className =
    "message " + type;


const avatar =
    document.createElement("div");

avatar.className =
    "avatar " +
    (type === "ai"
        ? "ai-avatar"
        : "user-avatar");


avatar.textContent =
    type === "ai"
        ? "</>"
        : "VOCÊ";


const content =
    document.createElement("div");

content.className =
    "message-content";


if (type === "ai") {

    content.innerHTML =
        formatAIResponse(text);

} else {

    content.textContent =
        text;

}


message.appendChild(avatar);

message.appendChild(content);


chat.appendChild(message);


chat.scrollTop =
    chat.scrollHeight;

}

/* ================= FORMATAR IA ================= */

function formatAIResponse(text) {

const escaped =
    escapeHTML(text);


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

    .replace(
        /\n/g,
        "<br>"
    );

}

/* ================= SEGURANÇA ================= */

function escapeHTML(text) {

const div =
    document.createElement("div");

div.textContent =
    text;

return div.innerHTML;

}

/* ================= COPIAR CÓDIGO ================= */

document.addEventListener(
"click",
function(event) {

    if (
        !event.target.classList.contains(
            "copy-code"
        )
    ) {

        return;

    }


    const codeBlock =
        event.target.closest(
            ".code-block"
        );


    if (!codeBlock) return;


    const code =
        codeBlock
            .querySelector("pre")
            .innerText;


    navigator.clipboard.writeText(code);


    event.target.textContent =
        "Copiado!";


    setTimeout(

        function() {

            event.target.textContent =
                "Copiar";

        },

        1500

    );

}

);

/* ================= BOTÃO ENVIAR ================= */

sendButton.addEventListener(
"click",
function() {

    sendMessage();

}

);

/* ================= ENTER ================= */

input.addEventListener(
"keydown",
function(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();

    }

}

);

/* ================= ALTURA INPUT ================= */

input.addEventListener(
"input",
function() {

    this.style.height =
        "auto";


    this.style.height =
        Math.min(
            this.scrollHeight,
            150
        ) + "px";

}

);

/* ================= SUGESTÕES ================= */

document
.querySelectorAll(".suggestion")
.forEach(function(button) {

    button.addEventListener(
        "click",
        function() {

            sendMessage(
                button.textContent.trim()
            );

        }
    );

});

/* ================= NOVA CONVERSA ================= */

newChat.addEventListener(
"click",
function() {

    chat.innerHTML = "";

    chat.appendChild(welcome);


    welcome.style.display =
        "block";


    input.value = "";

    input.style.height =
        "auto";


    input.focus();

}

);

/* ================= MENU MOBILE ================= */

menuButton.addEventListener(
"click",
function() {

    sidebar.classList.toggle(
        "open"
    );

}

);

/* ================= FECHAR MENU ================= */

document.addEventListener(
"click",
function(event) {

    if (

        sidebar.classList.contains(
            "open"
        ) &&

        !sidebar.contains(
            event.target
        ) &&

        event.target !== menuButton

    ) {

        sidebar.classList.remove(
            "open"
        );

    }

}

);
