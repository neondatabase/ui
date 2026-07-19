/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
import AuthFormCoverDemo from "./auth-form-cover-demo";
import source from "./auth-form-cover-demo.tsx?raw";
import { highlightedHtml } from "./generated/auth-form-cover-preview";
import PreviewTabs from "./preview-tabs";

export default function AuthFormCoverPreview() {
  return (
    <PreviewTabs minHeight={400} highlighted={highlightedHtml} source={source}>
      <AuthFormCoverDemo />
    </PreviewTabs>
  );
}
