import { Save, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { BRANDING_SETTINGS_GROUP_KEY, SITE_SETTINGS_SCOPE, brandingSettingRows } from "@/lib/site-settings";

export function SettingsForm() {
  return (
    <main className="flex-1 overflow-auto px-5 py-8 md:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-soft)] pb-6">
          <div>
            <h1 className="font-lab-display text-3xl font-semibold text-[var(--text-strong)]">Site Settings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Configure core CMS parameters, SEO defaults, and workspace identity before API-backed persistence exists.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary">Discard</Button>
            <Button icon={<Save size={15} />} variant="primary">
              Save Changes
            </Button>
          </div>
        </header>

        <Panel className="p-6 md:p-8">
          <div className="flex items-center gap-3 border-b border-[var(--border-soft)] pb-5">
            <SlidersHorizontal className="text-[var(--cyan)]" size={20} />
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">General Configuration</h2>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Field label="Site Name" value="CrescentLab CMS" />
            <Field label="Primary Domain" value="https://crescentlab.dev" />
            <Field
              className="md:col-span-2"
              label="Site Description (Meta)"
              multiline
              value="A high-performance, developer-centric content management system built for speed and precision."
            />
          </div>
        </Panel>

        <Panel className="p-6 md:p-8">
          <div className="flex items-center gap-3 border-b border-[var(--border-soft)] pb-5">
            <SlidersHorizontal className="text-[var(--cyan)]" size={20} />
            <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">Branding Assets</h2>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {brandingSettingRows.map((row) => (
              <Field
                className={row.key === "heroImageUrl" ? "md:col-span-2" : undefined}
                key={row.key}
                label={row.key}
                meta={
                  <span>
                    {SITE_SETTINGS_SCOPE}/{BRANDING_SETTINGS_GROUP_KEY}
                  </span>
                }
                value={row.value}
              />
            ))}
          </div>
        </Panel>
      </div>
    </main>
  );
}
