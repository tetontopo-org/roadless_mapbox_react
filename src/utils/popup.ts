export function buildPopupHTML(name: string, uid: string | null, acresTxt: string) {
  return `
    <div style="font:600 14px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">${name}</div>
    ${uid ? `<div style="font:12px/1.4 system-ui;color:#555">ID: ${uid}</div>` : ''}
    <div style="margin-top:6px;font:12px/1.4 system-ui;color:#333">
      <div><b>Acres:</b> ${acresTxt}</div>
    </div>
  `
}