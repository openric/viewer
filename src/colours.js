/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const COLOURS = {
  RecordSet: '#4ecdc4',
  Record: '#45b7d1',
  RecordPart: '#96ceb4',
  Person: '#dc3545',
  CorporateBody: '#ffc107',
  Family: '#e83e8c',
  Production: '#6f42c1',
  Accumulation: '#5f27cd',
  Activity: '#6f42c1',
  Place: '#fd7e14',
  Thing: '#20c997',
  Concept: '#20c997',
  DocumentaryFormType: '#20c997',
  CarrierType: '#20c997',
  ContentType: '#20c997',
  RecordState: '#adb5bd',
  Language: '#0d6efd',
  Instantiation: '#17a2b8',
  Function: '#6c757d',
  Rule: '#8e44ad',
  default: '#6c757d',
};

export function getColour(type) {
  if (!type) return COLOURS.default;
  const local = String(type).split('#').pop().split('/').pop().split(':').pop();
  return COLOURS[local] || COLOURS.default;
}
