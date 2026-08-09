exports.handler = async function (event) {
    // Só aceita requisições POST
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({
                error: "Método não permitido."
            })
        };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const message = body.message;

        if (!message || !message.trim()) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Mensagem vazia."
                })
            };
        }

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: "Chave da API não configurada no Netlify."
                })
            };
        }

        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },

                body: JSON.stringify({
                    model: "gpt-5-mini",
                    instructions: `
Você é a CodeMind AI, uma inteligência artificial
especializada exclusivamente em programação.

Ajude o usuário com:
- HTML
- CSS
- JavaScript
- Python
- Java
- C e C++
- PHP
- SQL
- React
- Node.js
- Git e GitHub
- APIs
- bancos de dados
- correção de erros
- criação e otimização de código.

Explique de maneira clara e prática.
Quando gerar código, use blocos de código Markdown.
Se o usuário estiver começando, explique os conceitos
de forma simples.
                    `,
                    input: message
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Erro OpenAI:", data);

            return {
                statusCode: response.status,
                body: JSON.stringify({
                    error: "Erro ao consultar a inteligência artificial."
                })
            };
        }

        return {
            statusCode: 200,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                reply: data.output_text || "Não consegui gerar uma resposta."
            })
        };

    } catch (error) {

        console.error("Erro:", error);

        return {
            statusCode: 500,

            body: JSON.stringify({
                error: "Erro interno do servidor."
            })
        };
    }
};