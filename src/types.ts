/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Enumerator {
  username: string;
  name: string;
  hlb: string;
}

export interface BuildingRecord {
  seId: string;
  ownerName: string;
  mobileNumber: string;
  enumeratorName?: string;
  hlb?: string;
  id?: string; // Internal ID or row index
}

export interface SheetConfig {
  spreadsheetId: string;
  apiKey: string;
}
