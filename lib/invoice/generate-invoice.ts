import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generateInvoice(order: any) {
  const pdf = await PDFDocument.create();

  const page = pdf.addPage([595, 842]); // A4

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 800;

  page.drawText("SWAS", {
    x: 50,
    y,
    size: 28,
    font: bold,
    color: rgb(0.54, 0.1, 0.1),
  });

  y -= 40;

  page.drawText(`Invoice: ${order.invoice.invoiceNumber}`, {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 20;

  page.drawText(`Order: ${order.orderNumber}`, {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 20;

  page.drawText(`Date: ${new Date(order.createdAt).toLocaleString("en-IN")}`, {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 40;

  page.drawText("Bill To", {
    x: 50,
    y,
    size: 16,
    font: bold,
  });

  y -= 24;

  page.drawText(order.customer.name, {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 18;

  page.drawText(order.customer.email, {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 18;

  page.drawText(order.customer.phone || "-", {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 18;

  page.drawText(
    `${order.shippingAddress.addressLine1}, ${order.shippingAddress.addressLine2}`,
    { x: 50, y, size: 12, font }
  );

  y -= 18;

  page.drawText(
    `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
    { x: 50, y, size: 12, font }
  );

  y -= 40;

  page.drawText("Items", {
    x: 50,
    y,
    size: 16,
    font: bold,
  });

  y -= 24;

  order.items.forEach((item: any) => {
    page.drawText(`${item.name} × ${item.quantity}    Rs. ${item.price}`, {
      x: 50,
      y,
      size: 12,
      font,
    });

    y -= 18;
  });

  y -= 20;

  page.drawText(`Subtotal: Rs. ${order.pricing.subtotal}`, {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 18;

  page.drawText(`Shipping: Rs. ${order.pricing.shipping}`, {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 24;

  page.drawText(`Total: Rs. ${order.pricing.total}`, {
    x: 50,
    y,
    size: 18,
    font: bold,
    color: rgb(0.54, 0.1, 0.1),
  });

  return await pdf.save();
}
