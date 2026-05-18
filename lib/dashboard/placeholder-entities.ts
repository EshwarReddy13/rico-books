export type NavEntity = {
  id: string;
  name: string;
};

/** Placeholder until entities are loaded from the database */
export const PLACEHOLDER_ENTITIES: NavEntity[] = [
  { id: "agency", name: "Agency" },
  { id: "ecommerce", name: "E-commerce" },
  { id: "trading", name: "Trading" },
];

export const ADD_NEW_ENTITY_ID = "__add_new_entity__";
