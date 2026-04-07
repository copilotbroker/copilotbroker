import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Política de Privacidade | Enove Imobiliária</title>
        <meta name="description" content="Política de Privacidade da Enove Imobiliária e do sistema Copilot Broker." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <div className="container max-w-3xl py-12 px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground mb-10">
            Última atualização: 7 de abril de 2026
          </p>

          <div className="prose prose-invert prose-sm max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introdução</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Enove Imobiliária ("nós", "nosso") opera o site onovocondominio.com.br e a plataforma Copilot Broker
                (copilotbroker.com.br). Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e
                protegemos suas informações pessoais ao utilizar nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Informações que coletamos</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Podemos coletar as seguintes informações:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Nome completo e dados de contato (e-mail, telefone/WhatsApp)</li>
                <li>CPF (quando necessário para propostas comerciais)</li>
                <li>Dados de navegação (cookies, endereço IP, páginas visitadas)</li>
                <li>Dados de formulários de cadastro em landing pages de empreendimentos</li>
                <li>Informações de autenticação (e-mail e senha criptografada)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Uso de dados do Google</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Nossa plataforma pode solicitar acesso à sua conta Google para integração com o Google Calendar. Ao
                autorizar essa conexão, acessamos:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Google Calendar (leitura e escrita de eventos):</strong> para sincronizar agendamentos de visitas e compromissos comerciais diretamente na agenda do corretor.</li>
                <li><strong>Endereço de e-mail da conta Google:</strong> para identificar a conta conectada.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>Uso limitado:</strong> O uso das informações recebidas das APIs do Google está em conformidade com a{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  Política de Dados de Usuário dos Serviços de API do Google
                </a>
                , incluindo os requisitos de uso limitado. Nós:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                <li>Usamos os dados do Google Calendar exclusivamente para sincronizar eventos de agenda do corretor</li>
                <li>Não compartilhamos dados do Google com terceiros</li>
                <li>Não usamos dados do Google para exibição de publicidade</li>
                <li>Armazenamos tokens de acesso de forma criptografada no servidor, nunca no navegador do usuário</li>
                <li>Permitimos a revogação do acesso a qualquer momento através das configurações de perfil</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Finalidade do tratamento</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Utilizamos seus dados para:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Gerenciar leads e oportunidades comerciais de empreendimentos imobiliários</li>
                <li>Enviar comunicações relacionadas a empreendimentos de seu interesse</li>
                <li>Sincronizar agendamentos com o Google Calendar</li>
                <li>Melhorar a experiência do usuário na plataforma</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Compartilhamento de dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Seus dados podem ser compartilhados com corretores de imóveis associados à Enove Imobiliária para fins de
                atendimento comercial. Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para
                fins de marketing sem seu consentimento expresso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Armazenamento e segurança</h2>
              <p className="text-muted-foreground leading-relaxed">
                Seus dados são armazenados em servidores seguros com criptografia em trânsito (TLS/SSL) e em repouso.
                Tokens de autenticação de terceiros (como Google) são armazenados de forma segura no servidor e nunca
                expostos ao navegador do usuário. Implementamos controles de acesso baseados em funções (RLS) para
                garantir que cada usuário acesse apenas os dados pertinentes à sua função.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Seus direitos (LGPD)</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Revogar o consentimento a qualquer momento</li>
                <li>Solicitar a portabilidade dos dados</li>
                <li>Desconectar integrações (como Google Calendar) a qualquer momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies e tecnologias semelhantes para melhorar a experiência de navegação, analisar o tráfego
                do site e personalizar conteúdo. Cookies de rastreamento de terceiros (como Meta Pixel e Google Analytics)
                podem ser utilizados para fins de remarketing com seu consentimento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato:
              </p>
              <ul className="list-none pl-0 text-muted-foreground space-y-1 mt-2">
                <li><strong>Enove Imobiliária</strong></li>
                <li>E-mail: contato@enoveimobiliaria.com.br</li>
                <li>Site: <a href="https://www.enoveimobiliaria.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">www.enoveimobiliaria.com.br</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Alterações nesta política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de atualizar esta Política de Privacidade a qualquer momento. Alterações
                significativas serão comunicadas por meio da plataforma ou por e-mail.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
