"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import { z } from "zod";
import logger from "@/app/lib/logger";

const invoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number().positive(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoiceSchema = invoiceSchema.omit({ id: true, date: true });
const UpdateInvoiceSchema = invoiceSchema.omit({ id: true, date: true });

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function createInvoice(prevState: any, formData: FormData) {
  const initialState = { message: null, error: '' };
  try {
    const rawFormData = Object.fromEntries(formData.entries());
    const parsed = CreateInvoiceSchema.parse(rawFormData);
    const { customerId, amount, status } = parsed;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split("T")[0]; // 2025-11-13
    logger.info(
      `createInvoice: amountInCents ${amountInCents}, date ${date}, customerId ${customerId}, status ${status}`
    );

    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    logger.error("Error creating invoice:", error);
    return { ...initialState, error: "Database Error: Failed to Create Invoice" };
  }

  revalidatePath("/dashboard/invoices");
  // 移除重定向，返回成功状态
  return { message: "Invoice created successfully", error: "" };
}

export async function updateInvoice(invoiceId: string, formData: FormData) {
  try {
    const rawFormData = Object.fromEntries(formData.entries());
    const parsed = UpdateInvoiceSchema.parse(rawFormData);
    const { customerId, amount, status } = parsed;
    const amountInCents = amount * 100;
    logger.info(
      `updateInvoice: amountInCents ${amountInCents}, customerId ${customerId}, status ${status}`
    );

    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${invoiceId}
  `;
  } catch (error) {
    logger.error("Error updating invoice:", error);
    return { error: "Database Error: Failed to Update Invoice" };
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(invoiceId: string) {
  try {
    await sql`
    DELETE FROM invoices
    WHERE id = ${invoiceId}
  `;
  } catch (error) {
    logger.error("Error deleting invoice:", error);
    return { error: "Database Error: Failed to Delete Invoice" };
  }

  revalidatePath("/dashboard/invoices");
}
