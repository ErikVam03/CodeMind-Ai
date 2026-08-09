exports.handler = async function (event) {

    // ================= MÉTODO =================

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                error: "Método não permitido."
            })
        };
    }

    try {

        // ================= DADOS =================

        const body = JSON.parse(event.body || "{}");

        const message = body.message;

        const history = Array.isArray(body.history)
            ? body.history
            : [];

        // ================= VALIDAR MENSAGEM =================

        if (!message || !message.trim()) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    error: "Mensagem vazia."
                })
            };
        }

        // ================= API KEY =================

        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    error: "GROQ_API_KEY não encontrada no Netlify."
                })
            };
        }

        // ================= INSTRUÇÕES =================

        const systemMessage = {
            role: "system",

            content: `
Você é a CodeMind AI, uma inteligência artificial
especializada exclusivamente em programação.

Você é especialista em:

- HTML
- CSS
- JavaScript
- Python
- Java
- C
- C++
- PHP
- SQL
- React
- Node.js
- Git
- GitHub
- APIs
- bancos de dados
- desenvolvimento web
- desenvolvimento de aplicativos
- correção de erros
- criação de projetos
- otimização de código.

REGRAS:

1. Explique de maneira clara e prática.

2. Quando o usuário estiver começando,
explique de maneira simples.

3. Quando gerar código, use blocos Markdown.

4. Quando corrigir um código enviado pelo usuário,
explique o que estava errado e depois mostre
a versão corrigida.

5. Não invente informações técnicas.

6. Se houver várias soluções, diga qual é
a mais recomendada e explique o motivo.

7. Mantenha o contexto da conversa.

8. Se o usuário fizer uma pergunta relacionada
à mensagem anterior, use o histórico para entender
o que ele está perguntando.

9. Seja direto, mas dê detalhes suficientes
para o usuário conseguir executar a solução.

10. Responda em português, a menos que o usuário
peça outro idioma.
`
        };

        // ================= HISTÓRICO =================

        // Limita o histórico para evitar requisições
        // muito grandes
        const limitedHistory = history
            .slice(-20)
            .filter(function (item) {

                return (
                    item &&
                    (item.role === "user" ||
                     item.role === "assistant") &&
                    typeof item.content === "string"
                );

            });

        // ================= MENSAGENS =================

        const messages = [
            systemMessage,
            ...limitedHistory
        ];

        // ================= GROQ =================

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },

                body: JSON.stringify({

                    model: "llama-3.3-70b-versatile",

                    messages: messages,

                    temperature: 0.7,

                    max_tokens: 2048

                })
            }
        );

        // ================= RESPOSTA =================

        const data = await response.json();

        // ================= ERRO GROQ =================

        if (!response.ok) {

            console.error(
                "ERRO DO GROQ:",
                data
            );

            return {
                statusCode: response.status,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    error:
                        data?.error?.message ||
                        "Erro ao consultar a inteligência artificial."
                })
            };
        }

        // ================= PEGAR RESPOSTA =================

        const reply =
            data?.choices?.[0]?.message?.content;

        if (!reply) {

            return {
                statusCode: 500,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    error:
                        "O Groq não retornou uma resposta."
                })
            };
        }

        // ================= RETORNO =================

        return {

            statusCode: 200,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                reply: reply
            })

        };

    } catch (error) {

        console.error(
            "ERRO NA FUNCTION:",
            error
        );

        return {

            statusCode: 500,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                error:
                    error.message ||
                    "Erro interno na Function."
            })

        };

    }

};
