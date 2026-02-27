import { relations } from "drizzle-orm/relations";
import { users, memoriesV2, connectionsV2, selfModelsV2, neuronsV2, systemStatesV2 } from "./schema";

export const memoriesV2Relations = relations(memoriesV2, ({one}) => ({
	user: one(users, {
		fields: [memoriesV2.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	memoriesV2s: many(memoriesV2),
	connectionsV2s: many(connectionsV2),
	selfModelsV2s: many(selfModelsV2),
	neuronsV2s: many(neuronsV2),
	systemStatesV2s: many(systemStatesV2),
}));

export const connectionsV2Relations = relations(connectionsV2, ({one}) => ({
	user: one(users, {
		fields: [connectionsV2.userId],
		references: [users.id]
	}),
}));

export const selfModelsV2Relations = relations(selfModelsV2, ({one}) => ({
	user: one(users, {
		fields: [selfModelsV2.userId],
		references: [users.id]
	}),
}));

export const neuronsV2Relations = relations(neuronsV2, ({one}) => ({
	user: one(users, {
		fields: [neuronsV2.userId],
		references: [users.id]
	}),
}));

export const systemStatesV2Relations = relations(systemStatesV2, ({one}) => ({
	user: one(users, {
		fields: [systemStatesV2.userId],
		references: [users.id]
	}),
}));