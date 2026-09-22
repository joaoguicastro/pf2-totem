# Med+Facil — Totem

React + Vite. Interface do totem com duas entradas:

- **Digitar CPF**: consulta o paciente e suas avaliações pendentes, confirma o nome e segue para sinais vitais simulados.
- **Não fiz avaliação ainda**: consulta o CPF, confirma o paciente, carrega sintomas e perguntas da API, apresenta uma pergunta por vez e segue para sinais vitais simulados.

Ambos terminam com uma senha **demonstrativa**, identificada por `SIM-`. Não há classificação clínica no frontend nem inclusão em uma fila real.

## Executar

```sh
cd totem-web
npm install
npm run dev
```

A API padrão é `http://localhost:8080`. Para mudar, copie `.env.example` para `.env.local`, ajuste `VITE_API_URL` e reinicie o Vite. O backend precisa estar em execução e permitir a origem do frontend no CORS.

## Integrações existentes

- `GET /v1/totem/{cpf}/identificacao`: nome e avaliações pendentes. O CPF é enviado formatado como no cadastro do backend.
- `GET /v1/sintoma`: sintomas disponíveis.
- `GET /v1/sintoma/{sintoma}/perguntas`: perguntas gerais e específicas, na mesma ordem usada pelo app.

CPF sem avaliação pendente permite trocar para nova avaliação. Múltiplas avaliações exigem seleção. Erros de consulta oferecem nova tentativa. Requisições são canceladas ao sair da tela e têm limite de 15 segundos.

## Limitações atuais do contrato

O backend não foi alterado. `TotemIdentificacaoResponseDTO` e `PacienteResponseDTO` não expõem o ID do paciente exigido pelo POST de chamado. Também não há endpoint de coleta de sinais vitais ou emissão de senha, e `ChamadoResponseDTO` não expõe `senhaFila`.

Por isso, esta versão **não envia questionários ou medições ao servidor**. As respostas são organizadas nos mesmos grupos e com as mesmas correções de chaves do app, prontas para uma futura integração. A senha simulada não representa a senha interna que o backend gera ao criar chamados.

Os cinco valores de sinais vitais são fictícios e fixos. O número demonstrativo é criado uma única vez ao concluir a sessão. Nenhum CPF, nome, resposta ou medição é gravado no armazenamento do navegador. Ao concluir ou cancelar, o estado da sessão é descartado.

## Verificar

```sh
npm run lint
node --test tests/api.test.js
npm run build
```

Os testes automatizados cobrem o contrato de consulta, tratamento de respostas inválidas, CPF e composição do questionário (inclusive respostas negativas e perguntas não respondidas). Os dois fluxos também foram exercitados no Chrome com respostas de API simuladas. A integração com servidor real requer a API ligada.

## Arquivos principais

- `src/App.jsx`: home.
- `src/components/Flow.jsx`: identificação, CPF, questionário, sinais vitais e senha.
- `src/services/api.js`: consultas e composição das respostas.
- `src/App.css`: estilos responsivos.
