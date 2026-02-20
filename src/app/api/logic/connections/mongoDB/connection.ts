import mongoose, { Model, QueryFilter, UpdateQuery } from "mongoose";

export type WithId<T> = T & { _id: unknown };

// Repositorio genérico reusable para cualquier class T
export class Repository<T extends object> {
  constructor(private readonly M: Model<T>) {}

  // Insert genérico (acepta Partial<T> para permitir defaults)
  async insert(data: Partial<T>): Promise<WithId<T>> {
    const doc = await this.M.create(data);
    return doc.toObject() as WithId<T>;
  }

  // async insertMany(data: Array<Partial<T>>): Promise<Array<WithId<T>>> {
  //   const docs = await this.M.insertMany(data);
  //   return docs.map((d: any) =>
  //     typeof d.toObject === "function" ? d.toObject() : d,
  //   ) as Array<WithId<T>>;
  // }

  async findOne(filter: QueryFilter<T>): Promise<WithId<T> | null> {
    const doc = await this.M.findOne(filter).lean();
    return doc as WithId<T> | null;
  }

  async find(filter?: QueryFilter<T> | null): Promise<Array<WithId<T>>> {
    const hasFilter =
      filter &&
      typeof filter === "object" &&
      Object.keys(filter as object).length > 0;

    const docs = await this.M.find(hasFilter ? filter : {}).lean();
    return docs as Array<WithId<T>>;
  }

  async updateOne(filter: QueryFilter<T>, update: UpdateQuery<T>) {
    return this.M.updateOne(filter, update);
  }

  async delete(filter: QueryFilter<T>) {
    return this.M.deleteMany(filter);
  }

  // async deleteOne(filter: QueryFilter<T>) {
  //   return this.M.deleteOne(filter);
  // }
}

export class ConnectionMongo {
  private static isConnected = false;

  constructor() {}

  private async connect(): Promise<void> {
    if (ConnectionMongo.isConnected) return;

    await mongoose.connect(process.env.MONGO_CONNECTION_STRING as string);
    ConnectionMongo.isConnected = true;
  }

  private repo<T extends object>(M: Model<T>) {
    return new Repository<T>(M);
  }

  public async insert<T extends object>(
    M: Model<T>,
    body: Partial<T>,
  ): Promise<string | null> {
    await this.connect();
    const doc = await M.create(body);
    return doc ? (doc._id as string) : null;
  }

  public async update<T extends object>(
    M: Model<T>,
    body: Partial<T>,
    filter: QueryFilter<T>,
  ) {
    await this.connect();
    const r = this.repo<T>(M);
    return r.updateOne(filter, body);
  }

  public async getOne<T extends object>(M: Model<T>, filter: QueryFilter<T>) {
    await this.connect();
    const r = this.repo<T>(M);

    const result = await r.findOne(filter);

    return result;
  }

  public async find<T extends object>(
    M: Model<T>,
    filter?: QueryFilter<T> | null,
  ) {
    await this.connect();
    const r = this.repo<T>(M);

    return r.find(filter);
  }

  public async delete<T extends object>(M: Model<T>, filter: QueryFilter<T>) {
    await this.connect();
    const r = this.repo<T>(M);
    return r.delete(filter);
  }
}
