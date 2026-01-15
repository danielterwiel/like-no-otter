import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import * as schema from "./schema";

const DATABASE_NAME = "likenootter.db";

const expo = SQLite.openDatabaseSync(DATABASE_NAME);

export const db = drizzle(expo, { schema });

export type Database = typeof db;
