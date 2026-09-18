import { ViewEditor } from "@/components/views/view-editor";

const Page = () => (
  <div className="space-y-6">
    <h1 className="text-lg font-semibold text-foreground">New view</h1>
    <ViewEditor initial={{ name: "", widgets: [] }} />
  </div>
);

export default Page;
