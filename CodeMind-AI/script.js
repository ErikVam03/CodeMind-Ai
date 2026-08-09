/* =========================================================
   CODEMIND AI
   SupABASE + CHAT
   ========================================================= */

/* ================= SUPABASE ================= */

const SUPABASE_URL = "https://rdmfqaxhmiujmxhhkqio.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_wuIZ16tYEiKAaX5mebmc6Q_KIXdzHiC";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* ================= ELEMENTOS ================= */

const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const welcome = document.getElementById("welcome");
const newChat = document.getElementById("newChat");
const menuButton = document.getElementById("menuButton");
const sidebar = document.querySelector(".sidebar");

const loginButton = document.getElementById("loginButton");
const closeLogin = document.getElementById("closeLogin");
const googleLogin = document.getElementById("googleLogin");
const emailLogin = document.getElementById("emailLogin");
const createAccount = document.getElementById("createAccount");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");

const loginModal = document.querySelector(".login-modal");


/* ================= ESTADO ================= */

let currentUser = null;


/* =========================================================
   LOGIN MODAL
   ========================================================= */

function openLogin() {
    if (!loginModal) return;

    loginModal.classList.add("active");

    if (loginEmail) {
        loginEmail.focus();
    }
}


function closeLoginModal() {
    if (!loginModal) return;

    loginModal.classList.remove("active");

    if (loginMessage) {
        loginMessage.textContent = "";
    }
}


/* ================= MENSAGEM DE LOGIN ================= */

function showLoginMessage(message, error = false) {
    if (!loginMessage) return;

    loginMessage.textContent = message;

    loginMessage.style.color = error
        ? "#ff6b6b"
        : "#9b83ff";
}


/* =========================================================
   VERIFICAR USUÁRIO
   ========================================================= */

async function checkAuth() {

    const {
        data,
        error
    } = await supabaseClient.auth.getUser();

    if (error || !data.user) {

        currentUser = null;

        showLoginRequired();

        return;
    }

    currentUser = data.user;

    hideLoginRequired();

    console.log("Usuário conectado:", currentUser.email);
}


/* ================= BLOQUEAR CHAT ================= */

function showLoginRequired() {

    if (loginModal) {
        loginModal.classList.add("active");
    }

    if (input) {
        input.disabled = true;
    }

    if (sendButton) {
        sendButton.disabled = true;
        sendButton.style.opacity = "0.5";
        sendButton.style.cursor = "not-allowed";
    }
}


/* ================= LIBERAR CHAT ================= */

function hideLoginRequired() {

    if (loginModal) {
        loginModal.classList.remove("active");
    }

    if (input) {
        input.disabled = false;
    }

    if (sendButton) {
        sendButton.disabled = false;
        sendButton.style.opacity = "1";
        sendButton.style.cursor = "pointer";
    }
}


/* =========================================================
   LOGIN COM GOOGLE
   ========================================================= */

async function loginWithGoogle() {

    showLoginMessage("Conectando com Google...");

    const {
        error
    } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",

        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) {

        console.error(error);

        showLoginMessage(
            "Erro ao entrar com Google: " + error.message,
            true
        );
    }
}


/* =========================================================
   LOGIN COM E-MAIL
   ========================================================= */

async function loginWithEmail() {

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {

        showLoginMessage(
            "Digite seu e-mail e sua senha.",
            true
        );

        return;
    }

    showLoginMessage("Entrando...");

    const {
        data,
        error
    } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {

        console.error(error);

        showLoginMessage(
            "Não foi possível entrar. Verifique e-mail e senha.",
            true
        );

        return;
    }

    currentUser = data.user;

    showLoginMessage("Login realizado!");

    setTimeout(() => {
        hideLoginRequired();
    }, 500);
}


/* =========================================================
   CRIAR CONTA
   ========================================================= */

async function createNewAccount() {

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {

        showLoginMessage(
            "Digite seu e-mail e crie uma senha.",
            true
        );

        return;
    }

    if (password.length < 6) {

        showLoginMessage(
            "A senha precisa ter pelo menos 6 caracteres.",
            true
        );

        return;
    }

    showLoginMessage("Criando sua conta...");

    const {
        data,
        error
    } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (error) {

        console.error(error);

        showLoginMessage(
            error.message,
            true
        );

        return;
    }

    /*
       Se a confirmação de e-mail estiver ativada
       no Supabase, o usuário precisará confirmar
       o e-mail antes de entrar.
    */

    if (!data.session) {

        showLoginMessage(
            "Conta criada! Verifique seu e-mail para confirmar a conta."
        );

        return;
    }

    currentUser = data.user;

    showLoginMessage("Conta criada com sucesso!");

    setTimeout(() => {
        hideLoginRequired();
    }, 500);
}


/* =========================================================
   OBSERVAR LOGIN / LOGOUT
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        console.log("Auth:", event);

        if (session && session.user) {

            currentUser = session.user;

            hideLoginRequired();

        } else {

            currentUser = null;

            showLoginRequired();
        }
    }
);


/* =========================================================
   ENVIAR MENSAGEM
   ========================================================= */

async function sendMessage(text = null) {

    /* LOGIN OBRIGATÓRIO */

    if (!currentUser) {

        openLogin();

        return;
    }

    const message = text || input.value.trim();

    if (!message) return;

    welcome.style.display = "none";

    input.value = "";
    input.style.height = "auto";

    addMessage("user", message);

    const loading = addLoading();

    try {

        const response = await fetch(
            "/.netlify/functions/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message,

                    userId: currentUser.id,

                    email: currentUser.email
                })
            }
        );

        const data = await response.json();

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


/* =========================================================
   LOADING
   ========================================================= */

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
        `
        Pensando
        <span class="loading-dots">...</span>
        `;

    loading.appendChild(avatar);
    loading.appendChild(content);

    chat.appendChild(loading);

    chat.scrollTop =
        chat.scrollHeight;

    return loading;
}


/* =========================================================
   ADICIONAR MENSAGEM
   ========================================================= */

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


/* =========================================================
   FORMATAR RESPOSTA DA IA
   ========================================================= */

function formatAIResponse(text) {

    const escaped =
        escapeHTML(text);

    return escaped
        .replace(
            /```(\w+)?\n?([\s\S]*?)```/g,

            '<div class="code-block">' +

            '<div class="code-header">' +

            '<span>$1</span>' +

            '<button class="copy-code">' +
            'Copiar' +
            '</button>' +

            '</div>' +

            '<pre>$2</pre>' +

            '</div>'
        )

        .replace(/\n/g, "<br>");
}


/* =========================================================
   SEGURANÇA
   ========================================================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}


/* =========================================================
   COPIAR CÓDIGO
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

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

        navigator.clipboard
            .writeText(code)
            .then(() => {

                event.target.textContent =
                    "Copiado!";

                setTimeout(() => {

                    event.target.textContent =
                        "Copiar";

                }, 1500);

            })
            .catch(() => {

                event.target.textContent =
                    "Erro";

                setTimeout(() => {

                    event.target.textContent =
                        "Copiar";

                }, 1500);
            });
    }
);


/* =========================================================
   BOTÃO ENVIAR
   ========================================================= */

if (sendButton) {

    sendButton.addEventListener(
        "click",
        function () {

            sendMessage();

        }
    );
}


/* =========================================================
   ENTER
   ========================================================= */

if (input) {

    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );


    /* ================= ALTURA ================= */

    input.addEventListener(
        "input",
        function () {

            this.style.height =
                "auto";

            this.style.height =
                Math.min(
                    this.scrollHeight,
                    150
                ) + "px";
        }
    );
}


/* =========================================================
   SUGESTÕES
   ========================================================= */

document
    .querySelectorAll(".suggestion")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                sendMessage(
                    button.textContent.trim()
                );

            }
        );
    });


/* =========================================================
   NOVA CONVERSA
   ========================================================= */

if (newChat) {

    newChat.addEventListener(
        "click",
        function () {

            if (!currentUser) {

                openLogin();

                return;
            }

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
}


/* =========================================================
   MENU MOBILE
   ========================================================= */

if (menuButton) {

    menuButton.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "open"
            );
        }
    );
}


/* ================= FECHAR MENU ================= */

document.addEventListener(
    "click",
    function (event) {

        if (
            sidebar &&
            sidebar.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            event.target !== menuButton
        ) {

            sidebar.classList.remove(
                "open"
            );
        }
    }
);


/* =========================================================
   BOTÃO LOGIN
   ========================================================= */

if (loginButton) {

    loginButton.addEventListener(
        "click",
        function () {

            openLogin();

        }
    );
}


/* =========================================================
   FECHAR LOGIN
   ========================================================= */

if (closeLogin) {

    closeLogin.addEventListener(
        "click",
        function () {

            /*
               Não permite fechar o login
               se o usuário ainda não estiver
               autenticado.
            */

            if (!currentUser) {

                showLoginMessage(
                    "Você precisa entrar para usar a CodeMind."
                );

                return;
            }

            closeLoginModal();
        }
    );
}


/* =========================================================
   GOOGLE
   ========================================================= */

if (googleLogin) {

    googleLogin.addEventListener(
        "click",
        function () {

            loginWithGoogle();

        }
    );
}


/* =========================================================
   E-MAIL
   ========================================================= */

if (emailLogin) {

    emailLogin.addEventListener(
        "click",
        function () {

            loginWithEmail();

        }
    );
}


/* =========================================================
   CRIAR CONTA
   ========================================================= */

if (createAccount) {

    createAccount.addEventListener(
        "click",
        function () {

            createNewAccount();

        }
    );
}


/* =========================================================
   ENTER NOS CAMPOS DE LOGIN
   ========================================================= */

if (loginPassword) {

    loginPassword.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                loginWithEmail();
            }
        }
    );
}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "CodeMind AI iniciando..."
        );

        await checkAuth();

    }
);
