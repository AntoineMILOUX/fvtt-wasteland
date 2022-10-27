/**
 * Mournblade system
 * Author: Uberwald
 * Software License: Prop
 */

/* -------------------------------------------- */

/* -------------------------------------------- */
// Import Modules
import { MournbladeActor } from "./mournblade-actor.js";
import { MournbladeItemSheet } from "./mournblade-item-sheet.js";
import { MournbladeActorSheet } from "./mournblade-actor-sheet.js";
//import { MournbladeNPCSheet } from "./mournblade-npc-sheet.js";
import { MournbladeUtility } from "./mournblade-utility.js";
import { MournbladeCombat } from "./mournblade-combat.js";
import { MournbladeItem } from "./mournblade-item.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/************************************************************************************/
Hooks.once("init", async function () {
  console.log(`Initializing Mournblade RPG`);

  /* -------------------------------------------- */
  // preload handlebars templates
  MournbladeUtility.preloadHandlebarsTemplates();

  /* -------------------------------------------- */
  // Set an initiative formula for the system 
  CONFIG.Combat.initiative = {
    formula: "1d6",
    decimals: 1
  };

  /* -------------------------------------------- */
  game.socket.on("system.fvtt-mournblade-rpg", data => {
    MournbladeUtility.onSocketMesssage(data);
  });

  /* -------------------------------------------- */
  // Define custom Entity classes
  CONFIG.Combat.documentClass = MournbladeCombat
  CONFIG.Actor.documentClass = MournbladeActor
  CONFIG.Item.documentClass = MournbladeItem
  game.system.mournblade = { }

  /* -------------------------------------------- */
  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("fvtt-mournblade", MournbladeActorSheet, { types: ["personnage"], makeDefault: true })
  //Actors.registerSheet("fvtt-mournblade", MournbladeNPCSheet, { types: ["npc"], makeDefault: false });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("fvtt-mournblade", MournbladeItemSheet, { makeDefault: true })

  MournbladeUtility.init();
  
});

/* -------------------------------------------- */
function welcomeMessage() {
  ChatMessage.create({
    user: game.user.id,
    whisper: [game.user.id],
    content: `<div id="welcome-message-Mournblade"><span class="rdd-roll-part">
    <strong>Bienvenue dans les Jeunes Royaumes de Mournblade !</strong>
    <p>Les livres de Mournblade sont nécessaires pour jouer : https://www.titam-france.fr</p>
    <p>Mournblade est jeude rôle publié par Titam France/Sombres projets, tout les droits leur appartiennent.<p>
    ` });
}

/* -------------------------------------------- */
// Register world usage statistics
function registerUsageCount( registerKey ) {
  if ( game.user.isGM ) {
    game.settings.register(registerKey, "world-key", {
      name: "Unique world key",
      scope: "world",
      config: false,
      default: "",
      type: String
    });

    let worldKey = game.settings.get(registerKey, "world-key")
    if ( worldKey == undefined || worldKey == "" ) {
      worldKey = randomID(32)
      game.settings.set(registerKey, "world-key", worldKey )
    }
    // Simple API counter
    let regURL = `https://www.uberwald.me/fvtt_appcount/count.php?name="${registerKey}"&worldKey="${worldKey}"&version="${game.release.generation}.${game.release.build}"&system="${game.system.id}"&systemversion="${game.system.version}"`
    //$.ajaxSetup({
      //headers: { 'Access-Control-Allow-Origin': '*' }
    //})
    $.ajax(regURL)
  }
}

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once("ready", function () {

  MournbladeUtility.ready();
  // User warning
  if (!game.user.isGM && game.user.character == undefined) {
    ui.notifications.info("Attention ! Aucun personnage n'est relié au joueur !");
    ChatMessage.create({
      content: "<b>ATTENTION</b> Le joueur  " + game.user.name + " n'est relié à aucun personnage !",
      user: game.user._id
    });
  }
  
  // CSS patch for v9
  if (game.version) {
    let sidebar = document.getElementById("sidebar");
    sidebar.style.width = "min-content";
  }
  registerUsageCount('fvtt-mournblade')
  welcomeMessage();
});

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.on("chatMessage", (html, content, msg) => {
  if (content[0] == '/') {
    let regExp = /(\S+)/g;
    let commands = content.match(regExp);
    if (game.system.mournblade.commands.processChatCommand(commands, content, msg)) {
      return false;
    }
  }
  return true;
});

