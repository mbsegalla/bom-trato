import type { Metadata } from 'next';
import Link from 'next/link';

import { BrandLogo } from '@/components/brandLogo';
import { legalDocuments, legalIdentity } from '@/modules/legal/data/legal.data';
import { MarketingHeader } from '@/modules/marketing/components/marketingHeader';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Conheça os Termos de Uso do Bom Trato.',
  alternates: {
    canonical: '/termos',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <MarketingHeader />

      <main className="px-6 py-14 sm:py-20 lg:px-10">
        <article className="mx-auto max-w-4xl">
          <p className="text-sm font-medium text-primary">Documentos legais</p>

          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">Termos de Uso</h1>

          <p className="mt-4 text-sm text-muted-foreground">
            Versão {legalDocuments.terms.version} · Vigente desde {legalDocuments.terms.effectiveDate}
          </p>

          <div className="mt-10 space-y-10 leading-relaxed text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground">1. Sobre estes Termos</h2>

              <p className="mt-3">
                Estes Termos de Uso regulam o acesso e a utilização do Bom Trato, uma plataforma digital destinada à
                organização e à gestão de atividades de profissionais e pequenos negócios prestadores de serviços.
              </p>

              <p className="mt-3">
                O Bom Trato é disponibilizado por {legalIdentity.providerName}, inscrito sob o documento{' '}
                {legalIdentity.document}, com endereço em {legalIdentity.address}, doravante denominado “Bom Trato”.
              </p>

              <p className="mt-3">
                Ao criar uma conta, contratar um plano ou utilizar a plataforma, o Usuário declara ter lido e aceitado
                estes Termos de Uso. O Aviso de Privacidade é apresentado separadamente e explica como os dados pessoais
                são tratados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">2. Quem pode utilizar o Bom Trato</h2>

              <p className="mt-3">
                O serviço é destinado a pessoas legalmente capazes de contratar e a representantes autorizados de
                empresas ou organizações. Ao utilizar o Bom Trato em nome de uma empresa ou organização, o Usuário
                declara possuir poderes suficientes para vinculá-la a estes Termos.
              </p>

              <p className="mt-3">
                O Usuário é responsável por fornecer informações verdadeiras, atuais e completas durante o cadastro e
                por mantê-las atualizadas durante a utilização da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">3. Conta e segurança</h2>

              <p className="mt-3">
                Cada conta é pessoal e deve ser utilizada exclusivamente por seu titular, salvo funcionalidades
                específicas de equipe disponibilizadas pela plataforma.
              </p>

              <p className="mt-3">
                O Usuário deve proteger suas credenciais e não permitir o uso indevido da conta por terceiros. O Bom
                Trato poderá adotar mecanismos de segurança como confirmação de e-mail, autenticação por provedores
                externos, sessões autenticadas, limitação de tentativas e revogação de sessões.
              </p>

              <p className="mt-3">
                O Usuário deve comunicar o Bom Trato caso identifique acesso não autorizado, perda de credenciais ou
                qualquer suspeita de comprometimento da conta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">4. Organizações e equipes</h2>

              <p className="mt-3">
                O Bom Trato permite a criação e administração de organizações. O proprietário da organização poderá,
                conforme o plano contratado, convidar outras pessoas para integrarem sua equipe.
              </p>

              <p className="mt-3">
                O proprietário é responsável por administrar os acessos concedidos à organização, definir permissões
                adequadas e remover membros que não devam mais ter acesso às informações do negócio.
              </p>

              <p className="mt-3">
                Ações realizadas por integrantes autorizados da equipe poderão produzir efeitos sobre informações e
                configurações da organização de acordo com as permissões atribuídas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">5. Funcionalidades da plataforma</h2>

              <p className="mt-3">
                O Bom Trato pode disponibilizar recursos para cadastro de clientes, catálogo de serviços, elaboração e
                compartilhamento de orçamentos, ordens de serviço, agendamentos, acompanhamento de recebimentos,
                notificações, gestão de equipe, perfil público, solicitações de orçamento, avaliações e outras
                funcionalidades relacionadas à gestão de serviços.
              </p>

              <p className="mt-3">
                As funcionalidades disponíveis podem variar conforme o plano contratado, a evolução do produto,
                requisitos técnicos, condições comerciais ou necessidades relacionadas à segurança e manutenção da
                plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">6. Clientes, orçamentos e ordens de serviço</h2>

              <p className="mt-3">
                Os registros de clientes, propostas, serviços, valores, datas e demais informações comerciais inseridas
                pelo Usuário são de sua responsabilidade.
              </p>

              <p className="mt-3">
                O Bom Trato fornece ferramentas para organização dessas informações, mas não é parte dos contratos de
                prestação de serviços celebrados entre o profissional e seus clientes e não define preços, condições,
                garantias ou obrigações comerciais assumidas entre eles.
              </p>

              <p className="mt-3">
                O profissional permanece responsável pelo serviço que oferece, pelas informações fornecidas aos seus
                clientes e pelo cumprimento das obrigações legais, fiscais, profissionais e comerciais aplicáveis à sua
                atividade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">7. Vitrine pública e solicitações de orçamento</h2>

              <p className="mt-3">
                O Usuário poderá, quando a funcionalidade estiver disponível, publicar um perfil profissional na vitrine
                do Bom Trato com informações sobre seu negócio, serviços, localização, logotipo, avaliações e meios de
                contato.
              </p>

              <p className="mt-3">
                Visitantes poderão utilizar a vitrine para localizar profissionais e enviar solicitações de orçamento. A
                existência de um perfil na plataforma não representa certificação, garantia ou recomendação do Bom Trato
                quanto à qualidade, habilitação profissional, segurança ou resultado dos serviços oferecidos.
              </p>

              <p className="mt-3">
                O Usuário deve utilizar os dados recebidos por meio de solicitações de orçamento apenas para finalidades
                legítimas relacionadas ao atendimento solicitado e observando a legislação aplicável.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">8. Avaliações</h2>

              <p className="mt-3">
                O Bom Trato poderá permitir avaliações relacionadas a serviços registrados como concluídos na
                plataforma. Esses mecanismos buscam aumentar a confiabilidade das avaliações, mas não constituem
                certificação absoluta da identidade, qualidade ou experiência de qualquer profissional.
              </p>

              <p className="mt-3">
                É proibido manipular avaliações, criar avaliações falsas, avaliar artificialmente o próprio negócio,
                oferecer vantagens em troca de avaliações enganosas ou adotar qualquer prática destinada a alterar de
                forma artificial a reputação exibida.
              </p>

              <p className="mt-3">
                O Bom Trato poderá remover ou limitar a exibição de avaliações quando existirem indícios razoáveis de
                fraude, abuso, conteúdo ilegal, violação destes Termos ou utilização indevida do sistema de avaliações.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">9. Planos, assinatura, pagamento e renovação</h2>

              <p className="mt-3">
                Determinadas funcionalidades dependem da contratação de um plano pago. Preço, periodicidade, limites e
                recursos do plano são apresentados ao Usuário antes da contratação.
              </p>

              <p className="mt-3">
                Assinaturas recorrentes poderão ser renovadas automaticamente de acordo com a periodicidade escolhida,
                até que seja solicitado o cancelamento.
              </p>

              <p className="mt-3">
                Quando o cancelamento for programado para o término do período vigente, o acesso às funcionalidades
                contratadas permanecerá disponível até o encerramento desse período, salvo quando informado de forma
                diferente ou quando uma medida imediata for necessária por razões legais ou de segurança.
              </p>

              <p className="mt-3">
                O processamento de pagamentos poderá ser realizado por prestadores especializados. Dados completos de
                cartão podem ser fornecidos diretamente ao processador de pagamentos, enquanto o Bom Trato recebe apenas
                as informações necessárias para identificar a assinatura, o pagamento e a situação da cobrança.
              </p>

              <p className="mt-3">
                O não pagamento de valores devidos poderá resultar na limitação ou suspensão de funcionalidades pagas,
                observadas as condições apresentadas ao Usuário e a legislação aplicável.
              </p>

              <p className="mt-3">
                Alterações de preço, plano ou periodicidade serão comunicadas ou apresentadas de maneira adequada antes
                de produzirem efeitos quando exigido pela legislação ou pelas características da contratação.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                10. Direito de arrependimento, cancelamento e reembolsos
              </h2>

              <p className="mt-3">
                O Usuário poderá solicitar o cancelamento de sua assinatura utilizando os recursos disponibilizados na
                plataforma ou entrando em contato pelos canais indicados nestes Termos.
              </p>

              <p className="mt-3">
                Quando a contratação estiver sujeita às normas brasileiras de proteção ao consumidor e o direito de
                arrependimento for aplicável, o consumidor poderá exercê-lo no prazo legal de 7 (sete) dias, contado da
                contratação, observadas as condições previstas na legislação aplicável.
              </p>

              <p className="mt-3">
                Quando houver exercício válido do direito de arrependimento, os valores sujeitos à restituição serão
                devolvidos conforme a legislação aplicável e os procedimentos técnicos do meio de pagamento utilizado.
              </p>

              <p className="mt-3">
                Fora das situações em que a legislação assegure restituição obrigatória, o simples cancelamento da
                renovação não implica automaticamente reembolso proporcional de período de assinatura já iniciado, salvo
                quando houver condição comercial diferente expressamente apresentada ao Usuário.
              </p>

              <p className="mt-3">
                Nenhuma disposição destes Termos pretende restringir direitos obrigatórios assegurados ao consumidor
                pela legislação aplicável.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">11. Responsabilidade sobre dados inseridos</h2>

              <p className="mt-3">
                O Usuário é responsável por possuir fundamento legítimo para registrar e utilizar dados pessoais de
                clientes, membros da equipe e demais terceiros na plataforma.
              </p>

              <p className="mt-3">
                O Usuário não deve inserir dados desnecessários, informações obtidas ilegalmente, dados que violem
                direitos de terceiros ou conteúdos cuja utilização não esteja autorizada pela legislação aplicável.
              </p>

              <p className="mt-3">
                Quando o Bom Trato tratar dados pessoais exclusivamente de acordo com as instruções do Usuário ou de sua
                organização, caberá ao respectivo controlador definir as finalidades e fundamentos legais aplicáveis a
                esse tratamento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">12. Uso aceitável</h2>

              <p className="mt-3">
                É proibido utilizar o Bom Trato para atividades ilegais, fraudulentas, abusivas, discriminatórias,
                ofensivas, invasivas à privacidade, destinadas à disseminação de malware ou que comprometam a segurança
                e disponibilidade da plataforma.
              </p>

              <p className="mt-3">
                Também é proibido tentar obter acesso não autorizado a contas, sistemas ou informações de terceiros,
                explorar vulnerabilidades, contornar mecanismos de segurança, automatizar acessos de forma abusiva ou
                utilizar a plataforma de maneira capaz de causar prejuízo técnico a outros usuários.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">13. Serviços de terceiros</h2>

              <p className="mt-3">
                Algumas funcionalidades dependem de terceiros, como provedores de autenticação, processamento de
                pagamentos, envio de e-mails, hospedagem, banco de dados, monitoramento, armazenamento e infraestrutura
                em nuvem.
              </p>

              <p className="mt-3">
                A utilização desses serviços poderá estar sujeita também aos termos, políticas de privacidade,
                disponibilidade e limitações técnicas dos respectivos fornecedores.
              </p>

              <p className="mt-3">
                O Bom Trato poderá substituir fornecedores tecnológicos ao longo do tempo, desde que preserve as
                obrigações legais e contratuais aplicáveis ao serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">14. Disponibilidade e evolução do serviço</h2>

              <p className="mt-3">
                O Bom Trato busca manter a plataforma disponível, segura e funcional, mas não garante funcionamento
                ininterrupto ou totalmente livre de falhas.
              </p>

              <p className="mt-3">
                Manutenções, incidentes técnicos, atualizações, falhas de conectividade ou indisponibilidades de
                terceiros podem afetar temporariamente o serviço.
              </p>

              <p className="mt-3">
                Funcionalidades poderão ser atualizadas, substituídas, aprimoradas ou descontinuadas conforme a evolução
                do produto, observados os direitos contratuais e legais aplicáveis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">15. Propriedade intelectual</h2>

              <p className="mt-3">
                A marca Bom Trato, identidade visual, software, interfaces, textos, estrutura, funcionalidades e demais
                elementos próprios da plataforma são protegidos pela legislação aplicável.
              </p>

              <p className="mt-3">
                Estes Termos não transferem ao Usuário qualquer direito de propriedade intelectual sobre o Bom Trato. O
                Usuário mantém os direitos que possuir sobre conteúdos legítimos inseridos por ele na plataforma.
              </p>

              <p className="mt-3">
                O Usuário concede ao Bom Trato as autorizações tecnicamente necessárias para armazenar, processar,
                reproduzir e disponibilizar seus conteúdos exclusivamente para execução das funcionalidades da
                plataforma e cumprimento das finalidades relacionadas ao serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">16. Privacidade e proteção de dados</h2>

              <p className="mt-3">
                O tratamento de dados pessoais relacionado ao Bom Trato é detalhado no{' '}
                <Link href="/privacidade" className="font-medium text-primary underline underline-offset-4">
                  Aviso de Privacidade
                </Link>
                .
              </p>

              <p className="mt-3">
                O Usuário deverá observar a legislação de proteção de dados ao inserir ou utilizar informações de
                clientes, colaboradores ou terceiros na plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">17. Suspensão e encerramento</h2>

              <p className="mt-3">
                O Usuário poderá deixar de utilizar o serviço e, quando aplicável, solicitar o cancelamento da
                assinatura conforme as opções disponibilizadas na plataforma.
              </p>

              <p className="mt-3">
                O Bom Trato poderá limitar ou suspender acessos em situações de fraude, risco de segurança,
                inadimplência relacionada a funcionalidades pagas, violação grave destes Termos, obrigação legal ou
                necessidade de proteção da plataforma e de terceiros, observados os direitos aplicáveis e a
                proporcionalidade da medida.
              </p>

              <p className="mt-3">
                O encerramento da conta não implica necessariamente a eliminação imediata de todos os registros quando
                sua conservação for necessária para cumprimento de obrigação legal, exercício de direitos, segurança,
                prevenção de fraude ou outras hipóteses permitidas pela legislação.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">18. Limitação de responsabilidade</h2>

              <p className="mt-3">
                O Bom Trato é uma ferramenta de gestão e não garante aumento de vendas, obtenção de clientes,
                recebimento de valores, qualidade dos serviços prestados pelos usuários ou resultados comerciais
                específicos.
              </p>

              <p className="mt-3">
                Na extensão permitida pela legislação, o Bom Trato não responde por obrigações assumidas diretamente
                entre profissionais e seus clientes, atos praticados por usuários fora da plataforma ou informações
                incorretas inseridas por terceiros.
              </p>

              <p className="mt-3">
                Nenhuma disposição destes Termos pretende excluir ou limitar responsabilidade que não possa ser excluída
                ou limitada por lei.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">19. Alterações destes Termos</h2>

              <p className="mt-3">
                Estes Termos poderão ser atualizados para refletir mudanças legais, comerciais, de segurança ou
                funcionais.
              </p>

              <p className="mt-3">
                Alterações meramente editoriais poderão ocorrer sem criação de nova versão. Alterações materiais serão
                identificadas por nova versão e poderão exigir nova manifestação de aceite antes da continuidade do uso
                da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">20. Legislação aplicável</h2>

              <p className="mt-3">
                Estes Termos são regidos pela legislação brasileira. Eventuais controvérsias serão submetidas ao foro
                competente conforme a legislação aplicável, sem prejuízo dos direitos assegurados ao consumidor quando
                houver relação de consumo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">21. Contato</h2>

              <p className="mt-3">
                Dúvidas, solicitações relacionadas a estes Termos e pedidos relacionados à assinatura podem ser
                encaminhados para {legalIdentity.supportEmail}.
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

            <a href={`mailto:${legalIdentity.supportEmail}`} className="hover:text-foreground">
              Suporte
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
