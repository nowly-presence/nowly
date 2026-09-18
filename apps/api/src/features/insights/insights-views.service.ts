import { getPrisma } from "@/db/client"
import type { WidgetConfig } from "@nowly/analytics"

export const listViews = () =>
  getPrisma().insightsView.findMany({ orderBy: { updatedAt: "desc" } })

export const getView = (id: string) =>
  getPrisma().insightsView.findUnique({ where: { id } })

export const createView = (userId: string, name: string, widgets: WidgetConfig[]) =>
  getPrisma().insightsView.create({ data: { createdBy: userId, name, widgets } })

export const updateView = (id: string, name: string, widgets: WidgetConfig[]) =>
  getPrisma().insightsView.updateMany({ where: { id }, data: { name, widgets } })

export const deleteView = (id: string) =>
  getPrisma().insightsView.deleteMany({ where: { id } })
