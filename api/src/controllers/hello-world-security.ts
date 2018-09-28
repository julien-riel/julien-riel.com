import { MongoFindParams } from "../models/mongo-find-params";
import { User } from "../models/user";

/**
 * Cette fonction ajoute des filtres à la requête de lecture en fonction de l'utilisateur connecté
 * @param options
 * @param user
 */
export let readFilter = (options: MongoFindParams, user: User) => {
  // Les deux fonctions ci-dessous sont des exemples.
  // Le citoyen peut seulement voir ses choses
  if (user.userType == "citizen") {
    options.filters.push({ citizenId: user.id });
  }

  // Pour les employés, s'ils ne sont pas admin, ils voient seulement les demandes qui sont soumises
  if (user.userType == "employee") {
    if (!user.roles.find(r => r == "admin")) {
      options.filters.push({ status: "submitted" });
    }
  }
};
