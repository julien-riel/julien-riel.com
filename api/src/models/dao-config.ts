export interface DAOConfig {
  /**
   * Le nom de la connection dans mongodb
   */
  collectionName: string;

  /**
   * Indique si la clé primaire est de type ObjectId
   */
  useObjectId: boolean;

  /**
   * Le json schema de l'objet à persister. Il ne s'agit pas de règle de validation métier mais de validation de stockage
   */
  jsonSchema: any;

  sortParams: SortParams;
  fullTextSearch: FullTextSearchParams;
  audit: AuditParams;
  version: VersionParams;
}

export interface FullTextSearchParams {
  enable: boolean;
}

export interface SortParams {
  allFields: boolean; // Tous les champs du schema sont triables
  sortableFields?: string[]; // Liste obligatoire si allFields est false. Indique sur quels champs on peut trier
  sortableIndexes?: string[]; // À utiliser quand des indexes COMPOSÉS sont définis dans la collection.
}

// https://msdn.microsoft.com/en-us/library/ff701711.aspx
export interface GeometrySearchParams {
  enable: boolean;
  path: string; // Le nom du champ pour lequel on fait la requête
}

export interface AuditParams {
  enable: boolean; // Des méta-données d'audit seont ajoutés dans un sous-objet audit {createdAt, createdBy, modifiedAt, modifiedBy}
  history?: {
    enable: boolean;
    mongo: {
      connectionString?: string;
      collectionName: string;
    };
  };
}

export interface VersionParams {
  enable: boolean;
}

export interface SecurityParams {
  // Ownership
}
