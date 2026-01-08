import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	buildFilterFlowRunsQuery,
	buildPaginateFlowRunsQuery,
	type FlowRun,
	type FlowRunsFilter,
	type FlowRunsPaginateFilter,
} from "@/api/flow-runs";
import { buildListFlowsQuery, type Flow, type FlowsFilter } from "@/api/flows";
import type { components } from "@/api/prefect";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { FlowRunStateTypeEmpty } from "./flow-run-state-type-empty";
import { FlowRunsAccordionContent } from "./flow-runs-accordion-content";
import { FlowRunsAccordionHeader } from "./flow-runs-accordion-header";

type StateType = components["schemas"]["StateType"];

export type FlowRunsAccordionProps = {
	/** Filter for flow runs */
	filter?: FlowRunsFilter;
	/** State types to filter by */
	stateTypes: StateType[];
};

const ITEMS_PER_PAGE = 3;

/**
 * Accordion component that displays flow runs grouped by flow.
 * Each accordion section shows a flow with its runs.
 */
export function FlowRunsAccordion({
	filter,
	stateTypes,
}: FlowRunsAccordionProps) {
	// Build the flow runs filter with state type
	const flowRunsFilter: FlowRunsFilter = useMemo(() => {
		const baseFilter: FlowRunsFilter = {
			sort: "START_TIME_DESC",
			offset: 0,
			...filter,
		};

		// Add state type filter
		if (stateTypes.length > 0) {
			baseFilter.flow_runs = {
				...(baseFilter.flow_runs ?? {}),
				operator: "and_",
				state: {
					operator: "and_",
					type: {
						any_: stateTypes,
					},
				},
			};
		}

		return baseFilter;
	}, [filter, stateTypes]);

	// Fetch flow runs count
	const { data: flowRuns } = useSuspenseQuery(
		buildFilterFlowRunsQuery(flowRunsFilter, 30_000),
	);

	// Extract unique flow IDs from flow runs
	const flowIds = useMemo(() => {
		return [...new Set(flowRuns.map((fr) => fr.flow_id))];
	}, [flowRuns]);

	// Build flows filter to fetch flows that have runs
	const flowsFilter: FlowsFilter = useMemo(() => {
		if (flowIds.length === 0) {
			return { offset: 0, sort: "UPDATED_DESC" };
		}
		return {
			flows: {
				operator: "and_",
				id: { any_: flowIds },
			},
			offset: 0,
			sort: "UPDATED_DESC",
		};
	}, [flowIds]);

	// Fetch flows
	const { data: flows, isLoading: isLoadingFlows } = useQuery(
		buildListFlowsQuery(flowsFilter, { enabled: flowIds.length > 0 }),
	);

	// Create a lookup map for flows
	const flowsLookup = useMemo(() => {
		const map = new Map<string, Flow>();
		if (flows) {
			for (const flow of flows) {
				map.set(flow.id, flow);
			}
		}
		return map;
	}, [flows]);

	// Show empty state if no flow runs
	if (flowRuns.length === 0) {
		return <FlowRunStateTypeEmpty stateTypes={stateTypes} />;
	}

	// Show loading state while flows are loading
	if (isLoadingFlows && flowIds.length > 0) {
		return null;
	}

	return (
		<Accordion type="multiple" className="w-full">
			{flowIds.map((flowId) => {
				const flow = flowsLookup.get(flowId);
				if (!flow) return null;

				return (
					<FlowRunsAccordionItem
						key={flowId}
						flow={flow}
						flowId={flowId}
						filter={flowRunsFilter}
					/>
				);
			})}
		</Accordion>
	);
}

type FlowRunsAccordionItemProps = {
	flow: Flow;
	flowId: string;
	filter?: FlowRunsFilter;
};

function FlowRunsAccordionItem({
	flow,
	flowId,
	filter,
}: FlowRunsAccordionItemProps) {
	const [page, setPage] = useState(1);
	const latestFlowRunRef = useRef<FlowRun | undefined>(undefined);

	useEffect(() => {
		setPage(1);
		latestFlowRunRef.current = undefined;
	}, [flowId, filter]);

	const paginatedFilter: FlowRunsPaginateFilter = useMemo(() => {
		return {
			page,
			limit: ITEMS_PER_PAGE,
			sort: "START_TIME_DESC",
			flows: {
				...(filter?.flows ?? {}),
				operator: "and_",
				id: { any_: [flowId] },
			},
			flow_runs: filter?.flow_runs ?? undefined,
			deployments: filter?.deployments ?? undefined,
			task_runs: filter?.task_runs ?? undefined,
			work_pools: filter?.work_pools ?? undefined,
			work_pool_queues: filter?.work_pool_queues ?? undefined,
		};
	}, [filter, flowId, page]);

	const { data: flowRunsPagination } = useQuery(
		buildPaginateFlowRunsQuery(paginatedFilter, 30_000),
	);

	const flowRuns = flowRunsPagination?.results ?? [];
	const totalPages = flowRunsPagination?.pages ?? 1;
	const totalCount = flowRunsPagination?.count ?? 0;

	useEffect(() => {
		setPage((currentPage) => Math.min(currentPage, totalPages));
	}, [totalPages]);

	useEffect(() => {
		if (flowRunsPagination?.page === 1 && flowRunsPagination.results.length > 0) {
			latestFlowRunRef.current = flowRunsPagination.results[0];
		}
	}, [flowRunsPagination]);

	const lastFlowRun = latestFlowRunRef.current ?? flowRuns[0];

	return (
		<AccordionItem value={flowId}>
			<AccordionTrigger className="hover:no-underline">
				<FlowRunsAccordionHeader
					flow={flow}
					count={totalCount}
					lastFlowRun={lastFlowRun}
				/>
			</AccordionTrigger>
			<AccordionContent>
				<FlowRunsAccordionContent
					flowRuns={flowRuns}
					page={page}
					totalPages={totalPages}
					onPageChange={setPage}
				/>
			</AccordionContent>
		</AccordionItem>
	);
}
