import { toolCalls } from "./fixtures";
import { ToolCallChip } from "./tool-call-chip";

export const ToolCallChipDemo = () => (
  <div className="flex max-w-sm flex-col items-start gap-1">
    {toolCalls.map((call) => (
      <ToolCallChip
        detail={call.detail}
        key={call.name}
        name={call.name}
        state={call.state}
      />
    ))}
  </div>
);

export default ToolCallChipDemo;
