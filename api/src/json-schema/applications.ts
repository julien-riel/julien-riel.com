export default {
  $id: "https://example.com/person.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Person",
  type: "object",
  required: ["status", "firstName", "lastName", "citizenId", "assetId"],
  properties: {
    status: {
      type: "string",
      description: "Le statut de la demande"
    },
    firstName: { type: "string" },
    lastName: { type: "string" },
    description: { type: "string" },
    approbation: {
      type: "object",
      properties: {
        isApproved: { type: "boolean" },
        approvedBy: { type: "string" },
        approvedOn: { type: "string" }
      }
    },
    citizenId: {
      type: "string",
      description: "L'id du citoyen qui fait la demande"
    },
    assetId: {
      description: "Un numéro d'actif. Doit être un nombre entier positif",
      type: "integer",
      minimum: 0
    }
  }
};
