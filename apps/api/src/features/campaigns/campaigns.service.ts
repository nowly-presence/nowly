import { getPrisma } from "@/db/client"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const listCampaigns = async () => {
  const campaigns = await getPrisma().campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { signups: true } } },
  })
  return campaigns.map(({ _count, ...campaign }) => ({ ...campaign, signupCount: _count.signups }))
}

export const createCampaign = (name: string) =>
  getPrisma().campaign.create({ data: { name } })

export const getCampaign = (id: string) =>
  getPrisma().campaign.findUnique({ where: { id } })

export const listSignups = (campaignId: string) =>
  getPrisma().campaignSignup.findMany({ where: { campaignId }, orderBy: { createdAt: "desc" } })

export const recordSignup = async (campaignId: string, email: string): Promise<{ ok: boolean }> => {
  const trimmed = email.trim().toLowerCase()
  if (trimmed.length > 254 || !EMAIL_RE.test(trimmed)) return { ok: false }

  const campaign = await getCampaign(campaignId)
  if (!campaign || !campaign.active) return { ok: false }

  await getPrisma().campaignSignup.upsert({
    where: { campaignId_email: { campaignId, email: trimmed } },
    create: { campaignId, email: trimmed },
    update: {},
  })
  return { ok: true }
}
