import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import humanizeDuration from "humanize-duration";
import type { FlowRun } from "@/api/flow-runs";
import { stateTypeColors } from "@/components/flow-runs/flow-run-graph/consts";
import { Icon } from "@/components/ui/icons";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNextButton,
	PaginationPreviousButton,
} from "@/components/ui/pagination";
import { StateBadge } from "@/components/ui/state-badge";
import { Typography } from "@/components/ui/typography";

type FlowRunsAccordionContentProps = {
	/** Paginated flow runs */
	flowRuns: FlowRun[];
	/** Current page */
	page: number;
	/** Total number of pages */
	totalPages: number;
	/** Update the current page */
	onPageChange: (page: number) => void;
};

/**
 * Content component for each accordion section.
 * Displays a paginated list of flow runs for a specific flow.
 */
export function FlowRunsAccordionContent({
	flowRuns,
	page,
	totalPages,
	onPageChange,
}: FlowRunsAccordionContentProps) {
	return (
		<div className="space-y-3">
			{flowRuns.map((flowRun) => (
				<div
					key={flowRun.id}
					className="flex flex-col gap-2 rounded-md border-l-4 bg-muted/30 p-3"
					style={{
						borderLeftColor: _getStateColor(flowRun.state_type),
					}}
				>
					<div className="flex items-center justify-between">
						<Link
							to="/runs/flow-run/$id"
							params={{ id: flowRun.id }}
							className="text-sm font-medium text-foreground hover:underline"
						>
							{flowRun.name}
						</Link>
					</div>
					<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						{flowRun.state_type && (
							<StateBadge
								type={flowRun.state_type}
								name={flowRun.state_name}
								className="text-xs"
							/>
						)}
						{flowRun.start_time && (
							<div className="flex items-center gap-1">
								<Icon id="Calendar" className="size-3" />
								<span className="font-mono">
									{format(parseISO(flowRun.start_time), "yyyy/MM/dd pp")}
								</span>
							</div>
						)}
						{flowRun.estimated_run_time != null && (
							<div className="flex items-center gap-1">
								<Icon id="Clock" className="size-3" />
								<span>
									{humanizeDuration(flowRun.estimated_run_time * 1000, {
										maxDecimalPoints: 0,
										units: ["h", "m", "s"],
										round: true,
									})}
								</span>
							</div>
						)}
					</div>
				</div>
			))}

			{totalPages > 1 && (
				<Pagination className="justify-start">
					<PaginationContent>
						<PaginationItem>
							<PaginationPreviousButton
								onClick={() => onPageChange(Math.max(1, page - 1))}
								disabled={page === 1}
							/>
						</PaginationItem>
						<PaginationItem>
							<Typography variant="bodySmall" className="px-2">
								Page {page} of {totalPages}
							</Typography>
						</PaginationItem>
						<PaginationItem>
							<PaginationNextButton
								onClick={() => onPageChange(Math.min(totalPages, page + 1))}
								disabled={page === totalPages}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</div>
	);
}

function _getStateColor(stateType: string | null | undefined): string {
	if (stateType && stateType in stateTypeColors) {
		return stateTypeColors[stateType as keyof typeof stateTypeColors];
	}
	return "#6B7280"; // gray-500 fallback
}
