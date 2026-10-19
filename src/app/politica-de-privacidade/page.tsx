import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade | ContaCerta",
  description:
    "Saiba como o ContaCerta trata e protege os dados pessoais e comerciais dos seus utilizadores.",
  alternates: {
    canonical: "https://contacertamz.site/politica-de-privacidade",
  },
};

const sections = [
  {
    title: "1. Quem somos",
    body: (
      <>
        O ContaCerta é uma plataforma de gestão destinada a pequenos negócios,
        com funcionalidades de registo de vendas, produtos, stock, clientes,
        valores a receber e outras ferramentas disponibilizadas na aplicação.
        Nesta política, as expressões “ContaCerta”, “nós” e “nosso” referem-se
        ao serviço ContaCerta.
      </>
    ),
  },
  {
    title: "2. Que dados podem ser tratados",
    body: (
      <>
        <p>
          Dependendo das funcionalidades que utilizas, podemos tratar as
          seguintes categorias de dados:
        </p>
        <ul>
          <li>
            <strong>Dados da conta:</strong> nome, endereço de email e
            identificadores necessários à autenticação e gestão da conta.
          </li>
          <li>
            <strong>Dados comerciais:</strong> produtos, quantidades, preços,
            vendas, custos, clientes, dívidas e pagamentos que registas na
            plataforma.
          </li>
          <li>
            <strong>Dados técnicos:</strong> informações necessárias ao
            funcionamento, diagnóstico, segurança e prevenção de utilização
            indevida do serviço, quando disponibilizadas pelos sistemas
            utilizados.
          </li>
          <li>
            <strong>Comunicações:</strong> informações que nos envias quando
            pedes assistência ou contactas o suporte.
          </li>
        </ul>
        Não introduzas palavras-passe bancárias, códigos secretos de carteiras
        móveis ou outros dados de autenticação financeira nos campos da
        aplicação.
      </>
    ),
  },
  {
    title: "3. Início de sessão com Google",
    body: (
      <>
        Se escolheres iniciar sessão com Google, o processo de autenticação
        utiliza os serviços da Google. Recebemos os dados disponibilizados
        necessários para identificar e gerir a tua conta, como o endereço de
        email e, quando fornecido, o nome associado ao perfil. O tratamento
        desses dados pela Google também está sujeito à{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noreferrer"
        >
          Política de Privacidade da Google
        </a>
        .
      </>
    ),
  },
  {
    title: "4. Para que utilizamos os dados",
    body: (
      <>
        Utilizamos os dados, conforme aplicável, para:
        <ul>
          <li>Criar, autenticar e administrar contas de utilizador;</li>
          <li>Disponibilizar as funcionalidades de gestão do negócio;</li>
          <li>Associar os registos comerciais ao negócio correcto;</li>
          <li>Prestar suporte e responder a pedidos;</li>
          <li>Proteger a plataforma, investigar erros e prevenir abusos;</li>
          <li>
            Administrar planos, subscrições e pagamentos quando essas
            funcionalidades forem utilizadas;
          </li>
          <li>Cumprir obrigações legais aplicáveis.</li>
        </ul>
        Não declaramos utilizar os dados para publicidade personalizada ou
        vender dados pessoais a terceiros.
      </>
    ),
  },
  {
    title: "5. Prestadores de serviços",
    body: (
      <>
        Para disponibilizar o ContaCerta, podemos depender de fornecedores
        tecnológicos, incluindo serviços de alojamento, autenticação,
        armazenamento e base de dados, como Vercel, Supabase e Google, conforme
        aplicável. Esses fornecedores podem tratar dados na medida necessária
        à prestação dos respectivos serviços e segundo as suas condições e
        políticas.
        <p>
          Os dados poderão ser tratados ou armazenados fora de Moçambique,
          dependendo da localização e configuração dos serviços utilizados.
        </p>
        Não disponibilizamos dados pessoais a terceiros para utilização
        independente, excepto quando necessário para prestar o serviço,
        cumprir a lei ou proteger direitos e segurança legítimos.
      </>
    ),
  },
  {
    title: "6. Dados dos clientes do teu negócio",
    body: (
      <>
        Se registares informações sobre os teus próprios clientes, és
        responsável por assegurar que tens fundamento legítimo para as
        recolher e utilizar e que informas essas pessoas quando necessário.
        Deves introduzir apenas os dados necessários à gestão do negócio e
        evitar informações excessivas ou sensíveis.
      </>
    ),
  },
  {
    title: "7. Conservação e eliminação",
    body: (
      <>
        Conservamos os dados pelo período necessário à disponibilização do
        serviço, à gestão da conta, à segurança e ao cumprimento de obrigações
        legais aplicáveis. O período pode variar consoante a categoria de
        dados e as circunstâncias.
        <p>
          Para pedir informações, corrigir dados ou solicitar a eliminação da
          tua conta e dos dados associados, contacta-nos pelo email abaixo.
          Alguns registos poderão ter de ser conservados quando a lei o exigir
          ou quando exista outra razão legítima aplicável. A eliminação e os
          seus efeitos serão avaliados de acordo com os dados e sistemas
          envolvidos.
        </p>
      </>
    ),
  },
  {
    title: "8. Segurança",
    body: (
      <>
        Aplicamos medidas técnicas e organizacionais destinadas a proteger os
        dados contra acesso não autorizado, perda, alteração ou divulgação
        indevida. Nenhum serviço informático pode garantir segurança absoluta.
        Mantém as tuas credenciais privadas, termina a sessão em dispositivos
        partilhados e informa-nos se suspeitares de acesso indevido à tua
        conta.
      </>
    ),
  },
  {
    title: "9. Os teus direitos e as tuas escolhas",
    body: (
      <>
        Podes contactar-nos para esclarecer que dados são tratados, pedir a
        correcção de informações ou solicitar a eliminação dos dados quando
        aplicável. Os pedidos serão analisados à luz da legislação aplicável e
        poderão exigir a confirmação da tua identidade para proteger a conta.
        Também podes gerir as permissões da tua conta Google através das
        ferramentas disponibilizadas pela Google.
      </>
    ),
  },
  {
    title: "10. Alterações a esta política",
    body: (
      <>
        Podemos actualizar esta política quando o serviço, as práticas de
        tratamento de dados ou as obrigações legais mudarem. Publicaremos a
        versão actualizada nesta página e indicaremos a data da última
        actualização. Se uma alteração exigir comunicação específica, faremos
        essa comunicação pelos meios adequados.
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
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
          Informação e transparência
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Política de Privacidade
        </h1>
        <p className="mt-4 text-sm text-muted">
          Última actualização: 19 de Outubro de 2026
        </p>
        <p className="mt-6 text-base leading-7 text-muted">
          Esta política explica como o ContaCerta trata informações pessoais e
          comerciais quando utilizas a plataforma. Ao utilizares o serviço,
          recomendamos que leias esta informação com atenção.
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
          <h2 className="text-lg font-bold">11. Contacto</h2>
          <p className="mt-3 text-sm leading-7 text-ink/80">
            Para questões sobre esta política, privacidade, acesso ou pedidos
            relativos aos teus dados, contacta:
          </p>
          <a
            className="mt-2 inline-block break-all font-semibold text-brand hover:underline"
            href="mailto:fernandoorlandobanda@gmail.com"
          >
            fernandoorlandobanda@gmail.com
          </a>
        </section>

        <footer className="mt-10 flex flex-wrap gap-x-5 gap-y-3 border-t border-line pt-6 text-sm text-muted">
          <Link className="hover:text-brand" href="/termos-de-servico">
            Termos de Serviço
          </Link>
          <Link className="hover:text-brand" href="/login">
            ContaCerta
          </Link>
        </footer>
      </article>
    </main>
  );
}
