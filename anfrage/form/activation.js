/**
 * Etapowa aktywacja kwestionariusza. Nie zmienia kontraktu envelope.
 * Pakiet katalogowy odblokowuje pola. Sonstige i kampania nie używają
 * standardowego selecta pakietu.
 */

import { resolveAnfrageTyp } from "./envelope.js";

function packageIdInList(packageId, packages) {
  const id = String(packageId || "").trim();
  if (!id || !Array.isArray(packages)) return false;
  return packages.some((item) => item && item.id === id);
}

/**
 * @param {object | null} category
 * @param {{ packageId?: string, packages?: object[], campaign?: object | null }} [context]
 * @returns {{ active: boolean, needs: string | null, typ: string | null }}
 */
export function questionnaireActivation(category, context) {
  const ctx = context || {};
  if (!category) {
    return { active: false, needs: "category", typ: null };
  }

  const typ = resolveAnfrageTyp(category);

  if (typ === "pakiet") {
    if (!packageIdInList(ctx.packageId, ctx.packages)) {
      return { active: false, needs: "package", typ };
    }
    return { active: true, needs: null, typ };
  }

  if (typ === "kampania") {
    if (!ctx.campaign) {
      return { active: false, needs: "campaign", typ };
    }
    return { active: true, needs: null, typ };
  }

  return { active: true, needs: null, typ };
}

export function canSubmitPublicForm(category, context) {
  return questionnaireActivation(category, context).active;
}
