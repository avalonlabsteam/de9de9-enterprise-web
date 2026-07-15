import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { walletSchema, type Wallet } from '../schemas/wallet';

async function fetchWallet(): Promise<Wallet> {
  const res = await apiClient.get('/wallet');
  return walletSchema.parse(res.data);
}

export function useWallet() {
  return useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });
}
