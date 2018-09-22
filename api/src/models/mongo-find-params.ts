export class MongoFindParams {
  public limit: number;
  public skip: number;
  public filters: any[];
  public projection: any;
  public sort: any;

  constructor() {
    this.skip = 0;
    this.limit = 10;
    this.filters = [];
    this.projection = null;
    this.sort = {};
  }

  public getFilters() {
    return { $and: this.filters };
  }
}
