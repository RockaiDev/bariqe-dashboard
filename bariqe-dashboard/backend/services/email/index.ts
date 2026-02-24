import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ✅ قالب احترافي للبريد الإلكتروني
const getEmailTemplate = (order: any) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: "#FEF3C7", text: "#92400E" },
      confirmed: { bg: "#DBEAFE", text: "#1E40AF" },
      processing: { bg: "#E0E7FF", text: "#3730A3" },
      shipped: { bg: "#DBEAFE", text: "#075985" },
      delivered: { bg: "#D1FAE5", text: "#065F46" },
      cancelled: { bg: "#FEE2E2", text: "#991B1B" },
    };

    const statusColor = colors[status.toLowerCase()] || colors.pending;

    return `
      <span style="
        display: inline-block;
        padding: 6px 16px;
        background-color: ${statusColor.bg};
        color: ${statusColor.text};
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        text-transform: capitalize;
      ">
        ${status}
      </span>
    `;
  };

  // ✅ حساب المجاميع
  let subtotalBeforeDiscounts = 0;
  let totalItemDiscounts = 0;
  let totalAfterItemDiscounts = 0;

  order.products?.forEach((product: any) => {
    subtotalBeforeDiscounts += product.subtotal || 0;
    totalItemDiscounts +=
      (product.subtotal || 0) - (product.afterItemDiscount || 0);
    totalAfterItemDiscounts += product.afterItemDiscount || 0;
  });

  const orderDiscountAmount =
    totalAfterItemDiscounts - (order.totalAmount || 0);
  const hasDiscounts = totalItemDiscounts > 0 || orderDiscountAmount > 0;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order Notification</title>
    </head>
    <body style="
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f3f4f6;
    ">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="600" cellpadding="0" cellspacing="0" style="
              background-color: #ffffff;
              border-radius: 16px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            ">
              
              <!-- Header -->
              <tr>
                <td style="
                  background: linear-gradient(135deg, #021031 0%, #1e3a8a 100%);
                  padding: 40px 30px;
                  text-align: center;
                ">
                  <h1 style="
                    margin: 0;
                    color: #ffffff;
                    font-size: 28px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                  ">
                    🎉 New Order Received!
                  </h1>
                  <p style="
                    margin: 10px 0 0 0;
                    color: #e0e7ff;
                    font-size: 15px;
                  ">
                    You have a new order that requires your attention
                  </p>
                </td>
              </tr>

              <!-- Order Info Section -->
              <tr>
                <td style="padding: 30px;">
                  
                  <!-- Order ID & Status -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                    <tr>
                      <td style="
                        background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
                        border-radius: 12px;
                        padding: 20px;
                        border-left: 4px solid #3b82f6;
                      ">
                        <table width="100%">
                          <tr>
                            <td>
                              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                Order ID
                              </p>
                              <p style="margin: 0; font-size: 18px; color: #1f2937; font-weight: 700; font-family: 'Courier New', monospace;">
                                #${String(order._id || "")
      .slice(-8)
      .toUpperCase() || "N/A"
    }
                              </p>
                            </td>
                            <td align="right">
                              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                Status
                              </p>
                              ${getStatusBadge(order.status || "pending")}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Customer & Order Details -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                    <tr>
                      <td style="
                        background-color: #f9fafb;
                        border-radius: 12px;
                        padding: 20px;
                        border: 1px solid #e5e7eb;
                      ">
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td width="40%" style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">
                                👤 Customer
                              </span>
                            </td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                              <span style="color: #1f2937; font-size: 14px; font-weight: 600;">
                                ${order.customer?.name || "N/A"}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">
                                📧 Email
                              </span>
                            </td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                              <span style="color: #1f2937; font-size: 14px; font-weight: 600;">
                                ${order.customer?.email || "N/A"}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">
                                📱 Phone
                              </span>
                            </td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                              <span style="color: #1f2937; font-size: 14px; font-weight: 600;">
                                ${order.customer?.phone || "N/A"}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">
                                📍 Address
                              </span>
                            </td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                              <span style="color: #1f2937; font-size: 14px; font-weight: 600;">
                                ${order.customer?.address || "N/A"}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">
                                📅 Order Date
                              </span>
                            </td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                              <span style="color: #1f2937; font-size: 14px; font-weight: 600;">
                                ${formatDate(
      order.createdAt || new Date().toString()
    )}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0;">
                              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">
                                💰 Total Amount
                              </span>
                            </td>
                            <td style="padding: 10px 0; text-align: right;">
                              <span style="color: #059669; font-size: 18px; font-weight: 700;">
                                ${typeof order.totalAmount === "number"
      ? order.totalAmount.toFixed(2)
      : order.totalAmount
        ? String(order.totalAmount)
        : "0.00"
    } SAR
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Products Section -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                    <tr>
                      <td>
                        <h3 style="
                          margin: 0 0 15px 0;
                          color: #1f2937;
                          font-size: 18px;
                          font-weight: 700;
                        ">
                          📦 Order Items
                        </h3>
                      </td>
                    </tr>
                    <tr>
                      <td style="
                        background-color: #ffffff;
                        border-radius: 12px;
                        border: 1px solid #e5e7eb;
                        overflow: hidden;
                      ">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <!-- Table Header -->
                          <tr style="background-color: #f9fafb;">
                            <th style="
                              padding: 12px 15px;
                              text-align: left;
                              font-size: 11px;
                              font-weight: 700;
                              color: #6b7280;
                              text-transform: uppercase;
                              letter-spacing: 0.5px;
                              border-bottom: 2px solid #e5e7eb;
                            ">
                              Product
                            </th>
                            <th style="
                              padding: 12px 10px;
                              text-align: center;
                              font-size: 11px;
                              font-weight: 700;
                              color: #6b7280;
                              text-transform: uppercase;
                              letter-spacing: 0.5px;
                              border-bottom: 2px solid #e5e7eb;
                            ">
                              Qty
                            </th>
                            <th style="
                              padding: 12px 10px;
                              text-align: right;
                              font-size: 11px;
                              font-weight: 700;
                              color: #6b7280;
                              text-transform: uppercase;
                              letter-spacing: 0.5px;
                              border-bottom: 2px solid #e5e7eb;
                            ">
                              Price
                            </th>
                            <th style="
                              padding: 12px 10px;
                              text-align: center;
                              font-size: 11px;
                              font-weight: 700;
                              color: #6b7280;
                              text-transform: uppercase;
                              letter-spacing: 0.5px;
                              border-bottom: 2px solid #e5e7eb;
                            ">
                              Discount
                            </th>
                            <th style="
                              padding: 12px 15px;
                              text-align: right;
                              font-size: 11px;
                              font-weight: 700;
                              color: #6b7280;
                              text-transform: uppercase;
                              letter-spacing: 0.5px;
                              border-bottom: 2px solid #e5e7eb;
                            ">
                              Total
                            </th>
                          </tr>
                          <!-- Products -->
                          ${order.products
      ?.map((product: any, index: number) => {
        const hasItemDiscount =
          (product.itemDiscount || 0) > 0;
        return `
                            <tr style="border-bottom: 1px solid #f3f4f6;">
                              <td style="padding: 15px; color: #1f2937; font-size: 13px; font-weight: 500;">
                                ${product.product?.name || "N/A"}
                              </td>
                              <td style="padding: 15px; text-align: center;">
                                <span style="
                                  display: inline-block;
                                  padding: 4px 12px;
                                  background-color: #eff6ff;
                                  color: #1e40af;
                                  border-radius: 20px;
                                  font-size: 13px;
                                  font-weight: 600;
                                ">
                                  ${product.quantity || 0}
                                </span>
                              </td>
                              <td style="padding: 15px; text-align: right; color: #1f2937; font-weight: 500; font-size: 13px;">
                                ${(product.price || 0).toFixed(2)}
                                ${hasItemDiscount
            ? `<br/><span style="color: #9ca3af; font-size: 11px; text-decoration: line-through;">${(
              product.subtotal || 0
            ).toFixed(2)}</span>`
            : ""
          }
                              </td>
                              <td style="padding: 15px; text-align: center;">
                                ${hasItemDiscount
            ? `
                                  <span style="
                                    display: inline-block;
                                    padding: 3px 10px;
                                    background-color: #fef3c7;
                                    color: #92400e;
                                    border-radius: 12px;
                                    font-size: 11px;
                                    font-weight: 600;
                                  ">
                                    -${product.itemDiscount}%
                                  </span>
                                `
            : `<span style="color: #9ca3af; font-size: 12px;">—</span>`
          }
                              </td>
                              <td style="padding: 15px; text-align: right;">
                                <div style="font-weight: 600; font-size: 14px; color: #059669;">
                                  ${(product.afterItemDiscount || 0).toFixed(
            2
          )} SAR
                                </div>
                                ${hasItemDiscount
            ? `
                                  <div style="font-size: 10px; color: #10b981; margin-top: 2px;">
                                    Saved ${(
              (product.subtotal || 0) -
              (product.afterItemDiscount || 0)
            ).toFixed(2)} SAR
                                  </div>
                                `
            : ""
          }
                              </td>
                            </tr>
                          `;
      })
      .join("")}
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Order Summary with Discounts -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                    <tr>
                      <td style="
                        background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                        border-radius: 12px;
                        padding: 20px;
                        border: 1px solid #e5e7eb;
                      ">
                        <table width="100%" cellpadding="6" cellspacing="0">
                          <!-- Subtotal -->
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                              Subtotal (before discounts):
                            </td>
                            <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 500;">
                              ${subtotalBeforeDiscounts.toFixed(2)} SAR
                            </td>
                          </tr>
                          
                          ${totalItemDiscounts > 0
      ? `
                          <!-- Item Discounts -->
                          <tr>
                            <td style="padding: 8px 0; color: #059669; font-size: 13px;">
                              <span style="display: flex; align-items: center; gap: 5px;">
                                🏷️ Item Discounts:
                              </span>
                            </td>
                            <td style="padding: 8px 0; text-align: right; color: #059669; font-size: 13px; font-weight: 600;">
                              -${totalItemDiscounts.toFixed(2)} SAR
                            </td>
                          </tr>
                          
                          <!-- After Item Discounts -->
                          <tr style="border-bottom: 1px dashed #d1d5db;">
                            <td style="padding: 8px 0 12px 0; color: #6b7280; font-size: 13px;">
                              Subtotal after item discounts:
                            </td>
                            <td style="padding: 8px 0 12px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 500;">
                              ${totalAfterItemDiscounts.toFixed(2)} SAR
                            </td>
                          </tr>
                          `
      : ""
    }
                          
                          ${orderDiscountAmount > 0
      ? `
                          <!-- Order Discount -->
                          <tr>
                            <td style="padding: 12px 0 8px 0; color: #059669; font-size: 13px;">
                              <span style="display: flex; align-items: center; gap: 5px;">
                                💰 Order Discount:
                              </span>
                            </td>
                            <td style="padding: 12px 0 8px 0; text-align: right; color: #059669; font-size: 13px; font-weight: 600;">
                              -${orderDiscountAmount.toFixed(2)} SAR
                            </td>
                          </tr>
                          `
      : ""
    }
                          
                          ${hasDiscounts
      ? `
                          <!-- Total Savings -->
                          <tr style="background-color: #d1fae5; border-radius: 8px;">
                            <td style="padding: 12px; color: #065f46; font-size: 14px; font-weight: 600;">
                              💚 Total Savings:
                            </td>
                            <td style="padding: 12px; text-align: right; color: #065f46; font-size: 16px; font-weight: 700;">
                              ${(
        totalItemDiscounts + orderDiscountAmount
      ).toFixed(2)} SAR
                            </td>
                          </tr>
                          
                          <tr style="height: 10px;"></tr>
                          `
      : ""
    }
                          
                          <!-- Final Total -->
                          <tr style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 8px; border: 2px solid #10b981;">
                            <td style="padding: 15px; color: #065f46; font-size: 16px; font-weight: 700;">
                              🎯 Final Total:
                            </td>
                            <td style="padding: 15px; text-align: right; color: #059669; font-size: 20px; font-weight: 700;">
                              ${(order.totalAmount || 0).toFixed(2)} SAR
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Notes Section -->
                  ${order.notes
      ? `
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                      <tr>
                        <td style="
                          background-color: #fef3c7;
                          border-left: 4px solid #f59e0b;
                          border-radius: 8px;
                          padding: 15px;
                        ">
                          <p style="margin: 0 0 5px 0; font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase;">
                            📝 Customer Notes
                          </p>
                          <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                            ${order.notes}
                          </p>
                        </td>
                      </tr>
                    </table>
                  `
      : ""
    }

                  <!-- Action Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                    <tr>
                      <td align="center">
                        <a href="${process.env.DASHBOARD_URL || "#"
    }/orders" style="
                          display: inline-block;
                          padding: 14px 40px;
                          background: linear-gradient(135deg, #021031 0%, #1e3a8a 100%);
                          color: #ffffff;
                          text-decoration: none;
                          border-radius: 8px;
                          font-weight: 600;
                          font-size: 15px;
                          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                          transition: all 0.3s ease;
                        ">
                          View Order Details →
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="
                  background-color: #f9fafb;
                  padding: 30px;
                  text-align: center;
                  border-top: 1px solid #e5e7eb;
                ">
                  <p style="
                    margin: 0 0 10px 0;
                    color: #6b7280;
                    font-size: 13px;
                    line-height: 1.6;
                  ">
                    This is an automated notification from your order management system.
                  </p>
                  <p style="
                    margin: 0;
                    color: #9ca3af;
                    font-size: 12px;
                  ">
                    © ${new Date().getFullYear()} <a 
                      href="https://www.rockaidev.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style="color: #3b82f6; text-decoration: none; font-weight: 500;"
                    >
                      Rockai Dev
                    </a>. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const sendNewOrderEmail = async (order: any) => {
  try {
    const totalSavings =
      order.products?.reduce((sum: number, p: any) => {
        return sum + ((p.subtotal || 0) - (p.finalAmount || 0));
      }, 0) || 0;

    const mailOptions = {
      from: {
        name: "Order Management System",
        address: process.env.EMAIL_USERNAME || "",
      },
      to: process.env.ADMIN_EMAIL , // Uses ADMIN_EMAIL env var
      subject: `🎉 New Order #${String(order._id || "")
        .slice(-8)
        .toUpperCase()} - ${typeof order.totalAmount === "number"
          ? order.totalAmount.toFixed(2)
          : order.totalAmount
            ? String(order.totalAmount)
            : "0.00"
        } SAR${totalSavings > 0 ? ` (Saved ${totalSavings.toFixed(2)} SAR)` : ""
        }`,
      html: getEmailTemplate(order),

      text: `
New Order Received

Order ID: ${order._id}
Customer: ${order.customer?.name || "N/A"}
Email: ${order.customer?.email || "N/A"}
Phone: ${order.customer?.phone || "N/A"}
Address: ${order.customer?.address || "N/A"}
Status: ${order.status}
Created At: ${order.createdAt}

Products:
${order.products
          ?.map(
            (product: any) =>
              `- ${product.product?.name || "N/A"}
   Quantity: ${product.quantity}
   Unit Price: ${product.price} SAR
   Subtotal: ${product.subtotal?.toFixed(2)} SAR
   ${product.itemDiscount > 0
                ? `Item Discount: -${product.itemDiscount}% (${(
                  (product.subtotal || 0) - (product.afterItemDiscount || 0)
                ).toFixed(2)} SAR)`
                : ""
              }
   After Discount: ${product.afterItemDiscount?.toFixed(2)} SAR
   Final Amount: ${product.finalAmount?.toFixed(2)} SAR`
          )
          .join("\n\n")}

Order Summary:
Subtotal: ${order.products
          ?.reduce((sum: number, p: any) => sum + (p.subtotal || 0), 0)
          .toFixed(2)} SAR
${totalSavings > 0 ? `Total Savings: -${totalSavings.toFixed(2)} SAR` : ""}
Final Total: ${order.totalAmount} SAR

Notes: ${order.notes || "No notes"}
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Order email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending order email:", error);
    throw error;
  }
};

// ==========================================
// NEW EMAIL TEMPLATES & FUNCTIONS
// ==========================================

export const sendShipmentNotification = async (email: string, order: any, tracking: any) => {
  const mailOptions = {
    from: { name: "Bariqe Logistics", address: process.env.EMAIL_USERNAME || "" },
    to: email,
    subject: `📦 Order #${String(order._id).slice(-8).toUpperCase()} Shipped!`,
    html: `
      <h2>Good news! Your order is on the way.</h2>
      <p>Order ID: #${String(order._id).slice(-8).toUpperCase()}</p>
      <p>Carrier: ${tracking.carrier}</p>
      <p>Tracking Number: <strong>${tracking.trackingNumber}</strong></p>
      <a href="https://www.jtexpress.me/track?no=${tracking.trackingNumber}">Track Shipment</a>
    `
  };
  return transporter.sendMail(mailOptions);
};

export const sendOrderConfirmation = async (email: string, order: any) => {
  // reusing existing template logic or simplified version for customer
  const mailOptions = {
    from: { name: "Bariqe Orders", address: process.env.EMAIL_USERNAME || "" },
    to: email,
    subject: `✅ Order Confirmation #${String(order._id).slice(-8).toUpperCase()}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>We have received your order and are processing it.</p>
      <p>Total: ${order.total} SAR</p>
    `
  };
  return transporter.sendMail(mailOptions);
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: { name: "Bariqe Team", address: process.env.EMAIL_USERNAME || "" },
    to: email,
    subject: `Welcome to Bariqe, ${name}!`,
    html: `
      <h1>Welcome on board! 🚀</h1>
      <p>Hi ${name},</p>
      <p>We are excited to have you with us. Enjoy shopping!</p>
    `
  };
  return transporter.sendMail(mailOptions);
};

export const sendOtpEmail = async (email: string, otp: string, name: string = "Customer") => {
  const mailOptions = {
    from: { name: "Bariqe Security", address: process.env.EMAIL_USERNAME || "" },
    to: email,
    subject: `🔐 Your Verification Code`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verification Code</h2>
        <p>Hi ${name},</p>
        <p>Your verification code is:</p>
        <h1 style="color: #2563eb; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

export const sendPasswordResetOtp = async (email: string, otp: string, name: string = "Customer") => {
  const mailOptions = {
    from: { name: "Bariqe Security", address: process.env.EMAIL_USERNAME || "" },
    to: email,
    subject: `🔐 Reset Your Password`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>You requested to reset your password. Use the code below:</p>
        <h1 style="color: #dc2626; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};