# Flow: Tax Preparation (ITR Figures)

> Last reviewed against code: not yet built — design blueprint.
> Read `architecture.md` first.
>
> **Important boundary:** this app *prepares figures*. It does not file taxes
> and it is not a substitute for a tax professional. Every tax assumption in
> the app is a stored, editable setting — never a hard-coded guess — precisely
> so it can be corrected on a CA's advice without touching code.

This flow turns the P&L and the balance sheet into the numbers the user needs
to file an Indian ITR-3. It is mostly **deterministic computation**, with a
small, clearly-bounded role for AI (explanation and sanity-checking only —
never producing a filed number).

---

## The split: computation vs. judgement

Tax work divides into two kinds of task. The app treats them differently.

**Deterministic computation** — has exactly one correct answer:
depreciation, net profit, summed interest, the presumptive figure. Done in
**plain code**. A model must never compute these.

**Judgement and structure** — which ITR form, whether to elect presumptive
taxation, which schedules apply, what counts as a business expense. These are
**decided once by the user (with their CA)** and *stored* in the Tax Profile.
The app does not re-decide them each year by prompting a model; it applies the
stored decisions.

So: the app is a faithful, auditable calculator that *applies* the user's tax
decisions. It is not a tax advisor.

---

## Trigger

The user opens the **ITR-prep** view on the Reports page for a financial year.

---

## The steps, in order

### Step 1 — Load the Tax Profile for the year

**What happens:** the engine loads the Tax Profile (see `architecture.md`
§3.8) for the selected financial year: the ITR form, whether presumptive
taxation is elected and at what rate, and which schedules apply.

These are entered on **Reports** (ITR prep for the selected year), not in
Settings — they are books configuration, not profile preferences.

### Step 2 — Compute the actual-basis taxable income

**What happens:** the engine computes taxable income the "actual" way:

- Start from net profit (`flow-pnl-calculation.md`).
- Depreciation is already included as a P&L expense.
- Apply **business-use percentage** adjustments: for a shared asset used, say,
  70% for business, only 70% of its loan interest and 70% of its depreciation
  are deductible. The app stores `business_use_pct` per asset and applies it
  here.
- The result is actual-basis taxable income.

All arithmetic. No AI.

### Step 3 — Compute the presumptive-basis taxable income

**What happens:** if presumptive taxation (e.g. Section 44AD) is relevant, the
engine also computes taxable income the presumptive way: **gross receipts ×
the presumptive rate** (e.g. 6% for digital receipts). Under presumptive
taxation, detailed expenses and depreciation are *not* separately deducted —
the fixed percentage is the whole deal.

### Step 4 — Show the dual comparison

**What happens:** the app displays **both** figures side by side:

> Actual basis: taxable income ₹X
> Presumptive basis: taxable income ₹Y
> Difference: ₹(X − Y)

This is the single most valuable thing this flow produces. The government
portal will not show this comparison — it just accepts whichever basis the
user commits to. The app lets the user see the gap and choose the better
outcome, year by year.

**Caveat the app should surface, not hide:** electing presumptive taxation has
eligibility limits (turnover ceilings) and lock-in consequences (opting out
after opting in has multi-year effects). And whether foreign-source service
income sits cleanly under a presumptive scheme at all is a genuine question
for a CA. The app stores the choice as a setting and shows the comparison; it
does not assert that presumptive is permitted.

### Step 5 — Map figures to schedules

**What happens:** the engine lays out each figure against the place it goes on
the ITR:

- net profit / P&L detail → the business income schedule;
- foreign-source income → Schedule FSI;
- foreign assets, if any → Schedule FA;
- assets and liabilities (from `flow-balance-sheet.md`), if income crosses the
  threshold → Schedule AL;
- the loan's closing outstanding balance → the liabilities figure.

The output is a clear "this number → this schedule" sheet the user carries to
the e-filing portal.

### Step 6 — Export

**What happens:** the user can export the prepared figures (and underlying
transaction detail) to a file — CSV / a structured report — to keep, to send
to a CA, or to reference while filing. Export is included in v1; automated
*backup* is not.

---

## Where AI is allowed in this flow — and where it is not

**Allowed (advisory only):**

- explaining *why* the presumptive and actual figures differ;
- flagging transactions categorized as business expenses that look personal
  ("this looks like a personal purchase — confirm?");
- answering "given my situation, which schedules am I likely missing?"

These are reading/pattern-spotting tasks where being approximately right is
useful and a human reviews the output anyway.

**Never allowed:**

- computing taxable income, depreciation, the presumptive figure, or any
  number that goes on the return. Those are code, every time.

---

## What this flow assumes

- The P&L is computed (`flow-pnl-calculation.md`).
- The balance sheet and depreciation are computed (`flow-balance-sheet.md`).
- The Tax Profile for the year has been filled in by the user.
- Transactions are confirmed and correctly categorized.

## What this flow deliberately does NOT do

- It does not file the return. It prepares figures; the user files on the
  government portal.
- It does not give tax advice or decide the user's tax positions. It applies
  decisions the user (and their CA) have already made and stored.
- It does not let AI produce a filed number.
- It does not handle GST (deferred — see `architecture.md` §1).
