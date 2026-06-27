const SUPPORT_EMAIL_FROM = "Nowly <no-reply@nowly.me>"
const SUPPORT_EMAIL_REPLY_TO = "contact@nowly.me"

import { serverEnv } from "@nowly/env/server"
import { createEmailClient, type EmailClient } from "@opencoredev/email-sdk"
import { ses } from "@opencoredev/email-sdk/ses"
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  render,
  Section,
  Text,
} from "react-email"
import type { CSSProperties, ReactElement } from "react"

const YELLOW = "#FEE961"
const ACCENT = "#22D3EE"
const BG_BODY = "#F4F4F5"
const BG_CARD = "#FFFFFF"
const BG_SURFACE = "#FAFAFA"
const BORDER = "rgba(0, 0, 0, 0.08)"
const TEXT_PRIMARY = "#18181B"
const TEXT_SECONDARY = "#52525B"
const TEXT_MUTED = "#71717A"
const TEXT_FOOTER = "#A1A1AA"

const redeemUrl = (): string =>
  serverEnv.SUPPORT_REDEEM_URL ?? `${serverEnv.FRONTEND_URL.replace(/\/$/, "")}/support/redeem`

let emailClient: EmailClient | null = null

const getEmailClient = (): EmailClient | null => {
  if (!serverEnv.AWS_ACCESS_KEY_ID || !serverEnv.AWS_SECRET_ACCESS_KEY || !serverEnv.AWS_REGION) return null

  emailClient ??= createEmailClient({
    adapters: [
      ses({
        accessKeyId: serverEnv.AWS_ACCESS_KEY_ID,
        secretAccessKey: serverEnv.AWS_SECRET_ACCESS_KEY,
        region: serverEnv.AWS_REGION,
      }),
    ],
    defaultAdapter: "ses",
    retry: { retries: 1 },
  })

  return emailClient
}

const formatDonation = (amount: string | undefined, currency: string | undefined): string | undefined => {
  if (!amount) return undefined
  return [amount, currency?.toUpperCase()].filter(Boolean).join(" ")
}

export type SupporterPassEmailInput = {
  to?: string
  donorName?: string
  code: string
  provider: "kofi" | "github" | "manual"
  amount?: string
  currency?: string
}

export type SupporterPassEmailResult =
  | { sent: true; id?: string }
  | { sent: false; reason: "missing_recipient" | "not_configured" | "send_failed"; error?: string }

export const SupporterPassEmail = ({
  code,
  donorName,
  provider,
  amount,
  currency,
}: SupporterPassEmailInput): ReactElement => {
  const name = donorName?.trim()
  const donation = formatDonation(amount, currency)
  const activationUrl = redeemUrl()
  const providerLabel = provider === "github" ? "GitHub Sponsors" : provider === "kofi" ? "Ko-fi" : "Nowly"

  return (
    <Html lang="en">
      <Head />

      <Preview>Thank you for your donation. Here is your Nowly supporter pass key.</Preview>

      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          <Section style={headerSectionStyle}>
            <Img
              src="https://cdn.nowly.me/assets/app_title_dark.png"
              width="160"
              height="45"
              alt="Nowly"
              style={logoStyle}
            />
          </Section>

          <Section style={boxStyle}>
            <table cellPadding="0" cellSpacing="0" style={tableStyle}>
              <tr>
                <td align="center" style={titleCellStyle}>
                  <Heading style={titleStyle}>Wow, you&apos;re incredible!</Heading>
                </td>
              </tr>

              <tr>
                <td style={contentCellStyle}>
                  <Text style={greetingStyle}>
                    Dear{name ? ` ${name}` : " supporter"},
                  </Text>
                  <Text style={bodyTextStyle}>
                    Thank you for your donation. No matter the amount, your support means a lot and helps us keep building Nowly. Here is your supporter pass key:
                  </Text>

                  <table cellPadding="0" cellSpacing="0" style={detailTableStyle}>
                    <tr>
                      <td style={detailLabelStyle}>Donation via</td>
                      <td style={detailValueStyle}>{providerLabel}</td>
                    </tr>
                    {donation && (
                      <tr>
                        <td style={detailLabelStyle}>Amount</td>
                        <td style={detailValueStyle}>{donation}</td>
                      </tr>
                    )}
                  </table>

                  <Text style={codeLabelStyle}>Your supporter key</Text>
                  <Text style={codeStyle}>{code}</Text>

                  <Button href={activationUrl} style={buttonStyle}>
                    Activate the key
                  </Button>

                  <Text style={helpTextStyle}>
                    Go to the Nowly Discord server and use the <strong style={strongStyle}>/donator</strong> command with your key as command argument.
                  </Text>
                </td>
              </tr>

              <tr>
                <td style={helpRowStyle}>
                    <Text style={helpFooterStyle}>
                      If you have any problems with the activation, please visit our{" "}
                      <Link href="https://nowly.me/support" style={linkBoldStyle}>support page</Link>.
                    </Text>
                </td>
              </tr>
            </table>
          </Section>

          <Hr style={hrStyle} />

          <Section style={footerSectionStyle}>
            <table cellPadding="0" cellSpacing="0" style={socialTableStyle}>
              <tr>
                <td style={socialCellStyle}>
                  <Link href="https://github.com/nowly-presence/nowly" style={socialLinkStyle}>
                    <Img src="https://cdn.simpleicons.org/github/A1A1AA" width="24" height="24" alt="GitHub" style={socialIconStyle} />
                  </Link>
                </td>
                <td style={socialCellStyle}>
                  <Link href="https://discord.gg/MnZap7czgB" style={socialLinkStyle}>
                    <Img src="https://cdn.simpleicons.org/discord/A1A1AA" width="24" height="24" alt="Discord" style={socialIconStyle} />
                  </Link>
                </td>
              </tr>
            </table>

            <Text style={footerTextStyle}>
              If you have any questions, feel free to message us at{" "}
              <Link href="mailto:contact@nowly.me" style={linkBoldStyle}>contact@nowly.me</Link>.
            </Text>

            <Text style={footerTextStyle}>
              You are receiving this email because you made a donation to Nowly.
            </Text>

            <Text style={footerCopyStyle}>
              Copyright &copy; {new Date().getFullYear()} Nowly. All rights reserved.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

export const sendSupporterPassEmail = async (input: SupporterPassEmailInput): Promise<SupporterPassEmailResult> => {
  const to = input.to?.trim()
  if (!to) return { sent: false, reason: "missing_recipient" }

  const client = getEmailClient()
  if (!client) {
    return { sent: false, reason: "not_configured" }
  }

  try {
    const email = <SupporterPassEmail {...input} to={to} />
    const [html, text] = await Promise.all([
      render(email),
      render(email, { plainText: true }),
    ])

    const result = await client.send({
      from: SUPPORT_EMAIL_FROM,
      to,
      replyTo: SUPPORT_EMAIL_REPLY_TO,
      subject: "Your Nowly supporter pass key",
      html,
      text,
      headers: {
        "X-Nowly-Email": "supporter-pass",
      },
      tags: [
        { name: "type", value: "supporter-pass" },
        { name: "provider", value: input.provider },
      ],
    }, {
      idempotencyKey: `supporter-pass:${input.provider}:${input.code}`,
    })

    return { sent: true, id: result.messageId ?? result.id }
  } catch (error) {
    return { sent: false, reason: "send_failed", error: error instanceof Error ? error.message : "Unknown email error" }
  }
}

const bodyStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  backgroundColor: BG_BODY,
  color: TEXT_SECONDARY,
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontSize: "15px",
  lineHeight: "160%",
  WebkitFontSmoothing: "antialiased",
}

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "640px",
  margin: "0 auto",
  padding: "32px 18px",
}

const headerSectionStyle: CSSProperties = {
  padding: "0 0 24px",
}

const logoStyle: CSSProperties = {
  display: "block",
  margin: "0 auto",
}

const boxStyle: CSSProperties = {
  backgroundColor: BG_CARD,
  borderRadius: "12px",
  border: `1px solid ${BORDER}`,
}

const tableStyle = {
  borderCollapse: "collapse" as const,
  width: "100%",
}

const titleCellStyle = {
  padding: "32px 48px 0",
}

const titleStyle: CSSProperties = {
  margin: 0,
  color: TEXT_PRIMARY,
  fontSize: "28px",
  lineHeight: "126%",
  fontWeight: 700,
  textAlign: "center",
}

const contentCellStyle = {
  padding: "24px 48px 0",
}

const greetingStyle: CSSProperties = {
  margin: "0 0 16px",
  color: TEXT_SECONDARY,
}

const bodyTextStyle: CSSProperties = {
  margin: "0 0 20px",
  color: TEXT_SECONDARY,
}

const detailTableStyle = {
  borderCollapse: "collapse" as const,
  width: "100%",
  marginBottom: "20px",
}

const detailLabelStyle: CSSProperties = {
  padding: "4px 12px 4px 0",
  color: TEXT_MUTED,
  fontSize: "13px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  width: "1%",
  whiteSpace: "nowrap" as const,
}

const detailValueStyle: CSSProperties = {
  padding: "4px 0",
  color: TEXT_PRIMARY,
  fontSize: "15px",
}

const codeLabelStyle: CSSProperties = {
  margin: "0 0 8px",
  color: TEXT_MUTED,
  fontSize: "13px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
}

const codeStyle: CSSProperties = {
  margin: "0",
  padding: "14px 16px",
  borderRadius: "8px",
  backgroundColor: "#F4F4F5",
  border: `1px solid ${BORDER}`,
  color: TEXT_PRIMARY,
  fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
  fontSize: "18px",
  lineHeight: "26px",
  fontWeight: 700,
  textAlign: "center",
  letterSpacing: "0.5px",
}

const buttonStyle: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "22px",
  padding: "13px 18px",
  borderRadius: "8px",
  backgroundColor: YELLOW,
  color: "#08090C",
  fontSize: "15px",
  lineHeight: "20px",
  fontWeight: 600,
  textAlign: "center",
  textDecoration: "none",
  boxSizing: "border-box",
}

const helpTextStyle: CSSProperties = {
  margin: "18px 0 0",
  color: TEXT_SECONDARY,
  fontSize: "14px",
  lineHeight: "23px",
}

const strongStyle: CSSProperties = {
  fontWeight: 600,
}

const helpRowStyle = {
  padding: "8px 48px 32px",
}

const helpFooterStyle: CSSProperties = {
  margin: 0,
  color: TEXT_MUTED,
  fontSize: "13px",
}

const hrStyle: CSSProperties = {
  margin: "28px 0 20px",
  borderColor: BORDER,
}

const footerSectionStyle: CSSProperties = {
  textAlign: "center",
  padding: "0 0 20px",
}

const socialTableStyle = {
  borderCollapse: "collapse" as const,
  width: "auto",
  margin: "0 auto",
}

const socialCellStyle = {
  padding: "0 8px",
}

const socialLinkStyle: CSSProperties = {
  textDecoration: "none",
}

const socialIconStyle: CSSProperties = {
  display: "block",
}

const footerTextStyle: CSSProperties = {
  margin: "6px 0 0",
  color: TEXT_FOOTER,
  fontSize: "12px",
  lineHeight: "18px",
  textAlign: "center",
}

const footerCopyStyle: CSSProperties = {
  margin: "8px 0 0",
  color: TEXT_FOOTER,
  fontSize: "12px",
  lineHeight: "20px",
  textAlign: "center",
}

const linkStyle: CSSProperties = {
  color: ACCENT,
  textDecoration: "underline",
}

const linkBoldStyle: CSSProperties = {
  color: TEXT_MUTED,
  textDecoration: "underline",
  fontWeight: 600,
}
