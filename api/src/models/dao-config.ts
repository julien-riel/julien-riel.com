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

  sortParams: SortParams[];
}

export interface FullTextSearchParams {
  enable: boolean;
  indexedFields: string[];
}

export interface SortParams {
  name: string;
  excluded: boolean;
}

export interface GeometrySearchParams {
  enable: boolean;
  path: string;
}

export interface AuditParams {
  enable: boolean;
  history: {
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
