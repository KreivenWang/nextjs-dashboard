"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import { z } from "zod";
import logger from "@/app/lib/logger";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const invoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    required_error: "Please select a customer",
    invalid_type_error: "Please select a customer",
  }),
  amount: z.coerce.number().gt(0, "Please enter an amount greater than $0"),
  status: z.enum(["pending", "paid"], {
    required_error: "Please select a invoice status",
    invalid_type_error: "Please select a invoice status",
  }),
  date: z.string(),
});

const CreateInvoiceSchema = invoiceSchema.omit({ id: true, date: true });
const UpdateInvoiceSchema = invoiceSchema.omit({ id: true, date: true });

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export interface ToastState {
  successToast?: string;
  errorToast?: string;
}

export interface State extends ToastState {
  fieldErrors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
}

export async function createInvoice(
  prevState: State,
  formData: FormData
): Promise<State> {
  try {
    const rawFormData = Object.fromEntries(formData.entries());
    const parsed = CreateInvoiceSchema.safeParse(rawFormData);
    if (!parsed.success) {
      logger.info(
        "createInvoice: Invalid form data:",
        parsed.error.flatten().fieldErrors
      );
      return {
        fieldErrors: parsed.error.flatten().fieldErrors,
        errorToast: "Please check marked errors. Failed to Create Invoice.",
      };
    }
    const { customerId, amount, status } = parsed.data;
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
    return {
      errorToast: "Database Error: Failed to Create Invoice",
    };
  }

  revalidatePath("/dashboard/invoices");
  redirect(`/dashboard/invoices`);
}

export async function updateInvoice(
  invoiceId: string,
  prevState: State,
  formData: FormData
): Promise<State> {
  try {
    const rawFormData = Object.fromEntries(formData.entries());
    const parsed = UpdateInvoiceSchema.safeParse(rawFormData);
    if (!parsed.success) {
      logger.info(
        "updateInvoice: Invalid form data:",
        parsed.error.flatten().fieldErrors
      );
      return {
        fieldErrors: parsed.error.flatten().fieldErrors,
        errorToast: "Please check marked errors. Failed to Update Invoice.",
      };
    }
    const { customerId, amount, status } = parsed.data;
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
    return {
      errorToast: "Database Error: Failed to Update Invoice",
    };
  }
  revalidatePath("/dashboard/invoices");
  redirect(`/dashboard/invoices`);
}

export async function deleteInvoice(
  invoiceId: string,
  prevState: State,
  formData: FormData
): Promise<State> {
  try {
    await sql`
    DELETE FROM invoices
    WHERE id = ${invoiceId}
  `;
  } catch (error) {
    logger.error("Error deleting invoice:", error);
    return {
      errorToast: "Database Error: Failed to Delete Invoice",
    };
  }

  revalidatePath("/dashboard/invoices");
  return { successToast: "Invoice deleted successfully" };
}

export async function authenticate(
  prevState: ToastState,
  formData: FormData
): Promise<ToastState> {
  try {
    const email = formData.get("email");
    const password = formData.get("password");
    const redirectTo = formData.get("redirectTo") as string || "/dashboard";
    logger.info("redirectTo test reference:", redirectTo);
    if (!email || !password) {
      return {
        errorToast: "Please enter email and password",
      } satisfies ToastState;
    }

    const signInResult = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false, // avoid NEXT_REDIRECT error
    });

    if (signInResult?.error) {
      return {
        errorToast: "Invalid credentials. Please try again.",
      } satisfies ToastState;
    }
  } catch (error) {
    logger.error("Error authenticating user:", error);
    if (error instanceof AuthError) {
      switch (error.type) {
        /**
         * If there's a 'CredentialsSignin' error,
         * you want to show an appropriate error message.
         * You can learn about NextAuth.js errors in
         * https://authjs.dev/reference/core/errors#credentialssignin
         */
        case "CredentialsSignin":
          return {
            errorToast: "Invalid credentials. Please try again.",
          } satisfies ToastState;
        default:
          return {
            errorToast:
              "Something went wrong. Please try again. " + error.message,
          } satisfies ToastState;
      }
    }
    return {
      errorToast: "Database Error: Failed to Authenticate User",
    };
  }

  redirect("/dashboard");
}
