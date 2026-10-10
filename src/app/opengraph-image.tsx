import { ImageResponse } from 'next/og';

export const alt = 'Bom Trato — Gestão para prestadores de serviços';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#183f35',
        color: '#ffffff',
        padding: '80px',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 58,
            fontWeight: 700,
            letterSpacing: '-2px',
          }}
        >
          bom trato<span style={{ color: '#bed3c7' }}>.</span>
        </div>

        <div
          style={{
            width: 120,
            height: 6,
            marginTop: 36,
            borderRadius: 999,
            background: '#91d5b0',
          }}
        />

        <div
          style={{
            display: 'flex',
            marginTop: 48,
            maxWidth: 850,
            fontSize: 64,
            lineHeight: 1.12,
            fontWeight: 600,
            letterSpacing: '-2px',
          }}
        >
          Gestão simples para quem presta serviços.
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 32,
            fontSize: 26,
            color: '#bed3c7',
          }}
        >
          Clientes, orçamentos, serviços e recebimentos em um só lugar.
        </div>
      </div>
    </div>,
    size,
  );
}
