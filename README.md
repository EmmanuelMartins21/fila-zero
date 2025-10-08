# 🏥 Fila Zero

Fila Zero é um aplicativo móvel desenvolvido para otimizar o processo de distribuição de medicamentos em unidades de saúde, reduzindo o tempo de espera e melhorando a experiência dos usuários do Programa Farmacia Popular(Farmacinha) do Sistema Único de Saúde (SUS).

## 📱 Funcionalidades Principais

- Check-in digital para retirada de medicamentos
- Visualização em tempo real do status da fila
- Mapa de unidades de saúde próximas
- Histórico de retiradas de medicamentos
- Sistema de notificações para avisos importantes

## 🛠️ Tecnologias

- React Native
- Expo
- TypeScript
- Supabase (Backend as a Service)
- React Navigation
- Notificações Push

## 🚀 Como Executar o Projeto

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` baseado no `.env.example`
   - Preencha as variáveis necessárias

4. Execute o projeto:
```bash
npm start
```

## 📋 Pré-requisitos

- Node.js >= 14.0.0
- npm ou yarn
- Expo CLI
- iOS Simulator ou Android Emulator (opcional)

## 🗺️ Roadmap

### Próximas Integrações

1. **Integração com Gov.br**
   - [ ] Implementar autenticação via API do Gov.br
   - [ ] Validação de CPF através do sistema Gov.br
   - [ ] Integração com login único do governo

2. **Integração com Cartão SUS**
   - [ ] Validação do número do Cartão SUS via API do DataSUS
   - [ ] Sincronização de dados do usuário com o sistema do SUS
   - [ ] Histórico de atendimentos e prescrições

3. **Melhorias Futuras**
   - [ ] Sistema de previsão de tempo de espera
   - [ ] Agendamento prévio de retiradas
   - [ ] Dashboard para gestores de unidades de saúde
   - [ ] Integração com sistema de estoque das farmácias

### Documentação Técnica para Integrações

#### Integração Gov.br

Para integrar com o Gov.br, será necessário:

1. Cadastrar o aplicativo no portal de serviços do Gov.br
2. Implementar o fluxo OAuth 2.0 para autenticação
3. Utilizar os endpoints da API de validação de CPF
4. Seguir os padrões de segurança estabelecidos pelo ITI

Recursos necessários:
- Certificado Digital (e-CNPJ)
- Credenciais de acesso ao ambiente de homologação
- Documentação técnica da API Gov.br

#### Integração Cartão SUS

Para integrar com o sistema do Cartão SUS, será necessário:

1. Solicitar acesso à API do DataSUS
2. Implementar a validação do número do Cartão SUS
3. Integrar com o sistema de prontuário eletrônico
4. Seguir os protocolos de segurança do DataSUS

Recursos necessários:
- Credenciais de acesso ao WebService do DataSUS
- Certificado de segurança válido
- Documentação da API do Cartão SUS

## 🤝 Como Contribuir

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob uma licença personalizada que permite:

- ✅ Visualizar e fazer fork do código fonte
- ✅ Propor melhorias através de pull requests
- ✅ Uso para fins de estudo e desenvolvimento pessoal
- ❌ Uso comercial sem autorização expressa
- ❌ Redistribuição sem autorização expressa
- ❌ Modificação e distribuição sem autorização expressa

Para usar este projeto em qualquer contexto comercial ou fazer modificações para distribuição, entre em contato com o proprietário através dos canais de contato fornecidos abaixo para obter autorização expressa.

Todos os direitos reservados © Emmanuel Cosme Martins Bento

## 📞 Suporte

Para suporte, abra uma issue no repositório.

---
## CONTATOS
[![Linkedin Badge](https://img.shields.io/badge/-LinkedIn-0072b1?style=for-the-badge&logo=Linkedin&logoColor=white)](https://www.linkedin.com/in/emmanuel-cosme-martins-bento-3963bb1b9/ 'Contato pelo LinkedIn')
[![Gmail Badge](https://img.shields.io/badge/-gmail-c14438?style=for-the-badge&logo=Gmail&logoColor=white)](mailto:emmanuelbento6@gmail.com 'Contato via Email')
