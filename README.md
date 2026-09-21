# Triagem+ — Totem

Interface React com Vite baseada nas referências do TCC. Home e seleção de identificação responsivas. A interface ocupa a tela do dispositivo, sem desenhar uma moldura de tablet.

## Iniciar este projeto

```sh
cd totem-web
npm install
npm run dev
```

Abra o endereço exibido pelo Vite no terminal.

## Criar do zero

```sh
npm create vite@latest totem-web -- --template react
cd totem-web
npm install
npm run dev
```

O projeto já foi criado nesta pasta; não é necessário recriá-lo.

## Verificação

```sh
npm run lint
npm run build
npm run preview
```

## Arquivos

- `src/App.jsx`: home e identificação. A constante `unidade` define a unidade de saúde.
- `src/App.css`: layout e cores.
- `src/index.css`: estilos globais.

O botão inicial abre a identificação. As três opções exibem um aviso de funcionalidade futura. Leitura de código, CPF, triagem e integração com a API ainda não foram implementadas. Nenhum dado de paciente é solicitado ou armazenado neste protótipo.
