/**
 * Google Apps Script for Enumerator Data Manager
 * 
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Copy this code into the editor.
 * 4. Create sheets named "Data" and "List" if they don't exist.
 * 5. Deploy as Web App (Execute as: Me, Access: Anyone).
 * 6. Copy the Web App URL and paste it into SheetService.ts in the React app.
 */

const DATA_SHEET = "Data";
const LIST_SHEET = "List";

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === "getEnumerator") {
    return handleGetEnumerator(e.parameter.username);
  } else if (action === "getRecords") {
    return handleGetRecords(e.parameter.name, e.parameter.hlb);
  }
  
  return createResponse({ error: "Invalid action" });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  if (action === "saveRecords") {
    return handleSaveRecords(data.enumerator, data.records);
  }
  
  return createResponse({ error: "Invalid action" });
}

function handleGetEnumerator(username) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(LIST_SHEET);
  const data = sheet.getDataRange().getValues();
  
  // Header: USER NAME, प्रगणक का नाम, प्रगणक को आवंटित HLB
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().toLowerCase() === username.toLowerCase()) {
      return createResponse({
        username: data[i][0],
        name: data[i][1],
        hlb: data[i][2].toString()
      });
    }
  }
  
  return createResponse(null);
}

function handleGetRecords(name, hlb) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DATA_SHEET);
  const data = sheet.getDataRange().getValues();
  const results = [];
  
  // Header: प्रगणक का नाम, HLB, SE ID, भवन स्वामी का नाम, मोबाइल number
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === name && data[i][1].toString() === hlb.toString()) {
      results.push({
        seId: data[i][2],
        ownerName: data[i][3],
        mobileNumber: data[i][4]
      });
    }
  }
  
  return createResponse(results);
}

function handleSaveRecords(enumerator, records) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DATA_SHEET);
  const data = sheet.getDataRange().getValues();
  
  // 1. Remove existing records for this enumerator
  // We go backwards to delete rows without upsetting indices
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === enumerator.name && data[i][1].toString() === enumerator.hlb.toString()) {
      sheet.deleteRow(i + 1);
    }
  }
  
  // 2. Add new records
  records.forEach(row => {
    if (row.seId || row.ownerName || row.mobileNumber) {
      sheet.appendRow([
        enumerator.name,
        enumerator.hlb,
        row.seId || "",
        row.ownerName || "",
        row.mobileNumber || ""
      ]);
    }
  });
  
  return createResponse({ success: true });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
