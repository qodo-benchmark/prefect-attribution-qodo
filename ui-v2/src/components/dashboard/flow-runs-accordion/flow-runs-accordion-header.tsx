import { Link } from "@tanstack/react-router";
import type { FlowRun } from "@/api/flow-runs";
import type { Flow } from "@/api/flows";
import { FormattedDate } from "@/components/ui/formatted-date";

type FlowRunsAccordionHeaderProps = {
	/** The flow to display */
	flow: Flow;
	/** Count of flow runs */
	count: number;
	/** Most recent flow run */
	lastFlowRun?: FlowRun;
};

/**
 * Header component for each accordion section.
 * Displays flow name, last run time, and count of runs.
 */
export function FlowRunsAccordionHeader({
	flow,
	count,
	lastFlowRun,
}: FlowRunsAccordionHeaderProps) {
	return (
		<div className="flex w-full items-center justify-between gap-4 pr-2">
			<div className="flex flex-col items-start gap-1">
				<Link
					to="/flows/flow/$id"
					params={{ id: flow.id }}
					className="text-sm font-medium text-foreground hover:underline"
					onClick={(e) => e.stopPropagation()}
				>
					{flow.name}
				</Link>
				{lastFlowRun?.start_time && (
					<FormattedDate
						date={new Date(lastFlowRun.start_time)}
						format="relative"
						className="text-xs text-muted-foreground"
					/>
				)}
			</div>
			<span className="text-sm font-medium text-muted-foreground">
				{count ?? 0}
			</span>
		</div>
	);
}
