const assert = require("assert");
const yaml = require("./vendor/js-yaml.min.js");
const core = require("./app-core.js");

Promise.resolve().then(() => {
  const legacy = core.normalizeImportedConfig({
    deluxetags: {
      vip: {
        order: 1,
        category: "all",
        tag: "&6VIP",
        description: "&7Legacy description"
      }
    },
    categories: {
      general: {
        order: 1,
        item: "NAME_TAG",
        name: "&6General",
        lore: ["&7General tags"],
        gui_name: "&6General tags"
      }
    },
    gui: {
      tag_select_item: {
        material: "DIAMOND",
        data: 3,
        displayname: "&6Legacy &f%deluxetags_identifier%",
        lore: ["%deluxetags_tag%", "%deluxetags_description%", "&7Click"]
      }
    },
    tag_availability_placeholder: {
      has_permission: "&aAllowed",
      no_permission: "&cNope"
    },
    custom_section: {
      enabled: true
    }
  });

  assert.strictEqual(legacy.gui.tag_availability_placeholder.has_permission, "&aAllowed");
  assert.strictEqual(legacy.gui.tag_availability_placeholder.no_permission, "&cNope");
  assert.strictEqual(legacy.deluxetags.vip.category, "general");
  assert.strictEqual(legacy.deluxetags.vip.displayname, "&6Legacy &f%deluxetags_identifier%");
  assert.deepStrictEqual(legacy.deluxetags.vip.description, [
    "%deluxetags_tag%",
    "&7Legacy description",
    "&7Click"
  ]);
  assert.strictEqual(legacy.deluxetags.vip.item, "DIAMOND");
  assert.strictEqual(legacy.deluxetags.vip.data, 3);

  const exported = core.buildExportObject(legacy, "full");
  assert.deepStrictEqual(Object.keys(exported), [
    "use_minimessage",
    "force_tags",
    "check_updates",
    "legacy_hex",
    "papi_chat",
    "format_chat",
    "load_tag_on_join",
    "gui",
    "categories",
    "deluxetags",
    "custom_section"
  ]);

  const slotResult = core.parseSlotList(["0-2", "8"], 9);
  assert.deepStrictEqual(slotResult.slots, [0, 1, 2, 8]);
  assert.deepStrictEqual(slotResult.issues, []);
  assert.ok(core.parseSlotList(["5-3", "nope", "99"], 9).issues.length >= 3);

  const duplicate = core.normalizeImportedConfig({
    deluxetags: {
      one: { order: 1, tag: "&aOne" },
      two: { order: 1, tag: "&bTwo" }
    }
  });
  const duplicateValidation = core.validateConfig(duplicate);
  assert.ok(duplicateValidation.errors.some((issue) => issue.message.includes("both use order 1")));

  const aliasConfig = core.normalizeImportedConfig({
    categories: {
      general: {
        order: 1,
        item: "minecraft:player-head",
        name: "&6General",
        lore: ["&7General tags"],
        gui_name: "&6General tags"
      }
    },
    deluxetags: {
      heady: {
        order: 1,
        category: "general",
        tag: "&eHead",
        item: "player-head"
      }
    }
  });
  const aliasValidation = core.validateConfig(aliasConfig);
  assert.strictEqual(aliasConfig.categories.general.item, "PLAYER_HEAD");
  assert.strictEqual(aliasConfig.deluxetags.heady.item, "PLAYER_HEAD");
  assert.strictEqual(core.materialToTextureId("minecraft:player-head"), "player_head");
  assert.strictEqual(core.iconCandidates("minecraft:player-head")[0].includes("/entity/player/wide/steve.png"), true);
  assert.ok(!aliasValidation.warnings.some((issue) => issue.path === "categories.general.item"));
  assert.ok(!aliasValidation.warnings.some((issue) => issue.path === "deluxetags.heady.item"));

  const context = {
    playerName: "Alex",
    displayName: "AlexTheGreat",
    tag: {
      identifier: "vip",
      tag: "&6VIP",
      description: ["&7Line one"]
    },
    currentTag: null,
    amount: 4,
    categoryAmount: 2,
    canSelect: true,
    page: 2,
    hasNextPage: true
  };
  assert.strictEqual(
    core.replacePlaceholders("%player% %displayname% %deluxetags_identifier% %deluxetags_amount% %current_page% %next_page%", context, legacy),
    "Alex AlexTheGreat vip 4 2 3"
  );

  const legacySegments = core.formatTextSegments("&aHi &lVIP", legacy);
  assert.strictEqual(legacySegments[0].style.color, "#55ff55");
  assert.strictEqual(legacySegments[1].style.bold, true);

  const miniConfig = core.normalizeImportedConfig({
    use_minimessage: true,
    deluxetags: {
      vip: { order: 1, tag: "<red><bold>VIP</bold>" }
    }
  });
  const miniSegments = core.formatTextSegments("<red><bold>VIP</bold>", miniConfig);
  assert.strictEqual(miniSegments[0].style.color, "#ff5555");
  assert.strictEqual(miniSegments[0].style.bold, true);

  const nestedMiniSegments = core.formatTextSegments("<red>A <bold>B</bold> C</red>", miniConfig);
  assert.strictEqual(nestedMiniSegments[2].text, " C");
  assert.strictEqual(nestedMiniSegments[2].style.color, "#ff5555");
  assert.strictEqual(nestedMiniSegments[2].style.bold, false);
  const colorTagSegments = core.formatTextSegments("<color:red>A</color> B", miniConfig);
  assert.strictEqual(colorTagSegments[0].style.color, "#ff5555");
  assert.strictEqual(colorTagSegments[1].style.color, null);
  assert.strictEqual(core.formatTextSegments("<c:red>A</color> B", miniConfig)[1].style.color, null);

  const legacyHexMini = core.normalizeImportedConfig({
    use_minimessage: true,
    legacy_hex: true
  });
  assert.strictEqual(core.formatTextSegments("<#ff0000>X", legacyHexMini)[0].style.color, "#ff0000");

  const dumpedTags = core.dumpConfigYaml(legacy, yaml, "tags");
  const parsedTags = yaml.load(dumpedTags);
  assert.deepStrictEqual(Object.keys(parsedTags), ["deluxetags"]);
  assert.strictEqual(parsedTags.deluxetags.vip.permission, "deluxetags.tag.vip");

  assert.ok(core.iconCandidates("BLACK_STAINED_GLASS_PANE")[0].includes("/block/black_stained_glass.png"));
  assert.ok(core.iconCandidates("PLAYER_HEAD").some((url) => url.includes("/entity/player/wide/steve.png")));

  const preview = core.buildPreview(legacy, {
    ...core.DEFAULT_PREVIEW,
    activeTagId: "vip"
  });
  assert.ok(preview.slots.length >= 9);
  assert.ok(preview.title.length <= 32);
  const previewTag = preview.slots.find((slot) => slot?.ref?.kind === "tag");
  assert.strictEqual(previewTag.ref.id, "vip");
  assert.strictEqual(previewTag.tagText, "&6VIP");

  console.log("app-core tests passed");
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
