import { Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { createClientRecord } from "../../actions";

export default function NewClientPage() {
  return (
    <div className="max-w-lg">
      <PageHeader title="New client" />
      <Card>
        <form action={createClientRecord} className="space-y-4">
          <Field label="Name"><Input name="name" required /></Field>
          <Field label="Company"><Input name="company" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email"><Input name="email" type="email" /></Field>
            <Field label="Phone"><Input name="phone" type="tel" /></Field>
          </div>
          <Field label="Notes"><Textarea name="notes" /></Field>
          <Button type="submit">Save client</Button>
        </form>
      </Card>
    </div>
  );
}
