const UNLIMITED_USERS_THRESHOLD = 999;

export function hasUnlimitedUsers(maxUsers: number): boolean {
  return maxUsers > UNLIMITED_USERS_THRESHOLD;
}

export function formatUserUsage(memberCount: number, maxUsers: number): string {
  if (hasUnlimitedUsers(maxUsers)) {
    return memberCount === 1 ? '1 usuário na equipe' : `${memberCount.toLocaleString('pt-BR')} usuários na equipe`;
  }

  return `${memberCount.toLocaleString('pt-BR')} de ${maxUsers.toLocaleString('pt-BR')} usuários`;
}
