```javascript
exports.handler = async function (event) {
    // Só aceita requisições POST
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
        const body = JSON.parse(event.body || "{}");
        const message = body.message;

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

        // Chave da API do Groq
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    error: "Chave GROQ_API_KEY não configurada no Netlify."
                })
            };
        }

        // Envia a mensagem para o Groq
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

                    messages: [
                        {
                            role: "system",
                            content: `
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

Não invente informações técnicas.

Quando houver mais de uma solução, explique qual é
a mais recomendada e por quê.
`
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],

                    temperature: 0.7,
                    max_tokens: 2048
                })
            }
        );

        const data = await response.json();

        // Verifica erro do Groq
        if (!response.ok) {
            console.error("Erro Groq:", data);

            return {
                statusCode: response.status,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    error:
                        data.error?.message ||
                        "Erro ao consultar a inteligência artificial."
                })
            };
        }

        // Pega a resposta da IA
        const reply =
            data.choices?.[0]?.message?.content ||
            "Não consegui gerar uma resposta.";

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
        console.error("Erro interno:", error);

        return {
            statusCode: 500,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                error: "Erro interno do servidor."
            })
        };
    }
};
```
