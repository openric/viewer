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
  Mechanism: '#e74c3c',
  // Activity bucket — Production/Accumulation/etc. are pre-spec-v0.37
  // emissions (RiC-O 1.1 has no concrete subclasses; current servers
  // emit rico:Activity + rico:hasActivityType). Both colour entries kept
  // for backward compatibility; getEffectiveType() resolves a v0.37+
  // Activity to its slug for colouring.
  Production: '#6f42c1',
  Accumulation: '#5f27cd',
  Custody: '#7d5fff',
  Transfer: '#7d5fff',
  Publication: '#7d5fff',
  Reproduction: '#7d5fff',
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

/**
 * Return the local-name suffix of a type IRI / CURIE / bare name.
 *   "rico:Person"                                              -> "Person"
 *   "https://www.ica.org/standards/RiC/ontology#Person"        -> "Person"
 *   "Person"                                                   -> "Person"
 *   "https://openric.org/vocab/activity-type/production"        -> "production"
 */
export function localName(value) {
  if (!value) return '';
  return String(value).split('#').pop().split('/').pop().split(':').pop();
}

function capitalise(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Resolve a node's effective type for colouring / labelling. Dual-read
 * across spec v0.37 boundary:
 *   - pre-v0.37 servers emit "rico:Production" / "rico:Accumulation" as node.type
 *   - v0.37+ servers emit "rico:Activity" with the activity-type IRI carried
 *     in attributes (activityType slug or hasActivityType IRI)
 * Either shape resolves to the same local-name ("Production", etc.) so the
 * COLOURS table works without further dispatch.
 *
 * @param {Object} node Node primitive from the server's Subgraph response.
 * @returns {string}    Effective local-name type (e.g. "Person", "Production", "Activity").
 */
export function getEffectiveType(node) {
  if (!node || !node.type) return 'default';
  const t = localName(node.type);
  if (t !== 'Activity') return t;

  const attrs = node.attributes || {};
  const candidate =
    attrs.activityType ||
    attrs['rico:hasActivityType'] ||
    attrs.hasActivityType;
  if (!candidate) return 'Activity';
  return capitalise(localName(candidate)) || 'Activity';
}

/**
 * Look up a colour by node type. Accepts either a node object (preferred —
 * dispatches via getEffectiveType for spec v0.37+ Activity dual-read) or
 * a bare type string (back-compat for callers that only have the type).
 */
export function getColour(typeOrNode) {
  if (typeOrNode && typeof typeOrNode === 'object' && 'type' in typeOrNode) {
    return COLOURS[getEffectiveType(typeOrNode)] || COLOURS.default;
  }
  if (!typeOrNode) return COLOURS.default;
  return COLOURS[localName(typeOrNode)] || COLOURS.default;
}
