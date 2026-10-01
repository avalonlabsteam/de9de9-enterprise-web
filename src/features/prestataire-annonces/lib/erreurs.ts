import { toProblem, type ApiProblem } from '@/api/problem';

type L = (fr: string, ar: string) => string;

/**
 * What a refused annonce call says (guides 19a §14, 19b §16). The server's
 * French `detail` is printed as it is; the two refusals it words nowhere get
 * the guide's sentence.
 */
export function annonceErreur(error: unknown, L: L): { problem: ApiProblem; message: string; recharger: boolean } {
  const problem = toProblem(error);
  const recharger = problem.status === 409;
  let message: string;
  if (problem.code === 'concurrency_conflict') {
    message = L(
      'Cette annonce a été modifiée par un autre membre de votre équipe.',
      'تم تعديل هذا الإعلان من طرف عضو آخر في فريقك.',
    );
  } else if (problem.status === 429) {
    message = problem.detail ?? L("Trop de demandes de publication aujourd'hui. Réessayez demain.", 'طلبات نشر كثيرة اليوم. أعد المحاولة غدًا.');
  } else if (problem.code === 'network') {
    message = L('Connexion impossible. Réessayez.', 'تعذّر الاتصال. أعد المحاولة.');
  } else {
    message = problem.detail ?? L("L'action n'a pas pu aboutir. Réessayez.", 'تعذّر تنفيذ الإجراء. أعد المحاولة.');
  }
  return { problem, message, recharger };
}
