/**
 * Wasteland system
 * Author: Uberwald
 * Software License: Prop
 */

/* -------------------------------------------- */

/* -------------------------------------------- */
// Import Modules
import { WastelandActor } from "./wasteland-actor.js";
import { WastelandItemSheet } from "./wasteland-item-sheet.js";
import { WastelandActorSheet } from "./wasteland-actor-sheet.js";
//import { WastelandNPCSheet } from "./wasteland-npc-sheet.js";
import { WastelandUtility } from "./wasteland-utility.js";
import { WastelandCombat } from "./wasteland-combat.js";
import { WastelandItem } from "./wasteland-item.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/************************************************************************************/
Hooks.once("init", async function () {
  console.log(`Initializing Wasteland RPG`);

  /* -------------------------------------------- */
  // preload handlebars templates
  WastelandUtility.preloadHandlebarsTemplates();

  /* -------------------------------------------- */
  // Set an initiative formula for the system 
  CONFIG.Combat.initiative = {
    formula: "1d6",
    decimals: 1
  };

  /* -------------------------------------------- */
  game.socket.on("system.fvtt-wasteland-rpg", data => {
    WastelandUtility.onSocketMesssage(data);
  });

  /* -------------------------------------------- */
  // Define custom Entity classes
  CONFIG.Combat.documentClass = WastelandCombat
  CONFIG.Actor.documentClass = WastelandActor
  CONFIG.Item.documentClass = WastelandItem
  game.system.wasteland = { }

  /* -------------------------------------------- */
  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("fvtt-wasteland", WastelandActorSheet, { types: ["personnage"], makeDefault: true })
  //Actors.registerSheet("fvtt-wasteland", WastelandNPCSheet, { types: ["npc"], makeDefault: false });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("fvtt-wasteland", WastelandItemSheet, { makeDefault: true })

  WastelandUtility.init();
  
});

/* -------------------------------------------- */
function welcomeMessage() {
  ChatMessage.create({
    user: game.user.id,
    whisper: [game.user.id],
    content: `<div id="welcome-message-Wasteland"><span class="rdd-roll-part">
    <strong>Bienvenue dans les Jeunes Royaumes de Wasteland !</strong>
    <p>Les livres de Wasteland sont nécessaires pour jouer : https://www.titam-france.fr</p>
    <p>Wasteland est jeude rôle publié par Titam France/Sombres projets, tout les droits leur appartiennent.<p>
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

  WastelandUtility.ready();
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
  registerUsageCount('fvtt-wasteland')
  welcomeMessage();
});

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.on("chatMessage", (html, content, msg) => {
  if (content[0] == '/') {
    let regExp = /(\S+)/g;
    let commands = content.match(regExp);
    if (game.system.wasteland.commands.processChatCommand(commands, content, msg)) {
      return false;
    }
  }
  return true;
});

