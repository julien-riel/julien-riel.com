export class MongoFindParams {
  public limit: number;
  public skip: number;
  public filters: any[];
  public projection: any;
  public sort: any;
  private hasTextFilter: boolean;

  constructor() {
    this.skip = 0;
    this.limit = 10;
    this.filters = [];
    this.projection = null;
    this.sort = {};

    this.hasTextFilter = false;
  }

  public addTextFilter(query) {
    this.hasTextFilter = true;
    this.filters.push({ $text: { $search: query } });
  }

  public getFilters() {
    if (this.filters.length > 0) {
      return { $and: this.filters };
    }
    return null;
  }
}
