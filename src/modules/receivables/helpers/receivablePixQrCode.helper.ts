import qrcode from 'qrcode-generator';

export interface ReceivablePixQrCode {
  size: number;
  path: string;
}

export function createReceivablePixQrCode(payload: string): ReceivablePixQrCode {
  const qr = qrcode(0, 'M');

  qr.addData(payload, 'Byte');
  qr.make();

  const modules = qr.getModuleCount();
  const quietZone = 4;
  const path: string[] = [];

  for (let row = 0; row < modules; row++) {
    for (let column = 0; column < modules; column++) {
      if (qr.isDark(row, column)) {
        path.push(`M${column + quietZone} ${row + quietZone}h1v1h-1z`);
      }
    }
  }

  return { size: modules + quietZone * 2, path: path.join('') };
}
