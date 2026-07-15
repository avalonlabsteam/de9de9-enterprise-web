import { z } from 'zod';

export const walletTxSchema = z.object({
  id: z.string(),
  type: z.enum(['recharge', 'deduction']),
  amountCredits: z.number(),
  label: z.string(),
  date: z.string(),
  invoiceId: z.string().optional(),
});

export const walletSchema = z.object({
  balanceCredits: z.number(),
  subscriptionActive: z.boolean(),
  history: walletTxSchema.array(),
});

export type WalletTx = z.infer<typeof walletTxSchema>;
export type Wallet = z.infer<typeof walletSchema>;
