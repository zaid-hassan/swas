import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderEmails({
  order,
  invoicePdf,
}: {
  order: any;
  invoicePdf: Uint8Array;
}) {
  const attachment = {
    filename: `${order.invoice.invoiceNumber}.pdf`,
    content: Buffer.from(invoicePdf),
  };

  // Customer email
  await resend.emails.send({
    from: `SWAS <${process.env.FROM_EMAIL}>`,
    to: order.customer.email,
    subject: `Order Confirmed - ${order.orderNumber}`,
    html: `
      <h2>Thank you for shopping with SWAS!</h2>

      <p>Your order has been confirmed.</p>

      <p><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p><strong>Invoice:</strong> ${order.invoice.invoiceNumber}</p>
      <p><strong>Total:</strong> ₹${order.pricing.total}</p>

      <p>We've attached your invoice to this email.</p>
    `,
    attachments: [attachment],
  });

  // Owner email
  await resend.emails.send({
    from: `SWAS <${process.env.FROM_EMAIL}>`,
    to: process.env.OWNER_EMAIL!,
    subject: `New Order - ${order.orderNumber}`,
    html: `
      <h2>New SWAS Order</h2>

      <p><strong>Customer:</strong> ${order.customer.name}</p>
      <p><strong>Email:</strong> ${order.customer.email}</p>
      <p><strong>Phone:</strong> ${order.customer.phone}</p>

      <p><strong>Amount:</strong> ₹${order.pricing.total}</p>

      <p>Invoice attached.</p>
    `,
    attachments: [attachment],
  });
}