import type { ApiProblem } from '@/api/problem';

type L = (fr: string, ar: string) => string;

/**
 * Why a prestataire screen could not load. The API's French `detail` when it
 * gives one (`company_not_prestataire`, a bad tab…); a 403 means the session is
 * on the client side of a company holding both.
 */
export function proLoadError(problem: ApiProblem, L: L): string {
  if (problem.status === 403) {
    return L(
      'Cet écran est réservé à l’espace prestataire : changez d’espace pour le voir.',
      'هذه الشاشة خاصة بمساحة مقدّم الخدمة: غيّر المساحة لعرضها.',
    );
  }
  if (problem.detail) return problem.detail;
  if (problem.code === 'network') return L('Connexion impossible. Réessayez.', 'تعذّر الاتصال. أعد المحاولة.');
  return L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.');
}
