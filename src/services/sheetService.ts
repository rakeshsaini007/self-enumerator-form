/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enumerator, BuildingRecord } from "../types";

/**
 * Service to handle Google Sheets interactions via Google Apps Script Web App.
 * 
 * IMPORTANT: Replace WEB_APP_URL with your deployed GAS URL.
 */
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx7dzIo0m5b1uItI-TVFUdCJJBm5dXslkxdNbwyCtY1iUcLVPwtfDhmndWZFWdNmufYVA/exec";

export class SheetService {
  /**
   * Finds an enumerator by username from the "List" sheet.
   */
  static async getEnumeratorByUsername(username: string): Promise<Enumerator | null> {
    if (WEB_APP_URL.includes("YOUR_")) {
      console.warn("Google Apps Script URL not configured. Using mock data.");
      return this.mockGetEnumerator(username);
    }

    try {
      const response = await fetch(`${WEB_APP_URL}?action=getEnumerator&username=${encodeURIComponent(username)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching enumerator:", error);
      throw error;
    }
  }

  /**
   * Fetches data from the "Data" sheet for a specific enumerator.
   */
  static async getRecordsForEnumerator(enumerator: Enumerator): Promise<BuildingRecord[]> {
    let filtered: BuildingRecord[] = [];

    if (WEB_APP_URL.includes("YOUR_")) {
      filtered = await this.mockGetRecords(enumerator);
    } else {
      try {
        const response = await fetch(
          `${WEB_APP_URL}?action=getRecords&name=${encodeURIComponent(enumerator.name)}&hlb=${encodeURIComponent(enumerator.hlb)}`
        );
        filtered = await response.json();
      } catch (error) {
        console.error("Error fetching records:", error);
        throw error;
      }
    }

    // Ensure we always have at least 10 rows
    const result = [...filtered];
    while (result.length < 10) {
      result.push({ seId: "", ownerName: "", mobileNumber: "" });
    }
    
    return result.slice(0, 10);
  }

  /**
   * Saves records back to the "Data" sheet.
   */
  static async saveRecords(enumerator: Enumerator, records: BuildingRecord[]): Promise<void> {
    if (WEB_APP_URL.includes("YOUR_")) {
      return this.mockSaveRecords(enumerator, records);
    }

    try {
      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors", // GAS POST requiring no-cors often, or use a redirect handling if needed
        body: JSON.stringify({
          action: "saveRecords",
          enumerator,
          records
        })
      });
      // Note: with no-cors, we can't read the response, but the write happens.
      // If CORS is handled in GAS, we can use standard fetch.
    } catch (error) {
      console.error("Error saving records:", error);
      throw error;
    }
  }

  // --- Mock Fallbacks for development ---

  private static mockGetEnumerator(username: string): Enumerator | null {
    const MOCK_LIST = [
      { username: "ev_1007001_rksaini", name: "RAKESH SAINI", hlb: "50" },
    ];
    return MOCK_LIST.find(u => u.username === username) || null;
  }

  private static async mockGetRecords(enumerator: Enumerator): Promise<BuildingRecord[]> {
    const stored = localStorage.getItem("mock_data_sheet");
    const all: BuildingRecord[] = stored ? JSON.parse(stored) : [];
    return all.filter(r => r.enumeratorName === enumerator.name && r.hlb === enumerator.hlb);
  }

  private static async mockSaveRecords(enumerator: Enumerator, records: BuildingRecord[]): Promise<void> {
    const stored = localStorage.getItem("mock_data_sheet");
    let all: BuildingRecord[] = stored ? JSON.parse(stored) : [];
    all = all.filter(r => !(r.enumeratorName === enumerator.name && r.hlb === enumerator.hlb));
    const toSave = records.filter(r => r.seId || r.ownerName || r.mobileNumber).map(r => ({
      ...r,
      enumeratorName: enumerator.name,
      hlb: enumerator.hlb
    }));
    all.push(...toSave);
    localStorage.setItem("mock_data_sheet", JSON.stringify(all));
  }
}

