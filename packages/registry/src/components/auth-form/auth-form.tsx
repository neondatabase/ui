"use client";

import type { ComponentProps, FocusEvent, FormEvent, ReactNode } from "react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AuthMode = "sign-in" | "sign-up";

export type AuthFieldName = "name" | "email" | "password";

/** Returns the failure message, or null when the value passes. */
export type AuthValidator = (value: string) => string | null;

export interface AuthProvider {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface AuthFormValues {
  email: string;
  password: string;
  /** Present in sign-up mode. */
  name?: string;
}

export type AuthFormProps = Omit<ComponentProps<"form">, "onSubmit"> & {
  /** Which face the form shows. */
  mode?: AuthMode;
  /** Called with the field values once they pass validation. */
  onSubmit: (values: AuthFormValues) => void;
  /** Renders the footer swap link and enables mode switching. */
  onModeChange?: (mode: AuthMode) => void;
  /** Locks the fields and puts the action in its working state. */
  isBusy?: boolean;
  /** Structured failure message rendered above the action. */
  error?: string | null;
  /** Server-side verdicts pinned to fields (e.g. incorrect password). */
  fieldErrors?: Partial<Record<AuthFieldName, string>>;
  /**
   * Per-field validators merged over the mode defaults — return the
   * failure message, or null when the value passes. Use it to bring
   * your own password policy.
   */
  validators?: Partial<Record<AuthFieldName, AuthValidator>>;
  /** OAuth-style providers rendered under the divider. */
  providers?: AuthProvider[];
  /** Called with the provider id. */
  onProvider?: (id: string) => void;
  /** Renders the forgot link on the password row (sign-in only). */
  onForgotPassword?: () => void;
  /** Brand mark slot above the title. */
  mark?: ReactNode;
  title?: string;
  description?: string;
  /**
   * "card" (default) draws the house surface — border, bg-card,
   * padding. "bare" renders naked for split layouts that supply
   * their own panel.
   */
  variant?: "card" | "bare";
};

/* ─────────────────────────────────────────────────────────
 * ENTRANCE STORYBOARD
 *
 * Read top-to-bottom. Each value is ms after mount; every
 * group rises 8px and fades in over 500ms, fields one at a
 * time — the form introduces itself in reading order.
 * Static under reduced motion.
 *
 *    0ms   mark, title, description
 *   80ms   first field (then +60ms per field)
 *  260ms   primary action
 *  340ms   divider, providers, footer
 * ───────────────────────────────────────────────────────── */
const TIMING: Record<
  "header" | "fields" | "fieldStagger" | "action" | "meta",
  number
> = {
  // primary action
  action: 260,
  // ms between each field
  fieldStagger: 60,
  // first field
  fields: 80,
  // mark, title, description
  header: 0,
  // divider, providers, footer
  meta: 340,
};

const RISE =
  "fill-mode-backwards fade-in-0 slide-in-from-bottom-2 animate-in duration-500 motion-reduce:animate-none";

/* ─────────────────────────────────────────────────────────
 * FIELD STORYBOARD — "light in a tube"
 *
 * The frame stays neutral; the light does the talking.
 *
 *  focus    a primary beam sweeps along the field's bottom
 *           edge, left to right (250ms strong ease-out,
 *           transform-only) and the label warms to
 *           foreground
 *  blur     the beam withdraws; a filled field validates on
 *           leave — never while you're still typing, and
 *           never for a field you merely tabbed past
 *           (required verdicts wait for submit)
 *  invalid  the beam relights in destructive and stays lit,
 *           the message takes over the label slot in place
 *           (crossfade, no layout shift — the frame never
 *           moves), and an X draws itself into the field
 *           edge
 *  valid    a check draws itself into the field edge,
 *           stroke first to last (300ms ease-out)
 *  edit     any verdict clears instantly — the system
 *           responds, it doesn't linger
 *  submit   all fields judged at once; the first failure
 *           takes focus; onSubmit fires only on a clean
 *           pass. Server fieldErrors pin until edited.
 * ───────────────────────────────────────────────────────── */
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

const EMAIL_SHAPE = /^\S+@\S+\.\S+$/u;

/* Better Auth's server defaults — client verdicts agree with them. */
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

const validateEmail = (value: string): string | null => {
  if (!value) {
    return "Add your email.";
  }

  return EMAIL_SHAPE.test(value) ? null : "Not a valid email.";
};

const VALIDATORS: Record<
  AuthMode,
  Partial<Record<AuthFieldName, (value: string) => string | null>>
> = {
  "sign-in": {
    email: validateEmail,
    password: (value) => (value ? null : "Add your password."),
  },
  "sign-up": {
    email: validateEmail,
    name: (value) => (value.trim() ? null : "Add your name."),
    password: (value) => {
      if (value.length < MIN_PASSWORD) {
        return "At least 8 characters.";
      }

      return value.length > MAX_PASSWORD ? "At most 128 characters." : null;
    },
  },
};

/* Per-mode copy: sentence case, no exclamation marks. */
const COPY: Record<
  AuthMode,
  { title: string; description: string; action: string; working: string }
> = {
  "sign-in": {
    action: "Sign in",
    description: "Sign in to continue to your workspace.",
    title: "Welcome back",
    working: "Signing in…",
  },
  "sign-up": {
    action: "Create account",
    description: "Start building on your own database.",
    title: "Create your account",
    working: "Creating account…",
  },
};

/* ─────────────────────────────────────────────────────────
 * ACTION STORYBOARD — "ignition"
 *
 *  dormant  ghost: hairline border, muted label — the form
 *           hasn't earned the color yet
 *  charged  every visible field has content: the action
 *           fills to neon on a 300ms ramp and a soft
 *           primary glow blooms
 *  press    scale 0.98, 160ms — the interface is listening
 *  busy     the working label shimmers under lock
 * ───────────────────────────────────────────────────────── */
const CTA_GLOW =
  "shadow-[0_0_20px_-6px_var(--primary)] hover:shadow-[0_0_30px_-6px_var(--primary)]";

const AuthFormHeader = ({
  description,
  error,
  mark,
  title,
}: {
  description: string;
  error: string | null;
  mark?: ReactNode;
  title: string;
}) => (
  <div
    className={cn("flex flex-col gap-1.5", RISE)}
    style={{ animationDelay: `${TIMING.header}ms` }}
  >
    {mark ? (
      <span className="mb-2 text-primary" data-slot="auth-form-mark">
        {mark}
      </span>
    ) : null}
    <h2 className="font-semibold text-foreground text-xl tracking-tight">
      {title}
    </h2>
    {/* The form's voice: normally the pitch, on failure the verdict —
        swapped in place so the frame never moves. */}
    <p
      className={cn(
        "fade-in-0 animate-in text-sm duration-200 motion-reduce:animate-none",
        error ? "text-destructive" : "text-muted-foreground"
      )}
      data-slot={error ? "auth-form-error" : undefined}
      key={error ?? "description"}
      role={error ? "alert" : undefined}
    >
      {error ?? description}
    </p>
  </div>
);

/** Divider, provider buttons, and the mode-swap footer. */
const AuthFormMeta = ({
  isBusy,
  onModeChange,
  onProvider,
  providers,
  signUp,
}: {
  isBusy: boolean;
  onModeChange?: (mode: AuthMode) => void;
  onProvider?: (id: string) => void;
  providers?: AuthProvider[];
  signUp: boolean;
}) => (
  <div
    className={cn("flex flex-col gap-4", RISE)}
    style={{ animationDelay: `${TIMING.meta}ms` }}
  >
    {providers?.length ? (
      <>
        <div
          aria-hidden="true"
          className="flex items-center gap-3 text-muted-foreground/60"
        >
          <span className="h-px flex-1 bg-border/60" />
          <span className="font-mono text-[10px]">or continue with</span>
          <span className="h-px flex-1 bg-border/60" />
        </div>
        <div
          className="grid auto-cols-fr grid-flow-col gap-2"
          data-slot="auth-form-providers"
        >
          {providers.map((provider) => (
            <Button
              className="active:scale-[0.98]"
              disabled={isBusy}
              key={provider.id}
              onClick={() => onProvider?.(provider.id)}
              type="button"
              variant="outline"
            >
              {provider.icon}
              <span className="font-mono text-xs">{provider.label}</span>
            </Button>
          ))}
        </div>
      </>
    ) : null}
    {onModeChange ? (
      <p className="text-center text-muted-foreground text-xs">
        {signUp ? "Already have an account?" : "New here?"}{" "}
        <button
          className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          onClick={() => onModeChange(signUp ? "sign-in" : "sign-up")}
          type="button"
        >
          {signUp ? "Sign in" : "Create account"}
        </button>
      </p>
    ) : null}
  </div>
);

/* ─────────────────────────────────────────────────────────
 * STRENGTH STORYBOARD — sign-up password only
 *
 * The beam doubles as the meter: its reach grows with the
 * password and its color warms from destructive through
 * neutral to primary. The word ("weak" / "fair" / "strong")
 * rides the trailing slot — nothing changes height.
 * Scoring matches Better Auth's defaults (8–128 chars) as
 * the floor, then rewards mixed case, digits, symbols, and
 * length.
 * ───────────────────────────────────────────────────────── */
export interface StrengthMeter {
  label: string;
  ratio: number;
  tone: "weak" | "fair" | "strong";
}

const METER_TONE: Record<StrengthMeter["tone"], string> = {
  fair: "bg-foreground/50",
  strong: "bg-primary",
  weak: "bg-destructive",
};

const METER_WORD: Record<StrengthMeter["tone"], string> = {
  fair: "text-muted-foreground",
  strong: "text-primary",
  weak: "text-destructive",
};

const STRENGTH_STEPS = 5;

const FAIR_FLOOR = 2;
const STRONG_FLOOR = 4;
const LONG_PASSWORD = 12;

const scorePassword = (value: string): number => {
  let score = 0;

  if (value.length >= MIN_PASSWORD) {
    score += 1;
  }
  if (value.length >= LONG_PASSWORD) {
    score += 1;
  }
  if (/[a-z]/u.test(value) && /[A-Z]/u.test(value)) {
    score += 1;
  }
  if (/\d/u.test(value)) {
    score += 1;
  }
  if (/[^a-zA-Z0-9]/u.test(value)) {
    score += 1;
  }

  return score;
};

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

/** The checklist the popover renders while the password field is focused. */
const passwordRequirements = (value: string): PasswordRequirement[] => [
  { label: "8+ characters", met: value.length >= MIN_PASSWORD },
  {
    label: "upper & lower case",
    met: /[a-z]/u.test(value) && /[A-Z]/u.test(value),
  },
  { label: "a number", met: /\d/u.test(value) },
  { label: "a symbol", met: /[^a-zA-Z0-9]/u.test(value) },
];

/** Null when empty — the meter only speaks once you've started. */
const strengthMeter = (value: string): StrengthMeter | null => {
  if (!value) {
    return null;
  }

  const score = scorePassword(value);
  let tone: StrengthMeter["tone"] = "weak";

  if (score >= STRONG_FLOOR) {
    tone = "strong";
  } else if (score >= FAIR_FLOOR) {
    tone = "fair";
  }

  return {
    label: tone,
    ratio: tone === "strong" ? 1 : Math.max(score / STRENGTH_STEPS, 0.12),
    tone,
  };
};

const beamTone = (
  error: string | null | undefined,
  meter: StrengthMeter | null | undefined
) => {
  if (error) {
    return "scale-x-100 bg-destructive";
  }
  if (meter) {
    return METER_TONE[meter.tone];
  }

  return "scale-x-0 bg-primary group-focus-within:scale-x-100";
};

/* The field frame stays neutral in every state — the beam under the
 * input and the label carry the verdict. */
const FIELD_INPUT =
  "w-full rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm caret-primary outline-none transition-colors placeholder:text-muted-foreground/60 hover:border-border focus:border-border disabled:cursor-not-allowed disabled:opacity-60";

/** A verdict glyph that draws itself in, stroke first to last. */
const DrawnGlyph = ({ kind }: { kind: "check" | "cross" }) => (
  <svg
    aria-hidden="true"
    className={cn(
      "-translate-y-1/2 absolute top-1/2 right-3 size-3.5",
      kind === "check" ? "text-primary" : "text-destructive"
    )}
    data-slot={`auth-form-field-${kind}`}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      className="neon-check-draw"
      d={kind === "check" ? "M4 12.5 10 18.5 20 6" : "m6 6 12 12m0-12L6 18"}
      pathLength={1}
    />
  </svg>
);

/** One field: mono label slot that the verdict takes over in place,
 * a focus beam, and a drawn check or cross at the field edge. */
const AuthField = ({
  autoComplete,
  delay,
  disabled,
  error,
  label,
  meter,
  name,
  onEdit,
  requirements,
  onLeave,
  placeholder,
  trailing,
  type,
  valid,
}: {
  autoComplete: string;
  delay: number;
  disabled: boolean;
  error?: string | null;
  label: string;
  meter?: StrengthMeter | null;
  name: AuthFieldName;
  requirements?: PasswordRequirement[];
  onEdit: (field: AuthFieldName) => void;
  onLeave: (field: AuthFieldName, value: string) => void;
  placeholder: string;
  trailing?: ReactNode;
  type: string;
  valid?: boolean;
}) => {
  const messageId = useId();

  return (
    <label
      className={cn("group flex flex-col gap-1.5", RISE)}
      data-invalid={error ? true : undefined}
      data-slot="auth-form-field"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* The label slot: the verdict takes it over in place — same
          row, same height, zero layout shift. */}
      <span className="flex items-baseline justify-between">
        <span
          className={cn(
            "fade-in-0 min-w-0 flex-1 animate-in truncate font-mono text-xs duration-200 motion-reduce:animate-none",
            error
              ? "text-destructive"
              : "text-muted-foreground transition-colors group-focus-within:text-foreground"
          )}
          id={messageId}
          key={error ?? label}
          role={error ? "alert" : undefined}
        >
          {error ?? label}
        </span>
        {trailing}
      </span>
      <span className="relative">
        <input
          aria-describedby={error ? messageId : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete={autoComplete}
          className={cn(FIELD_INPUT, (valid || error) && "pr-9")}
          disabled={disabled}
          name={name}
          onBlur={(event: FocusEvent<HTMLInputElement>) =>
            onLeave(name, event.target.value)
          }
          onChange={() => onEdit(name)}
          placeholder={placeholder}
          type={type}
        />
        {/* The beam: primary light sweeps in on focus; a verdict
            relights it in destructive and keeps it lit. With a
            strength meter, the beam's reach IS the reading. */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-px bottom-0 h-[1.5px] origin-left motion-reduce:transition-none",
            beamTone(error, meter)
          )}
          data-slot="auth-form-field-beam"
          style={{
            transition: `scale 250ms ${EASE_OUT}, background-color 250ms ease`,
            ...(meter && !error && { scale: `${meter.ratio} 1` }),
          }}
        />
        {valid ? <DrawnGlyph kind="check" /> : null}
        {error ? <DrawnGlyph kind="cross" /> : null}
        {/* Requirements popover: floats under the field while focused —
            each rule flips from a muted dot to a primary check as the
            password satisfies it. Floating, so nothing shifts. */}
        {requirements ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-full left-0 z-50 mt-2 flex w-max translate-y-1 flex-col gap-1.5 rounded-md border border-border/60 bg-popover p-3 opacity-0 shadow-lg transition-[opacity,translate] duration-200 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none"
            data-slot="auth-form-requirements"
          >
            {requirements.map((rule) => (
              <span
                className={cn(
                  "flex items-center gap-2 font-mono text-xs transition-colors duration-200",
                  rule.met ? "text-foreground" : "text-muted-foreground/70"
                )}
                data-met={rule.met || undefined}
                key={rule.label}
              >
                {rule.met ? (
                  <svg
                    className="size-3 text-primary"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      className="neon-check-draw"
                      d="M4 12.5 10 18.5 20 6"
                      pathLength={1}
                    />
                  </svg>
                ) : (
                  <span className="mx-[5px] size-0.5 rounded-full bg-muted-foreground/70" />
                )}
                {rule.label}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </label>
  );
};

/** Sign up shows the strength reading; sign in shows the forgot link. */
const passwordTrailing = (
  signUp: boolean,
  meter: StrengthMeter | null,
  onForgotPassword?: () => void
): ReactNode => {
  if (signUp) {
    return meter ? (
      <span
        aria-live="polite"
        className={cn(
          "fade-in-0 animate-in font-mono text-xs duration-200 motion-reduce:animate-none",
          METER_WORD[meter.tone]
        )}
        data-slot="auth-form-strength"
        key={meter.tone}
      >
        {meter.label}
      </span>
    ) : undefined;
  }

  return onForgotPassword ? (
    <button
      className="text-muted-foreground text-xs underline-offset-4 transition-colors hover:text-foreground hover:underline"
      onClick={onForgotPassword}
      type="button"
    >
      Forgot password?
    </button>
  ) : undefined;
};

type Verdicts = Partial<
  Record<AuthFieldName, { error: string | null; valid: boolean }>
>;

/** The ignition action. */
const AuthFormAction = ({
  charged,
  isBusy,
  label,
  working,
}: {
  charged: boolean;
  isBusy: boolean;
  label: string;
  working: string;
}) => (
  <div
    className={cn("flex flex-col gap-3", RISE)}
    style={{ animationDelay: `${TIMING.action}ms` }}
  >
    <Button
      className={cn(
        "w-full transition-[background-color,color,border-color,box-shadow,scale] duration-300 active:scale-[0.98] motion-reduce:active:scale-100",
        charged || isBusy
          ? cn(CTA_GLOW, "disabled:opacity-100")
          : "border border-border/60 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground"
      )}
      data-charged={charged || undefined}
      disabled={isBusy}
      type="submit"
    >
      <span
        className={cn("fade-in-0 animate-in duration-300", {
          "shimmer shimmer-duration-2400": isBusy,
        })}
        key={String(isBusy)}
      >
        {isBusy ? working : label}
      </span>
    </Button>
  </div>
);

/** Judge every visible field at once; report the first failure. */
const judgeAll = (
  rules: Partial<Record<AuthFieldName, AuthValidator>>,
  fields: AuthFieldName[],
  data: FormData
) => {
  const verdicts: Verdicts = {};
  let firstFailure: AuthFieldName | null = null;

  for (const field of fields) {
    const check = rules[field];

    if (!check) {
      continue;
    }

    const value = String(data.get(field) ?? "");
    const failure = check(value);
    verdicts[field] = { error: failure, valid: !failure && value.length > 0 };

    if (failure && !firstFailure) {
      firstFailure = field;
    }
  }

  return { firstFailure, verdicts };
};

export const AuthForm = ({
  className,
  description,
  error = null,
  fieldErrors,
  isBusy = false,
  mark,
  mode = "sign-in",
  onForgotPassword,
  onModeChange,
  onProvider,
  onSubmit,
  providers,
  title,
  validators,
  variant = "card",
  ...props
}: AuthFormProps) => {
  const copy = COPY[mode];
  const signUp = mode === "sign-up";
  const rules = { ...VALIDATORS[mode], ...validators };
  const [judged, setJudged] = useState<{ mode: AuthMode; verdicts: Verdicts }>({
    mode,
    verdicts: {},
  });
  const [charged, setCharged] = useState(false);
  const [password, setPassword] = useState("");

  // Render-time re-seed: flipping modes clears every verdict.
  if (judged.mode !== mode) {
    setJudged({ mode, verdicts: {} });
    setCharged(false);
    setPassword("");
  }

  const fieldNames: AuthFieldName[] = signUp
    ? ["name", "email", "password"]
    : ["email", "password"];

  const verdictFor = (field: AuthFieldName) => {
    const server = fieldErrors?.[field];
    const local = judged.verdicts[field];
    return {
      error: server ?? local?.error ?? null,
      valid: !server && local?.valid === true,
    };
  };

  const judge = (field: AuthFieldName, value: string) => {
    const check = rules[field];

    // Skipping past an empty field isn't a mistake yet — required
    // verdicts wait for submit.
    if (!(check && value)) {
      return;
    }

    const failure = check(value);
    setJudged((prev) => ({
      mode,
      verdicts: {
        ...prev.verdicts,
        [field]: { error: failure, valid: !failure && value.length > 0 },
      },
    }));
  };

  const clear = (field: AuthFieldName) => {
    setJudged((prev) => ({
      mode,
      verdicts: { ...prev.verdicts, [field]: undefined },
    }));
  };

  /** The action charges once every visible field has content. */
  const handleFormChange = (event: FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.currentTarget);
    setCharged(
      fieldNames.every((field) => String(data.get(field) ?? "").length > 0)
    );
    setPassword(String(data.get("password") ?? ""));
  };

  const meter = signUp ? strengthMeter(password) : null;
  const requirements = signUp ? passwordRequirements(password) : undefined;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const values: AuthFormValues = {
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      ...(signUp && { name: String(data.get("name") ?? "") }),
    };

    // Judge everything at once; the first failure takes focus.
    const { firstFailure, verdicts } = judgeAll(rules, fieldNames, data);
    setJudged({ mode, verdicts });

    if (firstFailure) {
      form.querySelector<HTMLInputElement>(`[name="${firstFailure}"]`)?.focus();
      return;
    }

    onSubmit(values);
  };

  return (
    <form
      className={cn(
        "flex w-full max-w-sm flex-col gap-6",
        variant === "card" &&
          "rounded-lg border border-border/60 bg-card p-6 transition-colors hover:border-border sm:p-8",
        className
      )}
      data-busy={isBusy || undefined}
      data-mode={mode}
      data-slot="auth-form"
      noValidate
      onChange={handleFormChange}
      onSubmit={handleSubmit}
      {...props}
    >
      <AuthFormHeader
        description={description ?? copy.description}
        error={error}
        mark={mark}
        title={title ?? copy.title}
      />

      {/* Fields crossfade when the mode flips, entering one at a time. */}
      <div className="flex flex-col gap-4" key={mode}>
        {signUp ? (
          <AuthField
            autoComplete="name"
            delay={TIMING.fields}
            disabled={isBusy}
            label="name"
            name="name"
            onEdit={clear}
            onLeave={judge}
            placeholder="Ada Lovelace"
            type="text"
            {...verdictFor("name")}
          />
        ) : null}
        <AuthField
          autoComplete="email"
          delay={TIMING.fields + (signUp ? TIMING.fieldStagger : 0)}
          disabled={isBusy}
          label="email"
          name="email"
          onEdit={clear}
          onLeave={judge}
          placeholder="you@example.com"
          type="email"
          {...verdictFor("email")}
        />
        <AuthField
          autoComplete={signUp ? "new-password" : "current-password"}
          delay={TIMING.fields + TIMING.fieldStagger * (signUp ? 2 : 1)}
          disabled={isBusy}
          label="password"
          name="password"
          onEdit={clear}
          onLeave={judge}
          meter={meter}
          placeholder="••••••••"
          requirements={requirements}
          trailing={passwordTrailing(signUp, meter, onForgotPassword)}
          type="password"
          {...verdictFor("password")}
        />
      </div>

      <AuthFormAction
        charged={charged}
        isBusy={isBusy}
        label={copy.action}
        working={copy.working}
      />

      {(providers?.length || onModeChange) && (
        <AuthFormMeta
          isBusy={isBusy}
          onModeChange={onModeChange}
          onProvider={onProvider}
          providers={providers}
          signUp={signUp}
        />
      )}
    </form>
  );
};
