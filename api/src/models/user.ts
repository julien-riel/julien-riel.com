export interface User {
  userType: "citizen" | "entreprise" | "employee";
  id: string;
  roles: string[];

  // Pour les entreprises - Provient du service d'authentification? TBD
  organisations?: {id:string; name:string;}[];

  // Pour les citoyens -  Provient du service d'authentification? TBD
  famillyMembers?: {id:string; name:string;}[];
}
