exports.handler = async function (event) {

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

        const history = Array.isArray(body.history)
            ? body.history
            : [];

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

        const systemMessage = {
            role: "system",

            content: `
Você é a CodeMind AI, uma inteligência artificial
especializada em programação e desenvolvimento de software.

Você deve ajudar principalmente com:

HTML, CSS, JavaScript, Python, Java, C, C++,
PHP, SQL, React, Node.js, Git, GitHub, APIs,
bancos de dados, desenvolvimento web,
desenvolvimento de aplicativos e correção de erros.

========================
COMPORTAMENTO
========================

- Responda sempre em português, salvo se o usuário
  pedir outro idioma.

- Explique de forma clara, prática e organizada.

- Se o usuário for iniciante, explique os conceitos
  de maneira simples antes de apresentar soluções
  mais avançadas.

- Use o contexto da conversa para entender perguntas
  relacionadas às mensagens anteriores.

- Não repita explicações desnecessariamente quando
  o usuário já demonstrou entender o conceito.

- Se o usuário estiver tentando resolver um erro,
  explique primeiro a causa e depois mostre a solução.

========================
CÓDIGO
========================

Quando apresentar código, SEMPRE use blocos Markdown
com três crases.

Exemplo:

\`\`\`javascript
const nome = "João";
console.log(nome);
\`\`\`

Nunca escreva apenas:

javascript
const nome = "João";

O código deve estar dentro de um bloco Markdown.

Sempre indique a linguagem correta do código.

========================
PRECISÃO
========================

- Não invente funções, comandos, bibliotecas,
  propriedades ou recursos que não existem.

- Se não tiver certeza sobre alguma informação técnica,
  deixe isso claro.

- Verifique mentalmente se o código apresentado
  realmente corresponde à linguagem mencionada.

- Não diga que Python usa a palavra-chave "type"
  para declarar variáveis tipadas.

- Em Python, variáveis podem receber valores diretamente,
  por exemplo:

\`\`\`python
nome = "João"
idade = 25
\`\`\`

- Type hints em Python usam sintaxe como:

\`\`\`python
nome: str = "João"
idade: int = 25
\`\`\`

========================
CORREÇÃO DE CÓDIGO
========================

Quando o usuário enviar código com erro:

1. Identifique o problema.
2. Explique por que ele acontece.
3. Mostre o código corrigido.
4. Explique o que foi alterado.

========================
RESPOSTAS
========================

Prefira respostas organizadas com:

- explicações curtas;
- listas quando forem úteis;
- exemplos práticos;
- blocos de código;
- observações importantes.

Não seja excessivamente formal.

Se o usuário pedir algo simples,
responda de forma simples.

Se pedir um projeto completo,
forneça uma solução completa e organizada.
`
        };

        const limitedHistory = history
            .slice(-20)
            .filter(function (item) {

                return (
                    item &&
                    (
                        item.role === "user" ||
                        item.role === "assistant"
                    ) &&
                    typeof item.content === "string"
                );

            });

        const messages = [
            systemMessage,
            ...limitedHistory
        ];

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

                    temperature: 0.5,

                    max_tokens: 3000

                })
            }
        );

        const data = await response.json();

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
