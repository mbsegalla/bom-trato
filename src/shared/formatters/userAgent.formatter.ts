export interface UserAgentDescription {
  browser: string;
  operatingSystem: string;
  label: string;
  mobile: boolean;
}

export function describeUserAgent(userAgent: string | null): UserAgentDescription {
  if (!userAgent) {
    return {
      browser: 'Navegador desconhecido',
      operatingSystem: 'Dispositivo desconhecido',
      label: 'Dispositivo desconhecido',
      mobile: false,
    };
  }

  const browser = detectBrowser(userAgent);
  const operatingSystem = detectOperatingSystem(userAgent);
  const mobile = isMobile(userAgent);

  return {
    browser,
    operatingSystem,
    label: `${browser} no ${operatingSystem}`,
    mobile,
  };
}

function detectBrowser(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) {
    return 'Microsoft Edge';
  }

  if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) {
    return 'Opera';
  }

  if (/Firefox\//i.test(userAgent) || /FxiOS\//i.test(userAgent)) {
    return 'Firefox';
  }

  if (/CriOS\//i.test(userAgent)) {
    return 'Chrome';
  }

  if (/Chrome\//i.test(userAgent)) {
    return 'Chrome';
  }

  if (/Safari\//i.test(userAgent) && /Version\//i.test(userAgent)) {
    return 'Safari';
  }

  return 'Navegador desconhecido';
}

function detectOperatingSystem(userAgent: string): string {
  if (/iPhone/i.test(userAgent)) {
    return 'iPhone';
  }

  if (/iPad/i.test(userAgent)) {
    return 'iPad';
  }

  if (/Android/i.test(userAgent)) {
    return 'Android';
  }

  if (/Windows NT/i.test(userAgent)) {
    return 'Windows';
  }

  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return 'macOS';
  }

  if (/Linux/i.test(userAgent)) {
    return 'Linux';
  }

  return 'dispositivo desconhecido';
}

function isMobile(userAgent: string): boolean {
  return /Android|iPhone|iPad|Mobile/i.test(userAgent);
}
