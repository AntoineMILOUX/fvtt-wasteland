import { WastelandUtility } from "./wasteland-utility.js";

/* -------------------------------------------- */
export class WastelandCombat extends Combat {
  
  /* -------------------------------------------- */
  async rollInitiative(ids, formula = undefined, messageOptions = {} ) {
    ids = typeof ids === "string" ? [ids] : ids;
    for (let cId = 0; cId < ids.length; cId++) {
      const c = this.combatants.get(ids[cId]);
      let id = c._id || c.id;
      let initBonus = c.actor ? c.actor.getInitiativeScore() : 0
      let roll = new Roll("1d10 + "+initBonus).roll({ async: false})      
      await WastelandUtility.showDiceSoNice(roll, game.settings.get("core", "rollMode"))
      //console.log("Init bonus", initBonus, roll.total)
      await this.updateEmbeddedDocuments("Combatant", [ { _id: id, initiative: roll.total } ]);
    }

    return this;
  }

  /* -------------------------------------------- */
  _onUpdate(changed, options, userId) {
  }


}
