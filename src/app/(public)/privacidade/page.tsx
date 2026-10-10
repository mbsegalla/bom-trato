import type { Metadata } from 'next';
import Link from 'next/link';

import { BrandLogo } from '@/components/brandLogo';
import { legalDocuments, legalIdentity } from '@/modules/legal/data/legal.data';
import { MarketingHeader } from '@/modules/marketing/components/marketingHeader';

export const metadata: Metadata = {
  title: 'Aviso de Privacidade',
  description: 'Entenda como o Bom Trato trata dados pessoais.',
  alternates: {
    canonical: '/privacidade',
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <MarketingHeader />

      <main className="px-6 py-14 sm:py-20 lg:px-10">
        <article className="mx-auto max-w-4xl">
          <p className="text-sm font-medium text-primary">Privacidade</p>

          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">Aviso de Privacidade</h1>

          <p className="mt-4 text-sm text-muted-foreground">
            Versão {legalDocuments.privacy.version} · Vigente desde {legalDocuments.privacy.effectiveDate}
          </p>

          <div className="mt-10 space-y-10 leading-relaxed text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground">1. Sobre este Aviso</h2>

              <p className="mt-3">
                Este Aviso de Privacidade explica como dados pessoais podem ser tratados no contexto do Bom Trato.
              </p>

              <p className="mt-3">
                O serviço é disponibilizado por {legalIdentity.providerName}, documento {legalIdentity.document}, com
                endereço em {legalIdentity.address}.
              </p>

              <p className="mt-3">
                Dependendo da atividade realizada, o Bom Trato poderá atuar como controlador de dados pessoais ou como
                operador em nome do profissional ou organização que utiliza a plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">2. Dados relacionados à conta</h2>

              <p className="mt-3">
                Podemos tratar informações como nome, endereço de e-mail, identificadores de conta, informações de
                autenticação, vínculo com organizações, plano escolhido, confirmação de e-mail e informações necessárias
                para segurança da sessão.
              </p>

              <p className="mt-3">
                Quando o acesso utiliza um provedor externo, como Google, podemos receber informações necessárias para
                autenticar o Usuário, como identificador da conta, nome, e-mail e confirmação do e-mail.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">3. Dados do negócio</h2>

              <p className="mt-3">
                Podemos tratar nome do negócio, documento, telefone, e-mail, endereço, CEP, cidade, estado, logotipo,
                configurações, serviços oferecidos e informações relacionadas à equipe.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">4. Dados inseridos pelos usuários</h2>

              <p className="mt-3">
                Profissionais e organizações podem inserir dados de seus clientes e contatos, como nome, e-mail,
                telefone, endereço, serviços contratados, orçamentos, ordens de serviço, agendamentos, registros de
                pagamento e observações relacionadas ao atendimento.
              </p>

              <p className="mt-3">
                Para determinados tratamentos desses dados, o profissional ou organização é responsável por definir a
                finalidade e a base legal, enquanto o Bom Trato atua como fornecedor da infraestrutura tecnológica para
                executar o tratamento solicitado.
              </p>

              <p className="mt-3">
                O Bom Trato também poderá tratar determinadas informações como controlador quando necessário para
                segurança, prevenção de fraude, cumprimento de obrigações legais, defesa de direitos e funcionamento
                próprio da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">5. Vitrine, leads e avaliações</h2>

              <p className="mt-3">
                Quando um profissional publica sua vitrine, determinadas informações escolhidas por ele podem se tornar
                públicas, como nome profissional, serviços, localização, informações de contato, logotipo e avaliações.
              </p>

              <p className="mt-3">
                Visitantes que solicitam orçamento podem informar nome, telefone, e-mail, serviço de interesse e
                mensagem. Esses dados são disponibilizados ao profissional escolhido para permitir o atendimento da
                solicitação.
              </p>

              <p className="mt-3">
                Avaliações podem incluir nota, comentário, identificação exibida do avaliador e referência ao serviço
                realizado, conforme o funcionamento da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">6. Dados de assinatura e pagamento</h2>

              <p className="mt-3">
                Podemos tratar informações relacionadas ao plano, assinatura, valores, situação de pagamento, faturas,
                identificadores do cliente no processador de pagamento e eventos necessários para administrar a
                assinatura.
              </p>

              <p className="mt-3">
                Informações completas de cartão podem ser processadas diretamente pelo prestador de pagamentos e não
                precisam ser armazenadas pelo Bom Trato.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">7. Dados técnicos e de segurança</h2>

              <p className="mt-3">
                Podemos tratar endereço IP, informações do navegador e dispositivo, identificadores de sessão, registros
                de autenticação, eventos de segurança, data e horário de acessos e outras informações técnicas
                necessárias para proteger contas e sistemas.
              </p>

              <p className="mt-3">
                Também podemos registrar informações relacionadas ao aceite de documentos legais, incluindo versão,
                data, origem do aceite, endereço IP e agente do navegador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">8. Para que utilizamos os dados</h2>

              <p className="mt-3">Os dados pessoais podem ser tratados para:</p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>criar e administrar contas;</li>
                <li>autenticar usuários e proteger sessões;</li>
                <li>disponibilizar as funcionalidades contratadas;</li>
                <li>administrar organizações, equipes e permissões;</li>
                <li>processar e acompanhar assinaturas e pagamentos;</li>
                <li>permitir comunicação entre profissionais e pessoas que solicitaram atendimento;</li>
                <li>enviar comunicações operacionais e de segurança;</li>
                <li>prevenir fraude, abuso e acessos não autorizados;</li>
                <li>atender obrigações legais e regulatórias;</li>
                <li>exercer e defender direitos;</li>
                <li>melhorar a segurança, estabilidade e funcionamento da plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">9. Bases legais</h2>

              <p className="mt-3">
                O tratamento poderá se apoiar, conforme o caso, na execução de contrato ou de procedimentos preliminares
                solicitados pelo titular, cumprimento de obrigação legal ou regulatória, exercício regular de direitos,
                legítimo interesse e consentimento quando essa for a base adequada.
              </p>

              <p className="mt-3">
                A existência deste Aviso não significa que todos os tratamentos realizados pelo Bom Trato dependam de
                consentimento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">10. Compartilhamento com terceiros</h2>

              <p className="mt-3">
                O Bom Trato poderá utilizar prestadores especializados para executar partes da operação, incluindo
                hospedagem, banco de dados, armazenamento de arquivos, autenticação, processamento de pagamentos, envio
                de e-mails e infraestrutura tecnológica.
              </p>

              <p className="mt-3">
                Entre os fornecedores atualmente integrados ao produto podem existir serviços como Google para
                autenticação, Stripe para pagamentos, Resend para envio de comunicações e infraestrutura de
                armazenamento em nuvem.
              </p>

              <p className="mt-3">
                O compartilhamento é limitado ao necessário para a finalidade correspondente, observadas medidas
                contratuais e técnicas adequadas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">11. Transferências internacionais</h2>

              <p className="mt-3">
                Alguns prestadores de tecnologia podem armazenar ou processar dados fora do Brasil. Quando houver
                transferência internacional de dados pessoais, o Bom Trato buscará adotar os mecanismos e garantias
                exigidos pela legislação aplicável.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">12. Cookies e tecnologias semelhantes</h2>

              <p className="mt-3">
                O Bom Trato pode utilizar cookies ou tecnologias equivalentes estritamente necessários para
                autenticação, segurança, manutenção da sessão e funcionamento do serviço.
              </p>

              <p className="mt-3">
                Caso sejam utilizados futuramente cookies ou tecnologias não essenciais para análise, publicidade ou
                rastreamento, serão disponibilizados os controles adequados quando exigidos pela legislação aplicável.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">13. Retenção</h2>

              <p className="mt-3">
                Dados pessoais são mantidos pelo período necessário para cumprir as finalidades para as quais foram
                coletados, executar contratos, observar obrigações legais e regulatórias, proteger a segurança da
                plataforma e exercer ou defender direitos.
              </p>

              <p className="mt-3">
                Diferentes categorias de dados podem possuir períodos de retenção diferentes. O encerramento de uma
                conta não implica necessariamente eliminação imediata de todos os registros quando sua conservação for
                necessária ou permitida pela legislação.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">14. Segurança</h2>

              <p className="mt-3">
                O Bom Trato adota medidas técnicas e organizacionais destinadas a reduzir riscos de acesso não
                autorizado, alteração, perda, destruição ou divulgação indevida de informações.
              </p>

              <p className="mt-3">
                Nenhum sistema é totalmente imune a incidentes. Quando aplicável, incidentes relevantes serão tratados
                de acordo com os procedimentos e obrigações previstos na legislação.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">15. Direitos dos titulares</h2>

              <p className="mt-3">
                Nos casos previstos pela legislação, o titular poderá solicitar confirmação da existência de tratamento,
                acesso, correção, informações sobre compartilhamento, anonimização, bloqueio ou eliminação de dados
                inadequados ou excessivos, portabilidade quando regulamentada e aplicável, eliminação de dados tratados
                com consentimento quando cabível, revogação de consentimento e oposição a determinados tratamentos.
              </p>

              <p className="mt-3">
                A solicitação poderá exigir confirmação da identidade do requerente para evitar divulgação ou alteração
                indevida de informações.
              </p>

              <p className="mt-3">
                Quando os dados forem tratados pelo Bom Trato exclusivamente em nome de uma organização usuária, o
                titular poderá ser orientado a exercer determinados direitos diretamente perante essa organização.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">16. Critérios automatizados</h2>

              <p className="mt-3">
                Algumas funcionalidades podem utilizar critérios automatizados para organizar informações, como
                ordenação de perfis públicos por indicadores de reputação ou mecanismos destinados à segurança e
                prevenção de abuso.
              </p>

              <p className="mt-3">
                Esses mecanismos não têm como finalidade produzir decisões jurídicas sobre o titular. Caso o Bom Trato
                passe a realizar decisões automatizadas com efeitos relevantes, este Aviso poderá ser atualizado e os
                direitos aplicáveis serão observados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">17. Crianças e adolescentes</h2>

              <p className="mt-3">
                O Bom Trato é uma ferramenta destinada à gestão profissional e empresarial e não é direcionado
                especificamente a crianças ou adolescentes.
              </p>

              <p className="mt-3">
                Usuários não devem inserir dados de crianças ou adolescentes sem necessidade, fundamento legal e
                observância das regras específicas aplicáveis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">18. Atualizações deste Aviso</h2>

              <p className="mt-3">
                Este Aviso poderá ser atualizado para refletir mudanças na plataforma, nos fornecedores utilizados ou na
                legislação. A versão e a data de vigência serão apresentadas no início do documento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">19. Contato sobre privacidade</h2>

              <p className="mt-3">
                Solicitações e dúvidas relacionadas à privacidade e à proteção de dados pessoais podem ser encaminhadas
                para {legalIdentity.privacyEmail}.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">20. Termos de Uso</h2>

              <p className="mt-3">
                As regras de utilização da plataforma estão disponíveis nos{' '}
                <Link href="/termos" className="font-medium text-primary underline underline-offset-4">
                  Termos de Uso
                </Link>
                .
              </p>
            </section>
          </div>
        </article>
      </main>

      <footer className="border-t border-border px-6 py-8 lg:px-10">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
          <Link href="/" aria-label="Bom Trato — página inicial">
            <BrandLogo alt="" className="w-28" />
          </Link>

          <div className="flex gap-5 text-sm text-muted-foreground">
            <Link href="/termos" className="hover:text-foreground">
              Termos de Uso
            </Link>

            <Link href="/privacidade" className="hover:text-foreground">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
