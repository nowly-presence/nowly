import { RiHomeLine, RiSettings3Line } from "@remixicon/react"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Switch } from "@/ui/switch"

// Temporary design-system demo screen, replaced by the real navigation shell
// once the background foundations and hooks land.
export const App = (): React.JSX.Element => {
  return (
    <div className="flex h-dvh flex-col gap-4 overflow-y-auto bg-background p-4 text-foreground">
      <Card>
        <CardHeader>
          <CardTitle>Nowly</CardTitle>
          <CardDescription>Refonte en cours — démo du design system.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button>
            <RiHomeLine /> Default
          </Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost" size="icon">
            <RiSettings3Line />
          </Button>
          <Button variant="destructive">Destructive</Button>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex items-center justify-between">
          <span className="text-sm">Présence active</span>
          <div className="flex items-center gap-2">
            <Badge>Connecté</Badge>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
