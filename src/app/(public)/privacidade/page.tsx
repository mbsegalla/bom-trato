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
                Este Aviso de Privacidade explica como dados pessoais podem ser coletados, utilizados, armazenados,
                compartilhados e protegidos no contexto do Bom Trato.
              </p>

              <p className="mt-3">
                O serviço é disponibilizado por {legalIdentity.providerName}, documento {legalIdentity.document}, com
                endereço em {legalIdentity.address}.
              </p>

              <p className="mt-3">
                Dependendo da atividade realizada, o Bom Trato poderá atuar como controlador de dados pessoais ou como
                operador em nome do profissional ou organização que utiliza a plataforma.
              </p>

              <p className="mt-3">
                Quando o Bom Trato define as finalidades e os elementos essenciais de determinado tratamento, atua como
                controlador. Quando trata dados exclusivamente de acordo com as instruções de uma organização usuária,
                poderá atuar como operador.
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
                autenticar o Usuário, como identificador da conta, nome, e-mail e confirmação do endereço de e-mail.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">3. Dados do negócio</h2>

              <p className="mt-3">
                Podemos tratar nome do negócio, documento, telefone, e-mail, endereço, CEP, cidade, estado, logotipo,
                configurações, serviços oferecidos e informações relacionadas à equipe.
              </p>

              <p className="mt-3">
                Algumas dessas informações poderão ser exibidas publicamente quando o próprio Usuário optar por publicar
                seu perfil profissional ou utilizar funcionalidades públicas da plataforma.
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
                segurança, prevenção de fraude, cumprimento de obrigações legais, defesa de direitos, cobrança e
                funcionamento próprio da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">5. Dados pessoais sensíveis</h2>

              <p className="mt-3">
                O Bom Trato não é projetado para exigir o armazenamento rotineiro de dados pessoais sensíveis, como
                informações sobre saúde, origem racial ou étnica, convicção religiosa, opinião política, filiação
                sindical, vida sexual, dados genéticos ou biométricos.
              </p>

              <p className="mt-3">
                Usuários devem evitar inserir dados pessoais sensíveis quando eles não forem necessários para a
                finalidade legítima do atendimento. Quando esse tratamento for necessário, o Usuário responsável deverá
                observar as exigências específicas previstas na legislação aplicável.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">6. Vitrine, leads e avaliações</h2>

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
              <h2 className="text-xl font-semibold text-foreground">7. Dados de assinatura e pagamento</h2>

              <p className="mt-3">
                Podemos tratar informações relacionadas ao plano, assinatura, valores, situação de pagamento, faturas,
                identificadores do cliente no processador de pagamento e eventos necessários para administrar a
                assinatura.
              </p>

              <p className="mt-3">
                Informações completas de cartão podem ser processadas diretamente pelo prestador de pagamentos e não
                precisam ser armazenadas pelo Bom Trato.
              </p>

              <p className="mt-3">
                O Bom Trato poderá receber do processador informações sobre o resultado da cobrança, identificadores de
                transações, situação da assinatura, meio de pagamento utilizado de forma limitada e outros dados
                necessários para administrar a relação contratual.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">8. Dados técnicos e de segurança</h2>

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
              <h2 className="text-xl font-semibold text-foreground">9. Origem dos dados</h2>

              <p className="mt-3">
                Os dados pessoais tratados pelo Bom Trato podem ser fornecidos diretamente pelo titular, por uma
                organização ou profissional que utiliza a plataforma, por serviços de autenticação, por processadores de
                pagamento ou ser gerados automaticamente durante a utilização da plataforma.
              </p>

              <p className="mt-3">
                Também poderão ser tratados dados fornecidos por visitantes ao entrarem em contato com profissionais,
                solicitarem orçamento ou utilizarem outras funcionalidades públicas disponibilizadas pelo Bom Trato.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">10. Para que utilizamos os dados</h2>

              <p className="mt-3">Os dados pessoais podem ser tratados para:</p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>criar e administrar contas;</li>
                <li>autenticar usuários e proteger sessões;</li>
                <li>disponibilizar as funcionalidades contratadas;</li>
                <li>administrar organizações, equipes e permissões;</li>
                <li>processar e acompanhar assinaturas e pagamentos;</li>
                <li>permitir comunicação entre profissionais e pessoas que solicitaram atendimento;</li>
                <li>enviar comunicações operacionais, transacionais e de segurança;</li>
                <li>prestar suporte e responder solicitações;</li>
                <li>prevenir fraude, abuso e acessos não autorizados;</li>
                <li>identificar e corrigir falhas técnicas;</li>
                <li>atender obrigações legais e regulatórias;</li>
                <li>exercer e defender direitos;</li>
                <li>melhorar a segurança, estabilidade e funcionamento da plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">11. Bases legais</h2>

              <p className="mt-3">
                O tratamento poderá se apoiar, conforme o caso, na execução de contrato ou de procedimentos preliminares
                solicitados pelo titular, cumprimento de obrigação legal ou regulatória, exercício regular de direitos,
                legítimo interesse e consentimento quando essa for a base adequada.
              </p>

              <p className="mt-3">
                A base legal aplicável depende da finalidade, do contexto e da categoria de dados envolvidos. A
                existência deste Aviso não significa que todos os tratamentos realizados pelo Bom Trato dependam de
                consentimento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">12. Compartilhamento com terceiros</h2>

              <p className="mt-3">
                O Bom Trato poderá utilizar prestadores especializados para executar partes da operação, incluindo
                hospedagem, banco de dados, armazenamento de arquivos, autenticação, processamento de pagamentos,
                monitoramento, segurança, envio de e-mails e infraestrutura tecnológica.
              </p>

              <p className="mt-3">
                Conforme as funcionalidades utilizadas, esses fornecedores podem incluir serviços como Google para
                autenticação, Stripe para processamento de pagamentos e Resend para envio de comunicações, além de
                fornecedores de hospedagem, armazenamento, banco de dados e monitoramento utilizados pela infraestrutura
                da plataforma.
              </p>

              <p className="mt-3">
                O compartilhamento é limitado ao necessário para a finalidade correspondente e deve observar medidas
                técnicas, organizacionais e contratuais adequadas.
              </p>

              <p className="mt-3">
                O Bom Trato não comercializa dados pessoais como produto nem vende listas de dados pessoais de usuários,
                clientes ou visitantes.
              </p>

              <p className="mt-3">
                Dados também poderão ser compartilhados quando necessário para cumprimento de obrigação legal, ordem de
                autoridade competente, exercício regular de direitos, investigação de fraude ou proteção da segurança da
                plataforma e de seus usuários.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">13. Transferências internacionais</h2>

              <p className="mt-3">
                Alguns prestadores de tecnologia podem armazenar ou processar dados fora do Brasil ou utilizar
                infraestrutura distribuída internacionalmente.
              </p>

              <p className="mt-3">
                Quando houver transferência internacional de dados pessoais, o Bom Trato buscará observar os requisitos,
                mecanismos e garantias previstos na legislação brasileira aplicável.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">14. Cookies e tecnologias semelhantes</h2>

              <p className="mt-3">
                O Bom Trato pode utilizar cookies ou tecnologias equivalentes estritamente necessários para
                autenticação, segurança, manutenção da sessão, preferências e funcionamento do serviço.
              </p>

              <p className="mt-3">
                Caso sejam utilizados cookies ou tecnologias não essenciais para análise, publicidade, personalização ou
                rastreamento, serão fornecidas informações e mecanismos de escolha adequados quando exigidos pela
                legislação aplicável.
              </p>

              <p className="mt-3">
                O Usuário também poderá utilizar configurações do próprio navegador para controlar determinadas
                categorias de cookies, observando que a desativação de tecnologias essenciais poderá impedir o
                funcionamento adequado de partes da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">15. Retenção e eliminação</h2>

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

              <p className="mt-3">
                Quando não existir fundamento legítimo para conservação, os dados poderão ser eliminados, anonimizados
                ou tornados inacessíveis de acordo com os procedimentos técnicos aplicáveis.
              </p>

              <p className="mt-3">
                Cópias residuais poderão permanecer temporariamente em backups e mecanismos de recuperação até sua
                substituição ou expiração de acordo com os ciclos técnicos de retenção adotados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">16. Segurança</h2>

              <p className="mt-3">
                O Bom Trato adota medidas técnicas e organizacionais destinadas a reduzir riscos de acesso não
                autorizado, alteração, perda, destruição ou divulgação indevida de informações.
              </p>

              <p className="mt-3">
                Essas medidas podem incluir controles de acesso, autenticação, proteção de credenciais, registros de
                eventos, mecanismos de segurança da infraestrutura, backups e limitação de permissões de acordo com a
                necessidade de acesso.
              </p>

              <p className="mt-3">
                Nenhum sistema é totalmente imune a incidentes. Quando aplicável, incidentes relevantes serão tratados
                de acordo com os procedimentos e obrigações previstos na legislação.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">17. Direitos dos titulares</h2>

              <p className="mt-3">
                Nos casos previstos pela legislação, o titular poderá solicitar confirmação da existência de tratamento,
                acesso, correção, informações sobre compartilhamento, anonimização, bloqueio ou eliminação de dados
                inadequados, desnecessários ou excessivos, portabilidade quando regulamentada e aplicável, eliminação de
                dados tratados com consentimento quando cabível, revogação de consentimento e oposição a determinados
                tratamentos.
              </p>

              <p className="mt-3">
                O exercício de determinado direito poderá estar sujeito às condições, exceções e procedimentos previstos
                na legislação aplicável.
              </p>

              <p className="mt-3">
                A solicitação poderá exigir confirmação da identidade do requerente para evitar divulgação, exclusão ou
                alteração indevida de informações pertencentes a terceiros.
              </p>

              <p className="mt-3">
                Quando os dados forem tratados pelo Bom Trato exclusivamente em nome de uma organização usuária, o
                titular poderá ser orientado a exercer determinados direitos diretamente perante essa organização, que
                atua como controladora dos dados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">18. Como exercer seus direitos</h2>

              <p className="mt-3">
                Solicitações relacionadas ao exercício de direitos de proteção de dados podem ser encaminhadas para{' '}
                {legalIdentity.privacyEmail}.
              </p>

              <p className="mt-3">
                Para proteger os dados pessoais envolvidos, o Bom Trato poderá solicitar informações adicionais
                razoavelmente necessárias para confirmar a identidade do titular ou de seu representante.
              </p>

              <p className="mt-3">
                As solicitações serão analisadas considerando a natureza do pedido, o papel desempenhado pelo Bom Trato
                no tratamento e os prazos previstos na legislação aplicável.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">19. Critérios automatizados</h2>

              <p className="mt-3">
                Algumas funcionalidades podem utilizar critérios automatizados para organizar informações, como
                ordenação de perfis públicos por indicadores de reputação ou mecanismos destinados à segurança,
                prevenção de fraude e prevenção de abuso.
              </p>

              <p className="mt-3">
                Esses mecanismos não têm como finalidade produzir decisões jurídicas ou efeitos equivalentes relevantes
                sobre o titular.
              </p>

              <p className="mt-3">
                Caso o Bom Trato passe a realizar decisões exclusivamente automatizadas que afetem de forma relevante os
                interesses dos titulares, este Aviso poderá ser atualizado e os direitos previstos na legislação serão
                observados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">20. Crianças e adolescentes</h2>

              <p className="mt-3">
                O Bom Trato é uma ferramenta destinada à gestão profissional e empresarial e não é direcionado
                especificamente a crianças ou adolescentes.
              </p>

              <p className="mt-3">
                Usuários não devem inserir dados de crianças ou adolescentes sem necessidade, fundamento legal e
                observância das regras específicas aplicáveis ao tratamento desses dados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">21. Atualizações deste Aviso</h2>

              <p className="mt-3">
                Este Aviso poderá ser atualizado para refletir mudanças na plataforma, nos fornecedores utilizados, nas
                práticas de tratamento ou na legislação.
              </p>

              <p className="mt-3">
                A versão e a data de vigência serão apresentadas no início do documento. Quando uma alteração for
                material e exigir nova manifestação do Usuário, poderão ser adotados mecanismos adicionais de
                comunicação ou aceite.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">22. Contato sobre privacidade</h2>

              <p className="mt-3">
                Solicitações, dúvidas ou reclamações relacionadas à privacidade e à proteção de dados pessoais podem ser
                encaminhadas para {legalIdentity.privacyEmail}.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">23. Termos de Uso</h2>

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

            <a href={`mailto:${legalIdentity.supportEmail}`} className="hover:text-foreground">
              Suporte
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
