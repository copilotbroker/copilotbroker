import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import logoEnove from "@/assets/logo-enove.png";

const TermosMonaco = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b border-border/50">
        <div className="container py-4 flex items-center justify-between">
          <Link
            to="/xangrila/monaco#cadastro"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao cadastro
          </Link>
          <img src={logoEnove} alt="Enove" className="h-6 w-auto" />
        </div>
      </header>

      <main className="container py-8 md:py-12 lg:py-20">
        <div className="max-w-3xl mx-auto space-y-12 md:space-y-16">
          <section id="politica-de-privacidade">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-foreground mb-6 md:mb-8">
              Política de Privacidade
            </h1>
            <div className="space-y-6 md:space-y-8 text-muted-foreground text-sm sm:text-base">
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">1. Controladora dos dados pessoais</h2>
                <p className="leading-relaxed">A ENOVE IMOBILIÁRIA LTDA, pessoa jurídica de direito privado, doravante denominada ENOVE, é a controladora dos dados pessoais coletados por meio deste formulário, nos termos da Lei nº 13.709/2018 – Lei Geral de Proteção de Dados (LGPD).</p>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">2. Dados pessoais coletados</h2>
                <p className="mb-2 leading-relaxed">Por meio deste formulário, poderão ser coletados os seguintes dados pessoais:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 md:ml-4"><li>Nome</li><li>Telefone (incluindo WhatsApp)</li></ul>
                <p className="mt-2 leading-relaxed">Os dados são fornecidos voluntariamente pelo titular.</p>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">3. Finalidade do tratamento dos dados</h2>
                <p className="mb-2 leading-relaxed">Os dados pessoais coletados serão utilizados para as seguintes finalidades:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 md:ml-4">
                  <li>Entrar em contato com o titular para envio de informações sobre o empreendimento Mônaco Grand Marina em Xangri-lá;</li>
                  <li>Apresentar oportunidades imobiliárias;</li>
                  <li>Enviar comunicações comerciais, informativas e promocionais;</li>
                  <li>Realizar atendimento comercial e esclarecimento de dúvidas.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">4. Base legal para o tratamento</h2>
                <p className="mb-2 leading-relaxed">O tratamento dos dados pessoais ocorre com fundamento:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 md:ml-4">
                  <li>No consentimento expresso do titular, manifestado por meio do aceite desta Política de Privacidade; e</li>
                  <li>No legítimo interesse comercial da ENOVE.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">5. Autorização para contato</h2>
                <p className="mb-2 leading-relaxed">Ao marcar o checkbox de autorização e enviar o formulário, o titular autoriza expressamente que:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 md:ml-4">
                  <li>A Enove Imobiliária Ltda; e</li>
                  <li>Seus corretores associados, parceiros comerciais e profissionais vinculados entrem em contato por telefone, WhatsApp e outros meios.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">6. Compartilhamento de dados</h2>
                <p className="leading-relaxed">Os dados pessoais poderão ser compartilhados com corretores associados, incorporadora responsável e prestadores de serviços. A ENOVE não comercializa dados pessoais.</p>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">7. Armazenamento e segurança</h2>
                <p className="leading-relaxed">A ENOVE adota medidas técnicas e administrativas adequadas para proteger os dados pessoais. Os dados serão armazenados pelo período necessário.</p>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">8. Direitos do titular</h2>
                <p className="mb-2 leading-relaxed">O titular poderá, a qualquer momento, solicitar:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 md:ml-4">
                  <li>Acesso aos seus dados;</li><li>Correção ou atualização;</li><li>Exclusão dos dados;</li><li>Revogação do consentimento.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">9. Atualizações</h2>
                <p className="leading-relaxed">Esta Política de Privacidade poderá ser alterada a qualquer tempo.</p>
              </div>
            </div>
          </section>

          <hr className="border-border/50" />

          <section id="termos-de-uso">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-foreground mb-2 md:mb-4">Termos de Uso</h1>
            <p className="text-muted-foreground text-sm mb-6 md:mb-8">Formulário de Divulgação – Mônaco Grand Marina, Xangri-lá/RS</p>
            <div className="space-y-6 md:space-y-8 text-muted-foreground text-sm sm:text-base">
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">1. Finalidade do formulário</h2>
                <p className="mb-2 leading-relaxed">Este formulário tem como finalidade exclusiva o cadastro de interessados para:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 md:ml-4">
                  <li>Receber informações sobre o empreendimento Mônaco Grand Marina;</li>
                  <li>Ser contatado pela Enove Imobiliária Ltda e seus corretores.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">2. Origem das informações</h2>
                <p className="leading-relaxed">As informações divulgadas são fornecidas pela Incorporadora responsável. A ENOVE atua como intermediadora imobiliária.</p>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">3. Ausência de garantia de reserva ou compra</h2>
                <p className="leading-relaxed">O cadastro não garante reserva de unidade, não assegura prioridade de compra e não configura proposta ou compromisso.</p>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">4. Caráter ilustrativo</h2>
                <p className="leading-relaxed">Imagens, plantas, perspectivas e materiais apresentados são meramente ilustrativos. O empreendimento poderá sofrer alterações.</p>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">5. Responsabilidade do usuário</h2>
                <p className="leading-relaxed">O usuário declara que as informações fornecidas são verdadeiras e que leu e concorda com estes Termos de Uso e Política de Privacidade.</p>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2 md:mb-3">6. Foro</h2>
                <p className="leading-relaxed">Fica eleito o foro da comarca de <strong className="text-foreground">Xangri-lá/RS</strong> para dirimir eventuais controvérsias.</p>
              </div>
            </div>
          </section>

          <div className="text-center pt-4 md:pt-8">
            <Link
              to="/xangrila/monaco#cadastro"
              className="inline-flex items-center gap-2 btn-primary min-h-[48px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao cadastro
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermosMonaco;
