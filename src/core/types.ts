// Typed surface for the ported core logic.
// The YAML boundary is dynamic, so several fields are intentionally permissive
// (string | number, or unknown) rather than over-constrained.

export interface ModelDataComponent {
  colors: string[];
  flags: string[];
  floats: string[];
  strings: string[];
}

export interface GuiItem {
  material: string;
  data: number | string;
  displayname?: string;
  lore?: string[];
  slots?: string[];
  item_model?: string;
  model_data?: number | string;
  model_data_component?: ModelDataComponent;
}

export interface AdvancedItemFields {
  item_model?: string;
  model_data?: number | string;
  model_data_component?: ModelDataComponent;
}

export interface Category extends AdvancedItemFields {
  order: number | string;
  item: string;
  name: string;
  lore: string[];
  gui_name: string;
}

export interface Tag extends AdvancedItemFields {
  order: number | string;
  category: string;
  tag: string;
  displayname: string;
  description: string[];
  item: string;
  data: number | string;
  permission: string;
}

export interface FormatChat {
  enabled: boolean;
  format: string;
}

export interface Gui {
  tag_availability_placeholder: {
    has_permission: string;
    no_permission: string;
  };
  name: string;
  size: number | string;
  tag_slots: string[];
  tag_visible_item: GuiItem;
  // Static item keys (divider_item, has_tag_item, ...) plus any other GUI item.
  [key: string]: unknown;
}

export interface Config {
  use_minimessage: boolean;
  force_tags: boolean;
  check_updates: boolean;
  legacy_hex: boolean;
  papi_chat: boolean;
  format_chat: FormatChat;
  load_tag_on_join: boolean;
  gui: Gui;
  categories: Record<string, Category>;
  deluxetags: Record<string, Tag>;
  __unknownTopLevel: Record<string, unknown>;
}

export interface Preview {
  page: number;
  screen: string;
  category: string;
  playerName: string;
  displayName: string;
  activeTagId: string;
  permissionMode: string;
  unlockedTags: Record<string, boolean>;
  showLockedTags: boolean;
  iconTemplate: string;
  /** When false, the preview shows literal %placeholder% text instead of resolved values. */
  parsePlaceholders: boolean;
}

export interface PreviewItemRef {
  kind: string;
  id: string;
}

export interface PreviewItem {
  type: string;
  material: string;
  data: number | string;
  displayname: string;
  lore: string[];
  tagText: string;
  selected: boolean;
  canSelect: boolean;
  ref: PreviewItemRef | null;
}

export interface PreviewResult {
  screen: string;
  title: string;
  page: number;
  pages: number;
  slots: Array<PreviewItem | null>;
  categoryIdentifier: string;
}

export interface Issue {
  severity: 'error' | 'warning';
  message: string;
  path: string;
}

export interface ValidationResult {
  issues: Issue[];
  errors: Issue[];
  warnings: Issue[];
  ok: boolean;
}

export interface StyleState {
  color: string | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  obfuscated: boolean;
}

export interface FormatSegment {
  text: string;
  style: StyleState;
}
