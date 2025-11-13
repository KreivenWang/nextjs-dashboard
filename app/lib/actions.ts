"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import { z } from "zod";

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

export async function createInvoice(formData: FormData) {
  /**
   * rawFormData example:
   * {
        customerId: '13d07535-c59e-4157-a011-f8d2ef4e0cbb',
        amount: '123',
        status: 'pending'
      }
   */

  const rawFormData = Object.fromEntries(formData.entries());
  const parsed = CreateInvoiceSchema.parse(rawFormData);
  const { customerId, amount, status } = parsed;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0]; // 2025-11-13
  console.log(
    `createInvoice: amountInCents ${amountInCents}, date ${date}, customerId ${customerId}, status ${status}`
  );

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(invoiceId: string, formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());
  const parsed = UpdateInvoiceSchema.parse(rawFormData);
  const { customerId, amount, status } = parsed;
  const amountInCents = amount * 100;
  console.log(
    `updateInvoice: amountInCents ${amountInCents}, customerId ${customerId}, status ${status}`
  );

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${invoiceId}
  `;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(invoiceId: string) {
  await sql`
    DELETE FROM invoices
    WHERE id = ${invoiceId}
  `;

  revalidatePath("/dashboard/invoices");
}
