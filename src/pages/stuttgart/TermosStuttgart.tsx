import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import logoEnove from "@/assets/logo-enove.png";

const TermosStuttgart = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <Link to="/ivoti/stuttgart#cadastro" className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors text-sm min-h-[44px] px-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao cadastro
          </Link>
          <img src={logoEnove} alt="Enove" className="h-6 w-auto brightness-0 invert" />
        </div>
      </header>

      <main className="container py-8 md:py-12 lg:py-20">
        <div className="max-w-3xl mx-auto space-y-12 md:space-y-16">

          <section id="politica-de-privacidade">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-foreground mb-6 md:mb-8">Política de Privacidade</h1>
            <div className="space-y-6 text-muted-foreground text-sm sm:text-base">
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2">1. Controladora dos dados pessoais</h2>
                <p className="leading-relaxed">A ENOVE IMOBILIÁRIA LTDA é a controladora dos dados pessoais coletados, nos termos da LGPD (Lei nº 13.709/2018).</p>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2">2. Dados coletados</h2>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Nome</li>
                  <li>Telefone (incluindo WhatsApp)</li>
                </ul>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2">3. Finalidade</h2>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Envio de informações sobre o empreendimento Jardins de Stuttgart em Ivoti;</li>
                  <li>Apresentar oportunidades imobiliárias;</li>
                  <li>Realizar atendimento comercial.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2">4. Direitos do titular</h2>
                <p className="leading-relaxed">O titular pode, a qualquer momento, solicitar acesso, correção, exclusão ou revogação do consentimento.</p>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          <section id="termos-de-uso">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-foreground mb-2 md:mb-4">Termos de Uso</h1>
            <p className="text-muted-foreground text-sm mb-6">Empreendimento Jardins de Stuttgart, Ivoti/RS</p>

            <div className="space-y-6 text-muted-foreground text-sm sm:text-base">
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2">1. Finalidade</h2>
                <p className="leading-relaxed">Cadastro de interessados para receber informações comerciais sobre o empreendimento e ser contatado pela Enove Imobiliária Ltda e seus corretores associados.</p>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2">2. Ausência de garantia de reserva</h2>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Não garante reserva de unidade;</li>
                  <li>Não assegura prioridade de compra;</li>
                  <li>Não configura proposta nem compromisso de compra e venda.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2">3. Caráter ilustrativo</h2>
                <p className="leading-relaxed">Imagens, plantas, perspectivas e materiais apresentados são meramente ilustrativos. As características finais serão aquelas dos documentos oficiais da incorporadora.</p>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2">4. Foro</h2>
                <p className="leading-relaxed">Fica eleito o foro da comarca de <strong className="text-foreground">Novo Hamburgo/RS</strong> para dirimir eventuais controvérsias.</p>
              </div>
            </div>
          </section>

          <div className="text-center pt-4">
            <Link to="/ivoti/stuttgart#cadastro" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium uppercase tracking-[0.15em] text-xs hover:bg-primary/90 transition-colors min-h-[48px] rounded-md">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao cadastro
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermosStuttgart;
