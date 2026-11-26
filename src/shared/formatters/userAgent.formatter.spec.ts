import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { describeUserAgent } from './userAgent.formatter';

describe('session device descriptions', () => {
  it('returns a neutral description when the user agent is missing or empty', () => {
    for (const value of [null, '']) {
      assert.deepEqual(describeUserAgent(value), {
        browser: 'Navegador desconhecido',
        operatingSystem: 'Dispositivo desconhecido',
        label: 'Dispositivo desconhecido',
        mobile: false,
      });
    }
  });

  it('prioritizes Edge and Opera over their shared Chrome markers', () => {
    assert.deepEqual(describeUserAgent('Mozilla Windows NT Chrome/123 Edg/123'), {
      browser: 'Microsoft Edge',
      operatingSystem: 'Windows',
      label: 'Microsoft Edge no Windows',
      mobile: false,
    });
    assert.equal(describeUserAgent('Mozilla Linux Chrome/123 OPR/123').browser, 'Opera');
    assert.equal(describeUserAgent('Opera Android').browser, 'Opera');
  });

  it('recognizes mobile browsers before desktop platform markers', () => {
    const agents = [
      ['Mozilla iPhone Mac OS X CriOS/123 Mobile Safari/123', 'Chrome', 'iPhone'],
      ['Mozilla iPad Mac OS X FxiOS/123 Mobile Safari/123', 'Firefox', 'iPad'],
      ['Mozilla Linux Android Chrome/123 Mobile Safari/123', 'Chrome', 'Android'],
    ];

    for (const [agent, browser, operatingSystem] of agents) {
      assert.deepEqual(describeUserAgent(agent), {
        browser,
        operatingSystem,
        label: browser + ' no ' + operatingSystem,
        mobile: true,
      });
    }
  });

  it('distinguishes desktop Safari, Firefox and unknown browser or device data', () => {
    assert.equal(describeUserAgent('Mozilla Macintosh Version/17 Safari/123').label, 'Safari no macOS');
    assert.equal(describeUserAgent('Mozilla Linux Firefox/123').label, 'Firefox no Linux');
    assert.equal(describeUserAgent('fixture').label, 'Navegador desconhecido no dispositivo desconhecido');
  });
});
