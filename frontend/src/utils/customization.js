import { formatCurrency } from "./format";

export const GROUP_TYPE_OPTIONS = [
  { value: "single", label: "Seleção única" },
  { value: "multiple", label: "Múltipla seleção" },
  { value: "text", label: "Texto livre / observação" }
];

export const GROUP_TYPE_LABEL = {
  single: "Seleção única",
  multiple: "Múltipla seleção",
  text: "Texto livre"
};

export function sortByOrder(items) {
  return [...items].sort((a, b) => {
    const orderA = Number.isFinite(a.sortOrder) ? a.sortOrder : 0;
    const orderB = Number.isFinite(b.sortOrder) ? b.sortOrder : 0;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.name || a.nome || "").localeCompare(String(b.name || b.nome || ""));
  });
}

export function sumOptionPrices(selectedGroups = []) {
  return selectedGroups.reduce((sum, group) => {
    if (!Array.isArray(group.selectedOptions)) return sum;
    return sum + group.selectedOptions.reduce((acc, option) => acc + Number(option.priceDelta || 0), 0);
  }, 0);
}

export function buildSelectionSummary(selectedGroups = [], customerNote = "") {
  const lines = [];

  selectedGroups.forEach((group) => {
    if (group.type === "text") {
      if (group.textValue?.trim()) {
        lines.push(`${group.name}: ${group.textValue.trim()}`);
      }
      return;
    }

    if (!Array.isArray(group.selectedOptions) || !group.selectedOptions.length) return;

    const value = group.selectedOptions
      .map((option) => {
        const extra = Number(option.priceDelta || 0);
        return extra > 0 ? `${option.name} (+${formatCurrency(extra)})` : option.name;
      })
      .join(", ");

    lines.push(`${group.name}: ${value}`);
  });

  if (customerNote?.trim()) {
    lines.push(`Observação: ${customerNote.trim()}`);
  }

  return lines;
}

export function buildStoredSelectionSummary(rawNotes = "") {
  return String(rawNotes || "")
    .split("|")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function serializeSelectionSignature(selectedGroups = [], customerNote = "") {
  const normalized = selectedGroups.map((group) => ({
    groupId: group.groupId,
    type: group.type,
    textValue: group.textValue || "",
    selectedOptionIds: Array.isArray(group.selectedOptions)
      ? group.selectedOptions.map((option) => option.optionId).sort()
      : []
  }));

  return JSON.stringify({
    selectedGroups: normalized.sort((a, b) => String(a.groupId).localeCompare(String(b.groupId))),
    customerNote: customerNote?.trim() || ""
  });
}
