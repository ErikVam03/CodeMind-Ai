javascript
exports.handler = async function (event) {
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

        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: "GROQ_API_KEY não encontrada no Netlify."
                })
            };
        }

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
                            content:
                                "Você é a CodeMind AI, especializada em programação. " +
                                "Ajude com HTML, CSS, JavaScript, Python, Java, C, C++, " +
                                "PHP, SQL, React, Node.js, Git, GitHub, APIs e bancos de dados. " +
                                "Explique de forma clara e prática."
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("ERRO DO GROQ:", data);

            return {
                statusCode: response.status,
                body: JSON.stringify({
                    error:
                        data?.error?.message ||
                        JSON.stringify(data)
                })
            };
        }

        const reply = data?.choices?.[0]?.message?.content;

        if (!reply) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: "O Groq não retornou uma resposta."
                })
            };
        }

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
        console.error("ERRO NA FUNCTION:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message || "Erro interno na Function."
            })
        };
    }
};
