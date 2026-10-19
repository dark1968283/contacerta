import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Serviço | ContaCerta",
  description:
    "Conheça as condições de utilização da plataforma ContaCerta.",
  alternates: {
    canonical: "https://contacertamz.site/termos-de-servico",
  },
};

const sections = [
  {
    title: "1. Sobre o serviço",
    body: (
      <>
        O ContaCerta disponibiliza ferramentas digitais para apoiar a gestão
        quotidiana de pequenos negócios, incluindo registos de vendas,
        produtos, stock, clientes e valores a receber, de acordo com as
        funcionalidades disponíveis em cada momento.
      </>
    ),
  },
  {
    title: "2. Aceitação e elegibilidade",
    body: (
      <>
        Ao criares uma conta ou utilizares o serviço, concordas com estes
        Termos. Se utilizares o ContaCerta em nome de uma empresa ou de outro
        negócio, declaras ter autorização para o fazer. Se não concordares com
        estes Termos, não deverás utilizar o serviço.
      </>
    ),
  },
  {
    title: "3. Conta e segurança",
    body: (
      <>
        Deves fornecer informações correctas, manter os dados da conta
        actualizados e proteger as tuas credenciais. És responsável pelas
        actividades realizadas através da tua conta, sem prejuízo de situações
        de acesso não autorizado que devam ser investigadas. Informa o suporte
        se suspeitares que alguém acedeu à tua conta sem autorização.
      </>
    ),
  },
  {
    title: "4. Utilização permitida",
    body: (
      <>
        Comprometes-te a:
        <ul>
          <li>Utilizar o serviço de forma lícita e responsável;</li>
          <li>Introduzir dados que tenhas legitimidade para utilizar;</li>
          <li>Respeitar a privacidade e os direitos de terceiros;</li>
          <li>
            Não tentar aceder a contas, dados ou sistemas sem autorização;
          </li>
          <li>
            Não interferir com a segurança, disponibilidade ou funcionamento
            da plataforma;
          </li>
          <li>
            Não utilizar o serviço para fraude, actividades ilícitas ou
            distribuição de conteúdo malicioso.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "5. Dados e registos do negócio",
    body: (
      <>
        És responsável pela exactidão e actualização dos dados que introduzes,
        incluindo preços, quantidades, vendas, custos, clientes e valores a
        receber. Deves verificar os registos antes de tomar decisões
        comerciais.
        <p>
          O ContaCerta é uma ferramenta de apoio à gestão. Não substitui a tua
          obrigação de manter os documentos e registos exigidos por lei, nem
          garante que os dados introduzidos estejam correctos.
        </p>
      </>
    ),
  },
  {
    title: "6. Não é aconselhamento profissional",
    body: (
      <>
        Os cálculos, relatórios e informações apresentados pela plataforma
        destinam-se a apoiar a organização do negócio. Não constituem, por si
        só, aconselhamento contabilístico, fiscal, jurídico, de investimento
        ou financeiro profissional. Deves procurar um profissional qualificado
        quando a tua situação o exigir.
      </>
    ),
  },
  {
    title: "7. Planos, subscrições e pagamentos",
    body: (
      <>
        Algumas funcionalidades podem estar sujeitas a limites ou a planos
        pagos. Quando aplicável, os preços, a duração, as condições de
        pagamento e as funcionalidades incluídas serão apresentados nos
        ecrãs ou condições do plano correspondente.
        <p>
          És responsável por verificar as condições antes de confirmar uma
          compra ou renovação. A activação de funcionalidades pagas depende da
          confirmação válida do pagamento e das regras do plano. Os pedidos
          relativos a cobranças, cancelamentos ou reembolsos devem ser
          encaminhados ao suporte e serão tratados de acordo com as condições
          aplicáveis e a legislação em vigor.
        </p>
      </>
    ),
  },
  {
    title: "8. Disponibilidade e alterações",
    body: (
      <>
        Procuramos manter a plataforma disponível e funcional, mas podem
        ocorrer interrupções por manutenção, falhas técnicas, problemas de
        conectividade ou situações fora do nosso controlo. Não garantimos
        disponibilidade ininterrupta.
        <p>
          Podemos actualizar, corrigir ou alterar funcionalidades para manter
          ou melhorar o serviço. Quando uma alteração relevante exigir
          comunicação, procuraremos informar os utilizadores pelos meios
          adequados.
        </p>
      </>
    ),
  },
  {
    title: "9. Suspensão ou encerramento",
    body: (
      <>
        Podemos limitar ou suspender o acesso quando necessário para investigar
        suspeitas de fraude, proteger a plataforma ou os utilizadores, cumprir
        obrigações legais ou responder a uma violação destes Termos. Sempre
        que razoável e permitido, procuraremos informar o utilizador afectado.
        Podes contactar o suporte para pedir esclarecimentos sobre o acesso à
        tua conta ou o seu encerramento.
      </>
    ),
  },
  {
    title: "10. Propriedade intelectual",
    body: (
      <>
        A marca ContaCerta, o design, o software e os materiais da plataforma
        pertencem aos respectivos titulares ou são utilizados com autorização.
        Estes Termos não transferem a propriedade desses elementos para o
        utilizador. Manténs os direitos que possas ter sobre os dados e
        conteúdos que introduzes, sem prejuízo dos direitos de terceiros.
      </>
    ),
  },
  {
    title: "11. Responsabilidades e limitações",
    body: (
      <>
        Na medida permitida pela legislação aplicável, o ContaCerta não
        garante que o serviço seja adequado a todas as necessidades, nem que
        esteja livre de erros ou interrupções. Deves manter os teus próprios
        registos e cópias dos documentos importantes do negócio.
        <p>
          Nada nestes Termos pretende excluir direitos ou responsabilidades
          que não possam ser excluídos ou limitados pela lei aplicável.
        </p>
      </>
    ),
  },
  {
    title: "12. Privacidade",
    body: (
      <>
        O tratamento de dados pessoais é explicado na nossa{" "}
        <Link
          className="font-medium text-brand hover:underline"
          href="/politica-de-privacidade"
        >
          Política de Privacidade
        </Link>
        , que deves ler em conjunto com estes Termos.
      </>
    ),
  },
  {
    title: "13. Alterações aos Termos",
    body: (
      <>
        Podemos rever estes Termos quando o serviço ou as obrigações aplicáveis
        mudarem. A versão actualizada será publicada nesta página com a
        respectiva data. A utilização continuada após alterações, quando
        legalmente adequada, ficará sujeita à versão actualizada. Se não
        concordares com alterações relevantes, contacta o suporte antes de
        continuares a utilizar o serviço.
      </>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-line/70 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/login" className="text-xl font-extrabold tracking-tight">
            Conta<span className="text-brand">Certa</span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-brand hover:underline"
          >
            Voltar ao acesso
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">
          Condições de utilização
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Termos de Serviço
        </h1>
        <p className="mt-4 text-sm text-muted">
          Última actualização: 19 de Outubro de 2026
        </p>
        <p className="mt-6 text-base leading-7 text-muted">
          Estes Termos regulam a utilização do ContaCerta. Lê-os com atenção
          antes de criares uma conta ou utilizares as funcionalidades da
          plataforma.
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-line/70 bg-white p-5 sm:p-6"
            >
              <h2 className="text-lg font-bold tracking-tight">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-muted [&_a]:font-medium [&_a]:text-brand [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-2xl bg-brand-soft p-5 sm:p-6">
          <h2 className="text-lg font-bold">14. Contacto</h2>
          <p className="mt-3 text-sm leading-7 text-ink/80">
            Para questões sobre estes Termos, a tua conta, subscrições ou
            utilização do serviço, contacta:
          </p>
          <a
            className="mt-2 inline-block break-all font-semibold text-brand hover:underline"
            href="mailto:fernandoorlandobanda@gmail.com"
          >
            fernandoorlandobanda@gmail.com
          </a>
        </section>

        <footer className="mt-10 flex flex-wrap gap-x-5 gap-y-3 border-t border-line pt-6 text-sm text-muted">
          <Link
            className="hover:text-brand"
            href="/politica-de-privacidade"
          >
            Política de Privacidade
          </Link>
          <Link className="hover:text-brand" href="/login">
            ContaCerta
          </Link>
        </footer>
      </article>
    </main>
  );
}
