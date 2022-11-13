import { WastelandUtility } from "./wasteland-utility.js";

export const defaultItemImg = {
    competence: "systems/fvtt-wasteland/assets/icons/competence.webp",  
    savoir: "systems/fvtt-wasteland/assets/icons/competence.webp",  
    arme: "systems/fvtt-wasteland/assets/icons/arme.webp",  
    capacite: "systems/fvtt-wasteland/assets/icons/capacite.webp",  
    don: "systems/fvtt-wasteland/assets/icons/don.webp",  
    equipement: "systems/fvtt-wasteland/assets/icons/equipement.webp",  
    monnaie: "systems/fvtt-wasteland/assets/icons/monnaie.webp",  
    pacte: "systems/fvtt-wasteland/assets/icons/pacte.webp",  
    predilection: "systems/fvtt-wasteland/assets/icons/predilection.webp",  
    protection: "systems/fvtt-wasteland/assets/icons/protection.webp",  
    traitchaotique: "systems/fvtt-wasteland/assets/icons/traitchaotique.webp",  
}

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class WastelandItem extends Item {

  constructor(data, context) {
    if (!data.img) {
      data.img = defaultItemImg[data.type];
    }
    super(data, context);
  }

}
