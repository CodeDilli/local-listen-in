# Admin email via Google Apps Script

FormSubmit activation links often show **"Not a valid link"**.  
Use **MailApp** in your existing Complaints Apps Script instead.

## 1. Open your script

1. Go to [script.google.com](https://script.google.com)
2. Open the project that powers your complaints API  
   (the same one behind `VITE_COMPLAINTS_API_URL` / the `/exec` URL)

## 2. Add this handler

Inside your `doPost(e)` (or equivalent), when `action === "notify_admin"`, run:

```javascript
function handleNotifyAdmin(data) {
  var to = data.to || "vetrisembakkam@gmail.com";
  var subject = data.subject || "New complaint — Vetri Sembakkam";
  var body = data.message || "";

  // Optional structured lines if message is empty
  if (!body) {
    body = [
      "NEW COMPLAINT — Vetri Sembakkam",
      "",
      "Tracking code: " + (data.reference || ""),
      "Problem: " + (data.problem || ""),
      "Area: " + (data.area || ""),
      "Filed by: " + (data.filed_by || ""),
      "Mobile: " + (data.mobile || ""),
      "Category: " + (data.category || ""),
    ].join("\n");
  }

  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: body,
  });

  return { success: true };
}
```

Example inside `doPost`:

```javascript
function doPost(e) {
  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "bad json" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var action = data.action;

  if (action === "notify_admin") {
    var result = handleNotifyAdmin(data);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ... your existing list / get / create / update actions ...
}
```

## 3. Deploy

1. **Deploy → Manage deployments → Edit → New version → Deploy**
2. Keep the same Web app URL (or update `VITE_COMPLAINTS_API_URL` on Vercel if it changes)
3. First run may ask permission to **Send email** — allow it for the Google account that owns the script

## 4. Test

File a complaint on https://local-listen-in.vercel.app/file  
You should get mail at **vetrisembakkam@gmail.com** with problem, area, name, and mobile.

---

The website already POSTs `action: "notify_admin"` when a complaint is filed.
