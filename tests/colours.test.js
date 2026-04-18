/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getColour, COLOURS } from '../src/colours.js';

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
