"use client";

import { Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { MainCategoryFormDialog } from "@/components/categories/main-category-form-dialog";
import { SubCategoryFormDialog } from "@/components/categories/sub-category-form-dialog";
import { Label } from "@/components/ui/label";
import type { MainCategorySummary, SubCategorySummary } from "@/lib/categories/types";
import { mainCategoryCardStyles } from "@/lib/colors/hex-styles";
import { cn } from "@/lib/utils";

export type CategorySelection = {
  mainCategoryId: string | null;
  subCategoryId: string | null;
};

type MainDialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; main: MainCategorySummary };

type SubDialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; sub: SubCategorySummary };

function AddCategoryCard({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-2 py-2 text-center transition",
        "border-zinc-500 bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-50",
      )}
    >
      <Plus className="size-3.5 shrink-0" aria-hidden />
      <span className="text-[10px] font-medium leading-tight">{label}</span>
    </button>
  );
}

export function CategoryPickerPanel({
  mains,
  subsByMain,
  selection,
  onSelectionChange,
  description,
  onDescriptionChange,
  aiSuggestion,
  disabled,
}: {
  mains: MainCategorySummary[];
  subsByMain: Record<string, SubCategorySummary[]>;
  selection: CategorySelection;
  onSelectionChange: (next: CategorySelection) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  aiSuggestion?: { confidence: number | null } | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [mainDialog, setMainDialog] = useState<MainDialogState>({ open: false });
  const [subDialog, setSubDialog] = useState<SubDialogState>({ open: false });

  const selectedSub = selection.subCategoryId
    ? Object.values(subsByMain)
        .flat()
        .find((s) => s.id === selection.subCategoryId)
    : undefined;
  const selectedMain =
    mains.find((m) => m.id === selection.mainCategoryId) ??
    (selectedSub
      ? mains.find((m) => m.id === selectedSub.mainCategoryId)
      : undefined);
  const subs = selection.mainCategoryId
    ? (subsByMain[selection.mainCategoryId] ?? [])
    : [];
  const pendingSubForMain =
    Boolean(selection.mainCategoryId) && !selection.subCategoryId;
  const showMainGrid = !selection.subCategoryId && !selection.mainCategoryId;
  const showSubGrid =
    Boolean(selectedMain) && pendingSubForMain && subs.length > 0;
  const showMainOnlyHint =
    Boolean(selectedMain) &&
    pendingSubForMain &&
    subs.length === 0 &&
    selection.mainCategoryId;
  const selectedLabel = selection.subCategoryId
    ? `${selectedMain?.name ?? "Category"} → ${selectedSub?.name ?? ""}`
    : selection.mainCategoryId
      ? (selectedMain?.name ?? "Category")
      : null;

  const selectedAccentHex =
    selectedSub?.colorHex ?? selectedMain?.colorHex ?? "#71717a";
  const selectedSurface = selectedLabel
    ? mainCategoryCardStyles(selectedAccentHex, true)
    : null;

  const addSubParentId = selection.mainCategoryId ?? selectedMain?.id ?? "";
  const addSubParentName = selectedMain?.name ?? "category";

  function selectMain(main: MainCategorySummary) {
    onSelectionChange({ mainCategoryId: main.id, subCategoryId: null });
  }

  function selectSub(sub: SubCategorySummary) {
    onSelectionChange({ mainCategoryId: null, subCategoryId: sub.id });
  }

  function clearCategory() {
    onSelectionChange({ mainCategoryId: null, subCategoryId: null });
  }

  function handleMainCreated(id: string) {
    onSelectionChange({ mainCategoryId: id, subCategoryId: null });
    router.refresh();
  }

  function handleSubCreated(id: string) {
    onSelectionChange({ mainCategoryId: null, subCategoryId: id });
    router.refresh();
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Category
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Main, then sub if listed. Mains without subs need only one click.
          </p>
        </div>

        {selectedLabel && selectedSurface ? (
          <div className="shrink-0 px-4 pt-4">
            <div
              className="rounded-xl border-2 px-3 py-3"
              style={selectedSurface}
            >
              <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                {aiSuggestion ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 font-semibold normal-case text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                    <Sparkles className="size-3" aria-hidden />
                    AI suggestion
                    {aiSuggestion.confidence != null
                      ? ` · ${Math.round(aiSuggestion.confidence * 100)}%`
                      : null}
                  </span>
                ) : (
                  "Selected category"
                )}
              </p>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-zinc-950">
                {selectedLabel}
              </p>
              <button
                type="button"
                disabled={disabled}
                onClick={clearCategory}
                className="mt-2 text-xs font-semibold disabled:opacity-50"
                style={{ color: selectedAccentHex }}
              >
                Change category
              </button>
            </div>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {showSubGrid ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-500">Sub-category</p>
              <div className="grid grid-cols-2 gap-1.5">
                {subs.map((sub) => {
                  const surface = mainCategoryCardStyles(sub.colorHex, false);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectSub(sub)}
                      style={surface}
                      className="rounded-xl border-2 px-2.5 py-2 text-left text-xs font-semibold leading-snug text-zinc-950 transition hover:opacity-90"
                    >
                      {sub.name}
                    </button>
                  );
                })}
                <AddCategoryCard
                  label="Add sub-category"
                  disabled={disabled}
                  onClick={() => setSubDialog({ open: true, mode: "create" })}
                />
              </div>
            </div>
          ) : null}

          {showMainGrid ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-500">Main category</p>
              <div className="grid grid-cols-2 gap-1.5">
                {mains.map((main) => {
                  const active =
                    selection.mainCategoryId === main.id &&
                    !selection.subCategoryId;
                  const surface = mainCategoryCardStyles(main.colorHex, active);
                  const subsCount = subsByMain[main.id]?.length ?? 0;

                  return (
                    <button
                      key={main.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectMain(main)}
                      style={surface}
                      className={cn(
                        "rounded-xl border-2 px-2.5 py-2 text-left text-xs font-semibold transition",
                        active ? "text-zinc-950" : "text-zinc-800 hover:opacity-90",
                      )}
                    >
                      <span className="block leading-tight">{main.name}</span>
                      <span className="mt-0.5 block text-[10px] font-normal opacity-80">
                        {subsCount > 0
                          ? `${subsCount} sub${subsCount === 1 ? "" : "s"}`
                          : "Main only"}
                      </span>
                    </button>
                  );
                })}
                <AddCategoryCard
                  label="Add main category"
                  disabled={disabled}
                  onClick={() => setMainDialog({ open: true, mode: "create" })}
                />
              </div>
            </div>
          ) : null}

          {showMainOnlyHint ? (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {selectedMain?.name}
                </span>{" "}
                has no sub-categories — you can save at main level, or add one
                below.
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <AddCategoryCard
                  label="Add sub-category"
                  disabled={disabled}
                  onClick={() => setSubDialog({ open: true, mode: "create" })}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-1.5">
            <Label htmlFor="categorize-description">Description</Label>
            <textarea
              id="categorize-description"
              disabled={disabled}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Short label for your books"
            />
          </div>
        </div>
      </div>

      {mainDialog.open ? (
        <MainCategoryFormDialog
          mode={mainDialog.mode}
          main={mainDialog.mode === "edit" ? mainDialog.main : null}
          onClose={() => setMainDialog({ open: false })}
          onCreated={handleMainCreated}
        />
      ) : null}

      {subDialog.open && addSubParentId ? (
        <SubCategoryFormDialog
          mode={subDialog.mode}
          sub={subDialog.mode === "edit" ? subDialog.sub : null}
          mainCategoryId={addSubParentId}
          mainCategoryName={addSubParentName}
          onClose={() => setSubDialog({ open: false })}
          onCreated={handleSubCreated}
        />
      ) : null}
    </>
  );
}
