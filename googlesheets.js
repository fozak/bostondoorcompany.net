const SHEET_NAME = "Sheet1";

function doPost(e) {


  try {
    const data = JSON.parse(e.postData.contents);

// handle page save
    if (data.action === 'save_html') {
      const folder   = DriveApp.getFolderById('1y8_BF77GpjsbVA_pX3Q4h1KfJVNQigTy');
      const filename = data.filename || 'page.html';
      const existing = folder.getFilesByName(filename);
      while (existing.hasNext()) existing.next().setTrashed(true);
      folder.createFile(filename, data.html);
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'ok' }))
        .setMimeType(ContentService.MimeType.JSON);
    }



    const sheet = SpreadsheetApp.getActiveSpreadsheet()
                                .getSheetByName(SHEET_NAME);

    let driveUrl = "";
    if (data.photo && data.photo.length > 0) {
      const base64 = data.photo.split(',')[1];
      const blob   = Utilities.newBlob(
        Utilities.base64Decode(base64),
        'image/jpeg',
        data.photo_name || 'upload.jpg'
      );
      const folder = DriveApp.getFolderById('1y8_BF77GpjsbVA_pX3Q4h1KfJVNQigTy');
      const file   = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      driveUrl = file.getUrl();
    }

    sheet.appendRow([
      new Date(),
      data.name          || "",
      data.email         || "",
      data.phone         || "",
      data.customer_type || "",
      data.company       || "",
      data.service       || "",
      data.building_type || "",
      data.message       || "",
      driveUrl
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("Endpoint is live");
}