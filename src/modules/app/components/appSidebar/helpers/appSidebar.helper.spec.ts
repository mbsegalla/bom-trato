import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { appNavigation, getOrganizationRoleLabel, getUserInitials } from './appSidebar.helper';

describe('application sidebar helpers', () => {
  it('uses distinct internal paths for navigation and exposes operational modules', () => {
    const paths = appNavigation.map((item) => item.href);

    assert.equal(new Set(paths).size, paths.length);
    assert.ok(paths.every((path) => path.startsWith('/') && !path.startsWith('//')));
    assert.ok(paths.includes('/customers'));
    assert.ok(paths.includes('/recurring-services'));
    assert.ok(paths.includes('/receivables'));
  });

  it('distinguishes organization owners and members', () => {
    assert.equal(getOrganizationRoleLabel('OWNER'), 'Administrador');
    assert.equal(getOrganizationRoleLabel('MEMBER'), 'Membro');
  });

  it('normalizes initials without depending on extra spaces or a second name', () => {
    assert.equal(getUserInitials('  maria   silva  '), 'MS');
    assert.equal(getUserInitials('áurea'), 'Á');
    assert.equal(getUserInitials(''), '');
    assert.equal(getUserInitials('João da Silva'), 'JD');
  });
});
