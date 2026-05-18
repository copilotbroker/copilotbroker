import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logoEnove from "@/assets/logo-enove.png";

const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

export default function LeadDeclaracaoPrint() {
  const { leadId } = useParams<{ leadId: string }>();
  const [lead, setLead] = useState<any>(null);
  const [cad, setCad] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!leadId) return;
      const [{ data: l }, { data: c }] = await Promise.all([
        supabase.from("leads").select("*").eq("id", leadId).maybeSingle(),
        supabase.from("lead_cadastro_completo").select("*").eq("lead_id", leadId).maybeSingle(),
      ]);
      setLead(l); setCad(c); setLoading(false);
    })();
  }, [leadId]);

  if (loading) return <div className="p-10 text-slate-700">Carregando...</div>;

  const nome = cad?.nome_completo || lead?.name || "";
  const cpf = cad?.cpf || lead?.cpf || "";
  const today = new Date();
  const dataStr = `Estância Velha, ${today.getDate()} de ${MESES[today.getMonth()]} de ${today.getFullYear()}.`;

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 print:p-0">
      <style>{`@media print { .no-print { display: none } body { background: white } }`}</style>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 no-print">
          <h1 className="text-xl font-semibold">Declaração</h1>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm">Imprimir / Salvar PDF</button>
        </div>

        <div className="flex justify-center mb-8">
          <img src={logoEnove} alt="Enove" className="h-16" />
        </div>

        <div className="text-right text-sm mb-8">{dataStr}</div>

        <h2 className="text-base font-semibold mb-3">Declaração</h2>
        <div className="text-sm leading-relaxed space-y-3 text-justify">
          <p>À</p>
          <p><strong>ÁBACO</strong></p>
          <p>
            Eu, <strong>{nome || "[NOME COMPLETO DO CLIENTE]"}</strong>, inscrito(a) no CPF sob nº <strong>{cpf || "[CPF DO CLIENTE]"}</strong>, declaro, para os devidos fins que, desejo ser atendido(a) pela ENOVE IMOBILIÁRIA LTDA, SELECT LANÇAMENTOS IMOBILIÁRIOS LTDA, e/ou pelos seus corretores credenciados, em relação aos empreendimentos, unidades imobiliárias, propostas, negociações e demais tratativas comerciais vinculadas à Ábaco.
          </p>
          <p>
            Declaro, ainda, que esta manifestação tem por finalidade autorizar a continuidade do meu atendimento comercial pelas empresas e/ou profissional acima indicados, inclusive na hipótese de meu cadastro, contato inicial ou atendimento anterior ter sido realizado por outro corretor, imobiliária ou canal de vendas.
          </p>
          <p>
            Dessa forma, autorizo expressamente que a Ábaco considere a Enove Imobiliária Ltda, a Select Lançamentos Imobiliários Ltda e/ou seus corretores credenciados como responsáveis pela continuidade do meu atendimento, recebimento de informações, apresentação de oportunidades, intermediação de propostas e demais atos necessários à negociação imobiliária de meu interesse.
          </p>
          <p>
            Autorizo, também, o compartilhamento e tratamento dos meus dados pessoais estritamente necessários para fins de atendimento comercial, análise de interesse, envio de informações, elaboração de propostas e condução das tratativas imobiliárias, nos termos da Lei Geral de Proteção de Dados — Lei nº 13.709/2018.
          </p>
        </div>

        <div className="mt-8 text-sm">{dataStr}</div>
        <div className="mt-16 text-center text-sm">
          <div className="border-t border-slate-400 w-80 mx-auto" />
          <div className="mt-1">Assinatura</div>
        </div>
      </div>
    </div>
  );
}
