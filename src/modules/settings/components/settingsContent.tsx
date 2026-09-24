import { TeamSettings } from './teamSettings';

export function SettingsContent() {
  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Configurações</h1>

        <p className="mt-2 text-muted-foreground">Gerencie o acesso e as configurações do seu negócio.</p>
      </div>

      <div className="mt-8">
        <TeamSettings />
      </div>
    </div>
  );
}
