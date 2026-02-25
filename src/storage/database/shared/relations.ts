import { relations } from "drizzle-orm/relations";
import { users, memoriesV2, selfModelsV2, systemStatesV2 } from "./schema";

export const memoriesV2Relations = relations(memoriesV2, ({one}) => ({
	user: one(users, {
		fields: [memoriesV2.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	memoriesV2s: many(memoriesV2),
	selfModelsV2s: many(selfModelsV2),
	systemStatesV2s: many(systemStatesV2),
}));

export const selfModelsV2Relations = relations(selfModelsV2, ({one}) => ({
	user: one(users, {
		fields: [selfModelsV2.userId],
		references: [users.id]
	}),
}));

export const systemStatesV2Relations = relations(systemStatesV2, ({one}) => ({
	user: one(users, {
		fields: [systemStatesV2.userId],
		references: [users.id]
	}),
}));