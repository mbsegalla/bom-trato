export function getPasswordRequirements(password: string) {
  const length = Array.from(password).length;

  return [
    {
      label: 'De 12 a 128 caracteres',
      isSatisfied: length >= 12 && length <= 128,
    },
    {
      label: 'Pelo menos uma letra maiúscula',
      isSatisfied: /\p{Lu}/u.test(password),
    },
    {
      label: 'Pelo menos um caractere especial, como !, @ ou #',
      isSatisfied: /[\p{P}\p{S}]/u.test(password),
    },
  ];
}

export function isPasswordValid(password: string): boolean {
  return getPasswordRequirements(password).every((requirement) => requirement.isSatisfied);
}
