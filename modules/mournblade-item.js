import { MournbladeUtility } from "./mournblade-utility.js";

export const defaultItemImg = {
    competence: "systems/fvtt-mournblade/assets/icons/competence.webp",  
    arme: "systems/fvtt-mournblade/assets/icons/arme.webp",  
    capacite: "systems/fvtt-mournblade/assets/icons/capacite.webp",  
    don: "systems/fvtt-mournblade/assets/icons/don.webp",  
    equipement: "systems/fvtt-mournblade/assets/icons/equipement.webp",  
    monnaie: "systems/fvtt-mournblade/assets/icons/monnaie.webp",  
    pacte: "systems/fvtt-mournblade/assets/icons/pacte.webp",  
    predilection: "systems/fvtt-mournblade/assets/icons/predilection.webp",  
    protection: "systems/fvtt-mournblade/assets/icons/protection.webp",  
    rune: "systems/fvtt-mournblade/assets/icons/rune.webp",  
    tendance: "systems/fvtt-mournblade/assets/icons/tendance.webp",  
    traitchaotique: "systems/fvtt-mournblade/assets/icons/traitchaotique.webp",  
}

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MournbladeItem extends Item {

  constructor(data, context) {
    if (!data.img) {
      data.img = defaultItemImg[data.type];
    }
    super(data, context);
  }

}
