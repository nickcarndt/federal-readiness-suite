import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ArchitectureLayer } from "@/types/assessment";

interface ArchitectureDiagramProps {
  layers: ArchitectureLayer[];
  securityBoundary: string;
  pathway: string;
}

const LAYER_ACCENTS = [
  "bg-coral",
  "bg-zinc-400",
  "bg-blue-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-amber-400",
];

// Keywords that indicate a layer lives inside the security boundary
const BOUNDARY_KEYWORDS = [
  "govcloud", "bedrock", "claude", "api gateway", "mcp",
  "data", "storage", "ai", "processing", "security", "compliance",
];

function isInsideBoundary(layer: ArchitectureLayer): boolean {
  const lower = layer.name.toLowerCase();
  return BOUNDARY_KEYWORDS.some((kw) => lower.includes(kw));
}

function LayerCard({
  layer,
  index,
  showArrow,
}: {
  layer: ArchitectureLayer;
  index: number;
  showArrow: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="flex items-stretch">
          <div
            className={cn(
              "w-1 shrink-0 rounded-l-lg",
              LAYER_ACCENTS[index % LAYER_ACCENTS.length]
            )}
          />
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-100">
                  {layer.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {layer.description}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                L{index + 1}
              </span>
            </div>
            {layer.components.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {layer.components.map((component) => (
                  <span
                    key={component}
                    className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400"
                  >
                    {component}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showArrow && (
        <div className="flex flex-col items-center py-1">
          <div className="h-3 w-px bg-zinc-700" />
          <svg
            width="8"
            height="5"
            viewBox="0 0 8 5"
            className="text-zinc-600"
            fill="currentColor"
          >
            <path d="M4 5L0 0h8L4 5z" />
          </svg>
        </div>
      )}
    </div>
  );
}

export const ArchitectureDiagram = memo(function ArchitectureDiagram({
  layers,
  securityBoundary,
  pathway,
}: ArchitectureDiagramProps) {
  // Split layers into three groups: before, inside, and after the boundary
  let boundaryStart = -1;
  let boundaryEnd = -1;

  layers.forEach((layer, i) => {
    if (isInsideBoundary(layer)) {
      if (boundaryStart === -1) boundaryStart = i;
      boundaryEnd = i;
    }
  });

  const hasBoundary = boundaryStart !== -1;
  const beforeLayers = hasBoundary ? layers.slice(0, boundaryStart) : layers;
  const insideLayers = hasBoundary ? layers.slice(boundaryStart, boundaryEnd + 1) : [];
  const afterLayers = hasBoundary ? layers.slice(boundaryEnd + 1) : [];

  return (
    <div className="mt-4 space-y-0">
      {/* Pathway badge */}
      <div className="mb-5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          {pathway}
        </span>
      </div>

      <div className="flex flex-col">
        {/* Layers before the boundary */}
        {beforeLayers.map((layer, i) => (
          <LayerCard
            key={layer.name}
            layer={layer}
            index={i}
            showArrow={true}
          />
        ))}

        {/* FedRAMP boundary wrapper — wraps only the layers inside it */}
        {hasBoundary && (
          <div className="relative rounded-xl border border-dashed border-blue-500/40 p-3 pt-5">
            {/* Boundary label — sits on the top border */}
            <span className="absolute -top-2.5 left-3 inline-flex items-center gap-1 rounded bg-zinc-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-blue-400">
              <span className="h-1 w-1 rounded-full bg-blue-400" />
              {securityBoundary}
            </span>

            <div className="flex flex-col">
              {insideLayers.map((layer, i) => {
                const globalIndex = boundaryStart + i;
                return (
                  <LayerCard
                    key={layer.name}
                    layer={layer}
                    index={globalIndex}
                    showArrow={i < insideLayers.length - 1}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Connector arrow from boundary to after-layers */}
        {hasBoundary && afterLayers.length > 0 && (
          <div className="flex flex-col items-center py-1">
            <div className="h-3 w-px bg-zinc-700" />
            <svg
              width="8"
              height="5"
              viewBox="0 0 8 5"
              className="text-zinc-600"
              fill="currentColor"
            >
              <path d="M4 5L0 0h8L4 5z" />
            </svg>
          </div>
        )}

        {/* Layers after the boundary */}
        {afterLayers.map((layer, i) => {
          const globalIndex = boundaryEnd + 1 + i;
          return (
            <LayerCard
              key={layer.name}
              layer={layer}
              index={globalIndex}
              showArrow={i < afterLayers.length - 1}
            />
          );
        })}
      </div>
    </div>
  );
});
