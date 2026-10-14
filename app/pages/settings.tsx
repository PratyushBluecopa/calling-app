import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useAppContext } from "~/contexts/app-context";

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="copa:flex copa:items-center copa:justify-between copa:py-3 copa:border-b copa:border-border/50 last:copa:border-0">
      <span className="copa:text-sm copa:text-muted-foreground">{label}</span>
      <span className="copa:text-sm copa:font-medium">{value}</span>
    </div>
  );
}

function CurrencyTab() {
  const { currentWorkspaceSettings } = useAppContext();

  return (
    <div className="copa:grid copa:gap-4 copa:max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>
            Default currency used across reports and transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingRow label="Base currency" value={currentWorkspaceSettings.currency} />
          <SettingRow label="Display format" value="1,234.56" />
          <SettingRow label="Currency position" value="Before amount" />
          <SettingRow label="Decimal places" value="2" />
        </CardContent>
      </Card>
    </div>
  );
}

function NumberSettingsTab() {
  const { currentWorkspaceSettings } = useAppContext();

  return (
    <div className="copa:grid copa:gap-4 copa:max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Number Format</CardTitle>
          <CardDescription>
            How numbers, dates, and percentages are displayed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingRow label="Thousands separator" value="Comma (1,000)" />
          <SettingRow label="Decimal separator" value="Period (0.00)" />
          <SettingRow label="Date format" value={currentWorkspaceSettings.dateFormat} />
          <SettingRow label="Timezone" value={currentWorkspaceSettings.timezone} />
          <SettingRow label="Percentage format" value="45.2%" />
          <SettingRow label="Negative numbers" value="(1,234.56)" />
        </CardContent>
      </Card>
    </div>
  );
}

function ChartThemeTab() {
  return (
    <div className="copa:grid copa:gap-4 copa:max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Chart Theme</CardTitle>
          <CardDescription>
            Visual appearance for charts and data visualizations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingRow label="Color palette" value="Bluecopa Default" />
          <SettingRow label="Chart font" value="Satoshi" />
          <SettingRow label="Grid lines" value="Subtle" />
          <SettingRow label="Tooltip style" value="Floating card" />
          <SettingRow label="Animation" value="Enabled" />
          <SettingRow label="Legend position" value="Bottom" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function Settings() {
  const { user, isAdmin } = useAppContext();

  return (
    <>
      <div className="copa:flex copa:items-center copa:justify-between">
        <h1 className="copa:text-2xl copa:font-semibold">Settings</h1>
        <span className="copa:text-xs copa:text-muted-foreground copa:bg-muted copa:rounded-md copa:px-2 copa:py-1">
          {isAdmin ? "Admin" : "Member"} &middot; {user?.email}
        </span>
      </div>

      <Tabs defaultValue="currency">
        <TabsList>
          <TabsTrigger value="currency">Currency</TabsTrigger>
          <TabsTrigger value="numbers">Number Settings</TabsTrigger>
          <TabsTrigger value="charts">Chart Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="currency">
          <CurrencyTab />
        </TabsContent>
        <TabsContent value="numbers">
          <NumberSettingsTab />
        </TabsContent>
        <TabsContent value="charts">
          <ChartThemeTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
