"use client";

import { DicesIcon, XIcon, ZapIcon } from "lucide-react";
import type { ComponentProps, FormEvent, ReactNode } from "react";
import { useId, useRef, useState } from "react";

import { RegionCard } from "@/components/region-card/region-card";
import { RegionGlobe } from "@/components/region-globe/region-globe";
import type { ServerRegion } from "@/components/region-select/region-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface CreateProjectValues {
  name: string;
  postgresVersion: string;
  regionId: string;
  enableAuth: boolean;
}

export type CreateProjectProps = Omit<
  ComponentProps<"form">,
  "onSubmit" | "title"
> & {
  /** Regions offered in the picker and plotted on the map. */
  regions: ServerRegion[];
  /** Postgres versions offered, newest first. */
  postgresVersions?: string[];
  /** Initial Postgres version; defaults to the first offered. */
  defaultPostgresVersion?: string;
  /** Initial region id; defaults to the first region. */
  defaultRegionId?: string;
  /** Called with the form values when Create is pressed. */
  onSubmit?: (values: CreateProjectValues) => void;
  /** Renders the Cancel action. */
  onCancel?: () => void;
  /** Renders the close button in the header. */
  onClose?: () => void;
  /** Locks the actions and swaps the Create label. */
  isBusy?: boolean;
  /** Panel heading. */
  title?: ReactNode;
  /** Description under the Neon Auth toggle. */
  authDescription?: ReactNode;
  /** Measured round-trips by region id, e.g. from useRegionPing. */
  latencies?: Record<string, number | null | undefined>;
  /** Hide the tilted globe under the map. */
  hideGlobe?: boolean;
  /** Inline field errors, e.g. from a rejected create request. */
  errors?: Partial<Record<"name" | "region", string>>;
};

const DEFAULT_POSTGRES_VERSIONS = ["18", "17", "16"];

/* Name generator: quiet adjective-noun pairs, Neon-style. */
const NAME_ADJECTIVES = [
  "misty",
  "quiet",
  "amber",
  "bold",
  "crimson",
  "dawn",
  "emerald",
  "frosty",
  "gentle",
  "hidden",
  "lunar",
  "polished",
  "rapid",
  "silent",
  "velvet",
  "wandering",
];
const NAME_NOUNS = [
  "river",
  "meadow",
  "summit",
  "harbor",
  "canyon",
  "aurora",
  "thicket",
  "lagoon",
  "prairie",
  "glacier",
  "ember",
  "willow",
  "drift",
  "cove",
  "ridge",
  "basin",
];
const NAME_NUMBER_MAX = 100;

/** Lowest measured round-trip among selectable regions. */
const fastestOf = (
  regions: ServerRegion[],
  latencies?: Record<string, number | null | undefined>
) => {
  if (!latencies) {
    return null;
  }

  let best: { id: string; ping: number } | null = null;

  for (const region of regions) {
    const ping = latencies[region.id];

    const usable = !region.disabled && typeof ping === "number";

    if (usable && (!best || ping < best.ping)) {
      best = { id: region.id, ping };
    }
  }

  return best;
};

const pick = (list: string[]) =>
  list[Math.floor(Math.random() * list.length)] ?? "";

const randomProjectName = () =>
  `${pick(NAME_ADJECTIVES)}-${pick(NAME_NOUNS)}-${Math.floor(
    Math.random() * NAME_NUMBER_MAX
  )}`;

const DEFAULT_AUTH_DESCRIPTION = (
  <>
    Neon Auth adds ready-to-use authentication to your app — users and sessions
    are stored directly in your database. You can also enable it later in
    project settings.
  </>
);

/** Provider-prefixed display label for a region. */
const regionLabelOf = (region: ServerRegion) =>
  region.provider ? `${region.provider} ${region.name}` : region.name;

const FieldError = ({ children, id }: { children: ReactNode; id: string }) =>
  children ? (
    <p className="text-destructive text-xs" id={id} role="alert">
      {children}
    </p>
  ) : null;

const NameField = ({
  error,
  id,
  inputRef,
  name,
  onNameChange,
}: {
  error?: string;
  id: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  name: string;
  onNameChange: (name: string) => void;
}) => (
  <div className="flex flex-col gap-1.5">
    <Label htmlFor={`${id}-name`}>Project name</Label>
    <div className="relative">
      <Input
        aria-describedby={error ? `${id}-name-error` : undefined}
        aria-invalid={error ? true : undefined}
        autoCapitalize="off"
        autoComplete="off"
        className="pr-9"
        enterKeyHint="done"
        id={`${id}-name`}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="e.g., app name or customer name"
        ref={inputRef}
        spellCheck={false}
        value={name}
      />
      <Button
        aria-label="Randomize project name"
        className="-translate-y-1/2 absolute top-1/2 right-1 text-muted-foreground hover:text-foreground"
        onClick={() => {
          onNameChange(randomProjectName());
          // Focus and select so the result is instantly replaceable —
          // a mis-click never costs typed work.
          requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
          });
        }}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <DicesIcon />
      </Button>
    </div>
    <FieldError id={`${id}-name-error`}>{error}</FieldError>
  </div>
);

const RegionField = ({
  error,
  fastest,
  id,
  onChoose,
  regionId,
  regions,
  selectedRegion,
}: {
  error?: string;
  fastest: { id: string; ping: number } | null;
  id: string;
  onChoose: (id: string) => void;
  regionId: string;
  regions: ServerRegion[];
  selectedRegion?: ServerRegion;
}) => (
  <div className="flex flex-col gap-1.5">
    {/* min-h reserves the action's height, so the button can appear
        without shifting the form when pings resolve. */}
    <div className="flex min-h-6 items-center justify-between gap-2">
      <Label htmlFor={`${id}-region`}>Region</Label>
      {fastest ? (
        <Button
          className="h-6 animate-in gap-1 px-1.5 font-mono text-[11px] text-muted-foreground fade-in-0 duration-150 hover:text-foreground motion-reduce:animate-none"
          onClick={() => onChoose(fastest.id)}
          size="xs"
          type="button"
          variant="ghost"
        >
          <ZapIcon aria-hidden="true" className="size-3" />
          fastest · {fastest.ping} ms
        </Button>
      ) : null}
    </div>
    <Select
      items={regions.map((region) => ({
        label: regionLabelOf(region),
        value: region.id,
      }))}
      onValueChange={(next) => {
        if (typeof next === "string") {
          onChoose(next);
        }
      }}
      value={regionId}
    >
      <SelectTrigger
        aria-describedby={error ? `${id}-region-error` : undefined}
        aria-invalid={error ? true : undefined}
        className="w-full"
        id={`${id}-region`}
      >
        <SelectValue>
          {selectedRegion ? (
            regionLabelOf(selectedRegion)
          ) : (
            <span className="text-muted-foreground">Select region</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        {regions.map((region) => (
          <SelectItem
            disabled={region.disabled}
            key={region.id}
            value={region.id}
          >
            {regionLabelOf(region)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <FieldError id={`${id}-region-error`}>{error}</FieldError>
    <p className="text-muted-foreground text-xs">
      Select the region closest to your application.
    </p>
  </div>
);

export const CreateProject = ({
  authDescription = DEFAULT_AUTH_DESCRIPTION,
  className,
  errors,
  hideGlobe,
  latencies,
  defaultPostgresVersion,
  defaultRegionId,
  isBusy,
  onCancel,
  onClose,
  onSubmit,
  postgresVersions = DEFAULT_POSTGRES_VERSIONS,
  regions,
  title = "Create project",
  ...props
}: CreateProjectProps) => {
  const id = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [postgresVersion, setPostgresVersion] = useState(
    defaultPostgresVersion ?? postgresVersions[0] ?? ""
  );
  const [regionId, setRegionId] = useState(
    defaultRegionId ?? regions[0]?.id ?? ""
  );
  const [enableAuth, setEnableAuth] = useState(false);
  // The globe idles on a slow spin until the user commits a region
  // (dropdown or dot click); defaults don't count as choosing.
  const [regionTouched, setRegionTouched] = useState(false);
  const selectedRegion = regions.find((region) => region.id === regionId);

  const chooseRegion = (next: string) => {
    setRegionId(next);
    setRegionTouched(true);
  };

  const fastestRegion = fastestOf(regions, latencies);
  const selectedPing = latencies?.[regionId];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.({ enableAuth, name, postgresVersion, regionId });
  };

  return (
    <form
      aria-labelledby={`${id}-title`}
      className={cn(
        "@container relative flex w-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card",
        className
      )}
      data-slot="create-project"
      onSubmit={handleSubmit}
      {...props}
    >
      {/* pointer-events-none lets globe markers under the header band
          stay clickable; the close button re-enables its own. */}
      <div className="pointer-events-none relative z-10 flex items-start justify-between gap-4 p-4 pb-0 @xl:p-6 @xl:pb-0">
        <h2
          className="font-semibold text-foreground text-xl"
          id={`${id}-title`}
        >
          {title}
        </h2>
        {onClose ? (
          <Button
            aria-label="Close"
            className="pointer-events-auto"
            onClick={onClose}
            size="icon"
            type="button"
            variant="outline"
          >
            <XIcon />
          </Button>
        ) : null}
      </div>

      {/* The globe floats in the panel's top right, oversized and
          cropped by the dialog edges, console-style. Marker dots stay
          clickable; the sphere itself is a backdrop. */}
      {hideGlobe ? null : (
        <div
          className="-top-[30%] -right-[20%] pointer-events-none absolute z-0 hidden w-[70%] min-w-80 @3xl:block @5xl:-top-[16%] @5xl:-right-[10%] @5xl:w-[52%]"
          data-slot="create-project-globe"
        >
          <RegionGlobe
            latencies={latencies}
            onValueChange={chooseRegion}
            regions={regions}
            spin={!regionTouched}
            value={regionId}
          />
        </div>
      )}

      <div className="grid gap-6 p-4 @3xl:min-h-[24rem] @3xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] @xl:gap-8 @xl:p-6">
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 @md:grid-cols-[minmax(0,1fr)_auto]">
            <NameField
              error={errors?.name}
              id={id}
              inputRef={nameRef}
              name={name}
              onNameChange={setName}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-pg`}>Postgres version</Label>
              <Select
                items={postgresVersions.map((version) => ({
                  label: version,
                  value: version,
                }))}
                onValueChange={(next) => {
                  if (typeof next === "string") {
                    setPostgresVersion(next);
                  }
                }}
                value={postgresVersion}
              >
                <SelectTrigger className="w-20" id={`${id}-pg`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {postgresVersions.map((version) => (
                    <SelectItem key={version} value={version}>
                      {version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <RegionField
            error={errors?.region}
            fastest={fastestRegion}
            id={id}
            onChoose={chooseRegion}
            regionId={regionId}
            regions={regions}
            selectedRegion={selectedRegion}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-auth`}>Enable Neon Auth</Label>
            <div className="flex items-start gap-3">
              <Switch
                aria-describedby={`${id}-auth-description`}
                checked={enableAuth}
                id={`${id}-auth`}
                onCheckedChange={setEnableAuth}
              />
              <p
                className="text-muted-foreground text-sm"
                id={`${id}-auth-description`}
              >
                {authDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Region card: floats over the globe's lower-left, but lives
            in the grid so the footer can never crop it. */}
        {hideGlobe || !selectedRegion ? null : (
          <div
            aria-live="polite"
            className="pointer-events-none relative z-10 hidden @3xl:block"
          >
            <RegionCard
              className="absolute right-[10%] bottom-2 max-w-[85%]"
              key={selectedRegion.id}
              ping={selectedPing}
              regionId={selectedRegion.id}
              title={regionLabelOf(selectedRegion)}
            />
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col-reverse justify-end gap-2 border-border/60 border-t bg-card p-4 @md:flex-row">
        {/* Cancel hides while busy (no false abort affordance); Create
            reserves width so the label swap doesn't shift the footer. */}
        {onCancel && !isBusy ? (
          <Button
            className="w-full @md:w-auto"
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
        ) : null}
        <Button
          className="w-full min-w-24 @md:w-auto"
          disabled={isBusy}
          type="submit"
        >
          {isBusy ? "Creating…" : "Create"}
        </Button>
      </div>
    </form>
  );
};
