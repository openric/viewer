/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getColour, getEffectiveType, localName, COLOURS } from '../src/colours.js';

test('getColour unwraps curie prefix', () => {
  assert.equal(getColour('rico:RecordSet'), COLOURS.RecordSet);
});

test('getColour unwraps full IRI', () => {
  assert.equal(getColour('https://www.ica.org/standards/RiC/ontology#Person'), COLOURS.Person);
});

test('getColour falls back to default for unknown type', () => {
  assert.equal(getColour('rico:Unicorn'), COLOURS.default);
});

test('getColour handles missing type', () => {
  assert.equal(getColour(null), COLOURS.default);
  assert.equal(getColour(undefined), COLOURS.default);
});

// ---- localName ----------------------------------------------------------

test('localName strips CURIE prefix', () => {
  assert.equal(localName('rico:Person'), 'Person');
});

test('localName strips full IRI to local name', () => {
  assert.equal(localName('https://www.ica.org/standards/RiC/ontology#Person'), 'Person');
});

test('localName strips slash-segmented vocab IRI', () => {
  assert.equal(localName('https://openric.org/vocab/activity-type/production'), 'production');
});

test('localName passes bare local through', () => {
  assert.equal(localName('Person'), 'Person');
});

test('localName handles falsy', () => {
  assert.equal(localName(null), '');
  assert.equal(localName(''), '');
  assert.equal(localName(undefined), '');
});

// ---- getEffectiveType — dual-read across spec v0.37 boundary ------------

test('getEffectiveType: pre-v0.37 server emits rico:Production as type → "Production"', () => {
  // Pre-spec-v0.37 server: emits the now-deprecated concrete Activity subclass.
  const node = { type: 'rico:Production', label: 'Boat creation' };
  assert.equal(getEffectiveType(node), 'Production');
});

test('getEffectiveType: pre-v0.37 server emits rico:Accumulation', () => {
  const node = { type: 'rico:Accumulation', label: 'Collection-building' };
  assert.equal(getEffectiveType(node), 'Accumulation');
});

test('getEffectiveType: v0.37+ server emits rico:Activity + activityType slug → "Production"', () => {
  // Post-spec-v0.37 server: rico:Activity is the only concrete class; the kind
  // is carried in attributes (slug or full IRI).
  const node = {
    type: 'rico:Activity',
    label: 'Boat creation',
    attributes: { activityType: 'production' },
  };
  assert.equal(getEffectiveType(node), 'Production');
});

test('getEffectiveType: v0.37+ server emits rico:Activity + hasActivityType IRI → capitalised slug', () => {
  const node = {
    type: 'rico:Activity',
    label: 'Boat creation',
    attributes: { 'rico:hasActivityType': 'https://openric.org/vocab/activity-type/production' },
  };
  assert.equal(getEffectiveType(node), 'Production');
});

test('getEffectiveType: v0.37+ Activity with no hasActivityType falls back to "Activity"', () => {
  const node = { type: 'rico:Activity', label: 'Some event', attributes: {} };
  assert.equal(getEffectiveType(node), 'Activity');
});

test('getEffectiveType: non-Activity types pass straight through', () => {
  assert.equal(getEffectiveType({ type: 'rico:Person' }), 'Person');
  assert.equal(getEffectiveType({ type: 'rico:RecordSet' }), 'RecordSet');
  assert.equal(getEffectiveType({ type: 'openricx:Function' }), 'Function');
});

test('getEffectiveType: missing node / type returns "default"', () => {
  assert.equal(getEffectiveType(null), 'default');
  assert.equal(getEffectiveType({}), 'default');
  assert.equal(getEffectiveType({ type: '' }), 'default');
});

// ---- getColour with node argument (preferred — dual-read) ---------------

test('getColour(node) — pre-v0.37 Production node → Production colour', () => {
  const node = { type: 'rico:Production', label: 'Boat creation' };
  assert.equal(getColour(node), COLOURS.Production);
});

test('getColour(node) — v0.37+ Activity+production node → Production colour (matches old)', () => {
  const node = {
    type: 'rico:Activity',
    attributes: { activityType: 'production' },
  };
  assert.equal(getColour(node), COLOURS.Production);
});

test('getColour(node) — v0.37+ Activity+accumulation node → Accumulation colour', () => {
  const node = {
    type: 'rico:Activity',
    attributes: { 'rico:hasActivityType': 'https://openric.org/vocab/activity-type/accumulation' },
  };
  assert.equal(getColour(node), COLOURS.Accumulation);
});

test('getColour(node) — v0.37+ Activity+custody → Custody colour', () => {
  const node = {
    type: 'rico:Activity',
    attributes: { activityType: 'custody' },
  };
  assert.equal(getColour(node), COLOURS.Custody);
});

test('getColour(node) — generic Activity falls back to Activity colour', () => {
  const node = { type: 'rico:Activity' };
  assert.equal(getColour(node), COLOURS.Activity);
});

test('getColour(node) — Mechanism (canonical RiC-O 1.1 Agent subclass) has its own colour', () => {
  assert.equal(getColour({ type: 'rico:Mechanism' }), COLOURS.Mechanism);
});
