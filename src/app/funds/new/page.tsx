import { NewFundForm } from "@/components/actions";
import { Card, Page } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";

export default async function NewFund() {
  await requirePageRole("family");

  return (
    <Page title="Start a fund" subtitle="Next you will upload the hospital estimate, and AI will explain it.">
      <Card>
        <NewFundForm />
      </Card>
    </Page>
  );
}
