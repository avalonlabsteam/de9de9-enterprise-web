import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authActions } from "@/stores/authStore";
import { toProblem } from "@/api/problem";
import { useLogin } from "../api/auth";
import { adoptSignIn } from "../api/session";
import { useSocialSignIn, type SocialProvider } from "../api/social";
import { GOOGLE_CLIENT_ID, renderGoogleButton } from "../lib/socialProviders";
import { routeForStep } from "@/features/onboarding/lib/registerFlow";
import { useT, useL } from "@/lib/i18n";
import { useLangStore } from "@/stores/langStore";
import { useThemeStore } from "@/stores/themeStore";
import { cn } from "@/lib/utils";
import {
  loginSchema,
  type LoginValues,
  type SignInResponse,
} from "../schemas/auth";

/**
 * Onboarding comes first: an unfinished step wins over the home. The session
 * opens on the side the API picked (the user's last active role).
 */
function routeAfterSignIn(session: SignInResponse): string {
  const role = session.accueil?.role ?? session.user.activeRole;
  const step = session.onboarding?.nextStep;
  // routeForStep falls back to KYC, so only hand it a real, unfinished step.
  if (step && step !== "termine") return routeForStep(step, role);
  return role === "prestataire" ? "/prestataire" : "/client";
}

export function LoginPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  /** Wrong credentials: not one field's fault, so shown above the button. */
  const [formError, setFormError] = useState<string | null>(null);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    getValues,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  // zod's own messages are English; an API `detail` (type "server") is shown as is.
  const emailError =
    errors.email &&
    (errors.email.type === "server"
      ? errors.email.message
      : L("Adresse e-mail invalide.", "بريد إلكتروني غير صالح."));
  const passwordError =
    errors.password &&
    (errors.password.type === "server"
      ? errors.password.message
      : L("Saisissez votre mot de passe.", "أدخل كلمة المرور."));

  const onSubmit = ({ email, password, remember }: LoginValues) => {
    setFormError(null);
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (session) => {
          // « Rester connecté » unticked: the session ends with the browser.
          adoptSignIn(session, undefined, { remember: remember ?? true });
          navigate(routeAfterSignIn(session));
        },
        onError: (error) => {
          const problem = toProblem(error);
          if (
            problem.status === 400 &&
            (problem.field === "email" || problem.field === "password")
          ) {
            setError(problem.field, {
              type: "server",
              message:
                problem.detail ?? L("Valeur invalide.", "قيمة غير صالحة."),
            });
            return;
          }
          if (problem.status === 401 || problem.code === "invalid_credentials") {
            setFormError(
              problem.detail ??
                L(
                  "E-mail ou mot de passe incorrect",
                  "البريد الإلكتروني أو كلمة المرور غير صحيحة",
                ),
            );
            return;
          }
          const retry = L(
            "Connexion impossible. Réessayez.",
            "تعذّر تسجيل الدخول. أعد المحاولة.",
          );
          // Network / 5xx: nothing to fix in the form. Anything else (429…)
          // carries its own French detail.
          toast.error(
            problem.status === 0 || problem.status >= 500
              ? retry
              : (problem.detail ?? retry),
          );
        },
      },
    );
  };

  const socialSignIn = useSocialSignIn();

  /** Google / Apple failures: a backed-out user stays silent, the rest is said. */
  const reportSocialError = (provider: SocialProvider, error: unknown) => {
    const reason = error instanceof Error ? error.message : "";
    if (reason.endsWith("_cancelled")) return;
    if (reason.endsWith("_not_configured")) {
      toast.error(
        L(
          "Connexion non configurée pour ce fournisseur.",
          "لم تتم تهيئة الدخول عبر هذا المزوّد.",
        ),
      );
      return;
    }
    const name = provider === "google" ? "Google" : "Apple";
    if (reason.endsWith("_unavailable")) {
      toast.error(
        L(
          `${name} n'a pas pu s'ouvrir. Réessayez dans un instant.`,
          `تعذّر فتح ${name}. أعد المحاولة بعد لحظة.`,
        ),
      );
      return;
    }
    const problem = toProblem(error);
    if (problem.code === "email_in_use") {
      toast.error(
        problem.detail ??
          L(
            "Un compte existe déjà avec cet e-mail : connectez-vous avec son mot de passe.",
            "يوجد حساب بهذا البريد: سجّل الدخول بكلمة المرور.",
          ),
      );
      return;
    }
    toast.error(problem.detail ?? L("Connexion impossible.", "تعذّر تسجيل الدخول."));
  };

  /**
   * The provider's token in hand: hand it to the API, then open the session
   * exactly like a password login does — « Rester connecté » included.
   */
  const finishSocial = async (
    provider: SocialProvider,
    credentials: { idToken: string; code?: string },
  ) => {
    try {
      const session = await socialSignIn.mutateAsync({ provider, ...credentials });
      adoptSignIn(session, undefined, { remember: getValues("remember") ?? true });
      navigate(routeAfterSignIn(session));
    } catch (error) {
      reportSocialError(provider, error);
    }
  };

  // Google's button calls back long after it was drawn: always reach the latest handler.
  const finishSocialRef = useRef(finishSocial);
  useEffect(() => {
    finishSocialRef.current = finishSocial;
  });

  const goSignup = () => {
    authActions.setMode("signup");
    navigate("/role");
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex justify-center">
          <img
            src="/logo-brand.png"
            alt="De9 De9 Entreprise"
            width={208}
            height={232}
            className="h-[104px] w-auto"
          />
        </div>
        <Card className="shadow-modal">
          <CardContent className="p-6 sm:p-7">
            <h1 className="mb-6 text-center text-xl font-extrabold text-de9-ink">
              {t("loginTitle")}
            </h1>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-1.5">
                <Label htmlFor="login-email">{t("email")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "login-email-error" : undefined}
                  {...register("email")}
                />
                {emailError && (
                  <p
                    id="login-email-error"
                    className="text-[12px] font-medium text-destructive"
                  >
                    {emailError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">{t("password")}</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    aria-invalid={!!passwordError}
                    aria-describedby={
                      passwordError ? "login-password-error" : undefined
                    }
                    className="pe-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? L("Masquer", "إخفاء")
                        : L("Afficher", "إظهار")
                    }
                    className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-de9-gray hover:text-de9-ink"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p
                    id="login-password-error"
                    className="text-[12px] font-medium text-destructive"
                  >
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <label className="flex cursor-pointer items-center gap-2 text-de9-slate">
                  <Checkbox
                    defaultChecked
                    onCheckedChange={(v) => setValue("remember", v === true)}
                  />
                  <span>{t("rester")}</span>
                </label>
                <button
                  type="button"
                  className="font-medium text-de9-teal-dark hover:underline"
                >
                  {t("forgot")}
                </button>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="text-center text-[13px] font-medium text-destructive"
                >
                  {formError}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={login.isPending || socialSignIn.isPending}
                className="h-11 w-full text-[15px]"
              >
                {login.isPending ? L("Connexion…", "جارٍ تسجيل الدخول…") : t("loginCta")}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-de9-line" />
              <span className="text-[12px] text-de9-gray">{L("ou", "أو")}</span>
              <span className="h-px flex-1 bg-de9-line" />
            </div>

            {/* Google alone for now: « Se connecter avec Apple » is not offered (its client half
                stays in lib/socialProviders for the day it is). */}
            {GOOGLE_CLIENT_ID ? (
              <GoogleButton
                busy={socialSignIn.isPending || login.isPending}
                onCredential={(idToken) =>
                  void finishSocialRef.current("google", { idToken })
                }
                onError={(error) => reportSocialError("google", error)}
              />
            ) : (
              <>
                <SocialButton
                  label="Google"
                  disabled
                  onClick={() => {}}
                  className="w-full"
                />
                <p className="mt-2 text-center text-[12px] text-de9-gray">
                  {L(
                    "Connexion Google à configurer (VITE_GOOGLE_CLIENT_ID).",
                    "يجب تهيئة الدخول عبر Google.",
                  )}
                </p>
              </>
            )}

            <p className="mt-6 text-center text-[13px] text-de9-slate">
              {t("noAccount")}{" "}
              <button
                type="button"
                onClick={goSignup}
                className="font-semibold text-de9-teal-dark hover:underline"
              >
                {t("createAccount")}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function SocialButton({
  label,
  onClick,
  disabled,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className={cn("h-11", className)}
    >
      {label}
    </Button>
  );
}

/**
 * Google's own « Continuer avec Google » button, drawn by its script into this
 * box. It cannot be disabled, so while a sign-in runs the box stops taking
 * clicks instead.
 */
function GoogleButton({
  busy,
  onCredential,
  onError,
}: {
  busy: boolean;
  onCredential: (idToken: string) => void;
  onError: (error: Error) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.mode);
  const lang = useLangStore((s) => s.lang);
  // The script calls back later: read the latest handlers, not the first render's.
  const handlers = useRef({ onCredential, onError });
  useEffect(() => {
    handlers.current = { onCredential, onError };
  });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    return renderGoogleButton(el, {
      theme: theme === "dark" ? "filled_black" : "outline",
      width: el.clientWidth,
      locale: lang === "ar" ? "ar" : "fr",
      onCredential: (idToken) => handlers.current.onCredential(idToken),
      onError: (error) => handlers.current.onError(error),
    });
  }, [theme, lang]);

  return (
    <div
      ref={box}
      aria-busy={busy}
      // Google's frame is a light document: on a dark page the browser paints a white box behind
      // it, wider than the button. Declared light here, the frame stays see-through.
      className={cn(
        "flex h-11 items-center justify-center [color-scheme:light]",
        busy && "pointer-events-none opacity-60",
      )}
    />
  );
}
