# LayerChart

Composable Svelte charts built on d3. Written against LayerChart v2 (Svelte 5 runes and snippets, LayerCake removed, Tailwind optional); v1 notes mark renamed APIs.

## Contents

- Install and imports
- Chart and its context
- Layers: Svg, Canvas, Html
- Scales and color
- Simplified charts
- Custom charts from marks
- Primitives and data mode
- Tooltip
- Series and legend
- Brush
- Transform (pan and zoom)
- Gradients and motion
- Styling
- SSR

## Install and imports

Package `layerchart`; requires Svelte 5. Scales and curves come from d3 packages directly.

```js
import { Chart, Layer, Axis, Spline, Tooltip } from "layerchart";
import { scaleBand } from "d3-scale";
import { curveCatmullRom } from "d3-shape";
```

- Heavy components live on sub-paths: `layerchart/geo`, `layerchart/hierarchy` (`Tree`, `Treemap`, `Pack`, `Partition`), `layerchart/force`, `layerchart/graph` (`Sankey`, `Dagre`, `Chord`, `Ribbon`).
- Committed to one layer? Import from `layerchart/svg`, `layerchart/canvas` or `layerchart/html` for smaller, faster-mounting code (no `html` variant of the simplified charts).
- Brush, transform, default tooltip, quadtree, points, labels and legend lazy-load when their prop is set.
- `<ChartCore>` gives chart context without the axis/grid/highlight chain (maps, custom layouts).

## Chart and its context

`<Chart>` takes `data` plus accessors (`x`, `y`, `z`, `r`, `c`) as property names, functions or arrays, builds scales, measures its container and owns all interaction state as a `ChartState`.

```svelte
<Chart {data} x="date" y="value" yDomain={[0, null]} yNice padding={{ left: 40, bottom: 24 }} height={300}>
	<Layer>
		<Axis placement="left" />
		<Axis placement="bottom" />
		<Spline />
	</Layer>
</Chart>
```

- The container needs a size, or pass explicit `width` / `height`.
- `padding` takes `{ top, right, bottom, left }` or one number.
- Pass data and accessors on `Chart` when you can. Per-mark accessors register after first render, causing a second render.

Reading state:

```svelte
<script lang="ts">
	import { getChartContext, type ChartState } from 'layerchart';
	const ctx = getChartContext(); // only in components rendered under <Chart>
	let context = $state<ChartState>(null!);
</script>

<Chart bind:context {data} x="date" y="value" />
{#if context?.tooltip.data}<p>{context.tooltip.data.value}</p>{/if}
```

- Snippets receive `{ context }`.
- Useful fields: `xScale`, `yScale`, `cScale`, `xGet`/`yGet` (data to pixels), `width`/`height` (inner), `containerWidth`, `padding`, `tooltip`, `series`, `brush`, `transform`.
- Global defaults: `setSettings({ layer: 'canvas', debug: false })` near the root.
- v1: `ChartContextValue` is now `ChartState`; `getTooltipContext()` and `getRenderContext()` are now `getChartContext()` and `getLayerContext()`; stores became plain reactive properties (no `$`).

## Layers: Svg, Canvas, Html

`<Layer type="svg" | "canvas" | "html">` wraps `Svg`, `Canvas` and `Html`; without `type` it uses the settings default. Layers can be mixed in one chart.

| Layer                | Pick it for                                                    | Weak at                      |
| -------------------- | -------------------------------------------------------------- | ---------------------------- |
| Svg (default choice) | Rich graphics, events, inspectable DOM, text on paths, markers | Large data, multiline text   |
| Canvas               | Large datasets, performance                                    | Styling, interactivity, text |
| Html                 | Text wrapping and truncation, flex/grid layout                 | Paths and arcs               |
- Canvas still gets CSS classes, CSS variables, dark mode and pointer events through a hidden hit canvas.
- Simplified charts take `layer="canvas"` (v1: `renderContext`).

## Scales and color

Scale type is inferred: `Date` gives `scaleTime`, numbers `scaleLinear`, strings `scaleBand`. Override with any d3 scale.

```svelte
<Chart xScale={scaleLog()} yDomain={[0, null]} xDomain={[0, 100]} />
```

- `null` in a domain keeps the computed end.
- Domains default to data extents, ranges to inner width and height.
- `xNice`/`yNice` round domains; `yBaseline={0}` includes zero.
- Time-series bars: `xInterval={timeDay}` with a time scale shows gaps; space bars with `xInset`.
- Use `scaleUtc()` for values keyed on UTC dates, or ticks land a day off.

Color is the `c` channel. There is no built-in palette.

```svelte
<Chart {data} x="date" y="value" c="fruit" cRange={['var(--color-apples)', 'var(--color-bananas)']} />
<Chart {data} c="temperature" cScale={scaleSequential(interpolateViridis)} />
```

- `cScale` defaults to `scaleOrdinal`, even for numbers.
- A mark's color resolves in order: its own `fill`/`stroke`, its series `color`, the chart `c`, then CSS `--color-primary`.
- `fill="species"` (a data key) goes through `cScale`; `fill="tomato"` or `#hex` or `var(...)` is literal.
- A string or boolean `c` with no `series` becomes grouping: legend toggles, bars and areas stack, one line per category. Use `g` to split lines without coloring.

## Simplified charts

`LineChart`, `AreaChart`, `BarChart`, `ScatterChart`, `PieChart`, `ArcChart` wrap `Chart` with the right marks, tooltip mode, axis, grid, rule and highlight defaults.

```svelte
<LineChart {data} x="date" y="value" />
<LineChart {data} x="year" y="value" c="fruit" legend />
<BarChart {data} x="year" series={[{ key: 'apples' }, { key: 'bananas' }]} seriesLayout="group" legend />
<BarChart {data} x="category" y="value" orientation="horizontal" />
<ScatterChart {data} x="x" y="y" r="population" highlight={{ points: true, r: true }} />
<PieChart {data} labels={{ placement: 'callout', value: 'fruit' }} />
```

- Feature props (`axis`, `grid`, `rule`, `highlight`, `points`, `labels`, `legend`, `tooltipContext`, `brush`) accept `true`, a props object, or a snippet.
- `props` forwards to internals without replacing them: `props={{ xAxis: { tickCount: 5 }, spline: { curve: curveCatmullRom } }}`.
- `PieChart`/`ArcChart` radii: negative is an offset from size, `0-1` is a fraction, `>= 1` is pixels.
- Override one part with a snippet, keeping the rest:

```svelte
<LineChart {data} x="date" y="value">
	{#snippet marks({ context })}
		{#each context.series.visibleSeries as s (s.key)}
			<Spline seriesKey={s.key} curve={curveCatmullRom} />
		{/each}
	{/snippet}
</LineChart>
```

- A custom `marks` snippet ignores chart-level `props` for marks; put them on the mark or in series `props`.
- `points` only replaces points; `marks` replaces lines and points.
- v1: `get*Props()` helpers in snippets are gone; use `seriesKey`.

## Custom charts from marks

Render order snippets on `Chart` (bottom to top): `belowContext`, then inside the layer `grid`, `belowMarks`, `marks`, `aboveMarks`, `axis`, `rule`, `points`, `labels`, `highlight`, `annotations`, then `aboveContext`, `legend`, `tooltip`. Providing `children` replaces the whole default layout.

```svelte
<Chart {data} x="date" y="value" yDomain={[0, null]} tooltipContext={{ mode: 'quadtree-x' }}>
	<Layer>
		<Grid y />
		<Axis placement="left" rule />
		<Axis placement="bottom" />
		<Area fillOpacity={0.2} line />
		<Spline strokeWidth={2} />
		<Points />
		<Labels placement="smart" />
		<Rule y={0} />
		<Highlight points lines />
	</Layer>
	<Tooltip.Root>
		{#snippet children({ data })}
			<Tooltip.Header value={data.date} format="day" />
		{/snippet}
	</Tooltip.Root>
</Chart>
```

- `Axis`: `placement` (`top`, `bottom`, `left`, `right`), `rule`, `label`, `format`, `tickSpacing` (default 80 horizontal, 50 vertical), `tickOcclusion={{ priority: 'start-end', padding: 12 }}` for long labels, `tickMultiline`, `domain` for a secondary unit axis. v1: `x="left"` is now `x="$left"`.
- `Grid`: `x` / `y` toggle each direction.
- `Rule`: `x={true}`/`y={true}` for baselines, a number for an annotation line, or accessors (`y={['start', 'end']}`) as a data mark. Replaces v1 `Points links`.
- `Spline` / `Area`: `g` splits into one path per group; a data-key `stroke`/`fill` implies it. One mark with `g` beats a mark per line (mount cost is lines x rows).
- `Spline`: function `class`/`stroke` styles per segment; `bind:pathRef` (v1: `splineRef`).
- `Bars`: per-series via `seriesKey`; fixed `width`/`height` overrides band size; `radius`. Single `Bar` takes `data` (v1: `bar`).
- `Labels`: bar `placement` `inside`, `middle`, `center`; line `placement="smart"`; scatter `layout="voronoi"`, `occlude`, `links`; `seriesKey` filter.
- `Highlight`: `lines`, `points`, `area`, `bar` (each `true`, props or a snippet); `axis` (`'x'`, `'y'`, `'both'`, `'none'`); `r={true}` sizes points by `rScale`; explicit `data` pins it to one row.
- Native SVG inside `marks` is ~6x faster to mount but loses data mode, motion, layer portability and domain registration.

## Primitives and data mode

`Circle`, `Ellipse`, `Group`, `Image`, `Line`, `Polygon`, `Rect`, `Text` take numbers (pixels) or strings/functions (data mode: scaled, one element per row).

```svelte
<Circle cx="date" cy="value" r={5} fill="category" />
<Rect x0="x0" x1="x1" y0={(d) => 0} y1="length" insets={{ x: 1 }} />
<Text x="date" y="value" value="label" />
```

- `cx`/`x*` use `xScale`, `cy`/`y*` use `yScale`, `r` uses `rScale`, `fill`/`stroke` use `cScale`.
- Data comes from the component's `data` prop, else the chart's. Use `key={(d) => d.id}` for keyed updates.
- `cx={xScale(10)}` is a number, so pixel mode. `bind:ref` works only in pixel mode.
- Style props are camelCase: `fillOpacity`, `strokeWidth` (v1: `fill-opacity`).

## Tooltip

Turn on with `tooltipContext` (v1: `tooltip`), render `Tooltip.Root` with a `children` snippet.

| Mode                        | Use for                                                |
| --------------------------- | ------------------------------------------------------ |
| `bisect-x` / `bisect-y`     | Sorted time series                                     |
| `quadtree-x` / `quadtree-y` | Lines on unsorted or categorical x (Line/Area default) |
| `band`, `bisect-band`       | Bar charts                                             |
| `voronoi`, `quadtree`       | Scatter (`quadtree` default, faster)                   |
| `bounds`                    | Duration or overlapping bars                           |
| `facet`                     | Faceted panels                                         |
| `manual`                    | Pie slices, geo shapes                                 |

```svelte
<Tooltip.Root x="data" y="pointer" anchor="top-left" variant="invert" portal={false}>
	{#snippet children({ data })}
		<Tooltip.Header value={data.date} format="day" />
		<Tooltip.List>
			<Tooltip.Item seriesKey="apples" />
			<Tooltip.Item label="Revenue" value={data.revenue} format="currency" />
			<Tooltip.Separator />
		</Tooltip.List>
	{/snippet}
</Tooltip.Root>
```

- Context options: `findTooltipData` (`'closest'`, `'left'`, `'right'`), `radius`, `locked`, `hideDelay`, `touchEvents` (default `'pan-y'`), `debug`, `raiseTarget`, `onclick: (e, { data }) => {}`.
- Root options: `x`/`y` (`'pointer'`, `'data'`, number), `xOffset`/`yOffset`, `contained` (`'container'`, `'window'`, `false`), `motion`, `pointerEvents` (needed for clickable content).
- Portaled to `document.body` by default so `overflow: hidden` cannot clip it.
- Simplified charts render a default tooltip; tweak via `props={{ tooltip: { root, header, item, hideTotal } }}` or replace with a `tooltip` snippet.
- Manual mode: `onpointerenter={(e) => context.tooltip.show(e, d)}` and `hide(e)`, or the boolean `tooltip` prop on `Arc`, `Bar`, `Pie`, `GeoPath`, `Ribbon`, `Calendar`.
- v1: `payload` is gone. Use `ctx.tooltip.data` and `ctx.tooltip.series`.

## Series and legend

```svelte
<AreaChart
	{data}
	x="date"
	series={[
		{ key: 'apples', color: 'var(--color-apples)' },
		{ key: 'bananas', label: 'Bananas', color: 'var(--color-bananas)', selected: false, props: { fillOpacity: 0.2 } }
	]}
	seriesLayout="stack"
	legend
/>
```

- Series keys: `key` (required), `label`, `value`, `data` (own array), `color`, `selected`, `props`, `maxValue`.
- `seriesLayout`: `auto` (default), `overlap`, `stack`, `stackExpand`, `stackDiverging`, `group` (bars).
- When stacking shared data on raw `Chart`, give each series a `value`; an array `y` breaks the stack.
- Legend click toggles visibility; hover sets `context.series.highlightKey`.
- Programmatic: `context.series.selectedKeys.toggle(key)`, `.clear()`, `isVisible(key)`, `setHighlight(key)`.

## Brush

```svelte
<LineChart {data} x="date" y="value" brush />
<Chart {data} x="date" {xDomain} y="value" brush={{ onBrushEnd: (e) => { xDomain = e.brush.x; e.brush.reset(); } }} />
```

- Simplified charts zoom on brush by default (`zoomOnBrush`).
- Options: `axis` (`'x'` default, `'y'`, `'both'`), `onBrushStart`, `onChange`, `onBrushEnd`, `x`/`y` for two-way sync, `clickToReset`, `handleSize`, `minExtent`, `maxExtent`, `constrain`, `constrainToDomain`, `classes: { range, handle }`.
- A cleared brush fires `onBrushEnd` with `active === false`.
- Methods on `context.brush`: `move({ x })`, `reset()`, `selectAll()`.

## Transform (pan and zoom)

```svelte
<BarChart {data} x="date" y="value" transform={{ mode: 'domain', axis: 'x' }} />
```

- Modes: `domain` (cartesian), `canvas` (visual transform for maps, images, trees), `projection` (geo), `none` (default).
- Combine with `brush` for brush-then-pan.
- Constraints: `scaleExtent`, `domainExtent` (v1 `'original'` is now `'data'`), `translateExtent`, `constrain`.

## Gradients and motion

Gradient components pass a fill value to their `children` snippet:

```svelte
<RadialGradient stops={['hsl(60 100% 50%)', 'hsl(30 100% 40%)']}>
	{#snippet children({ gradient })}
		<Circle r={150} fill={gradient} />
	{/snippet}
</RadialGradient>
```

- `RadialGradient` is Svg only; `LinearGradient` and `Pattern` work in Svg, Canvas and Html.
- Tailwind 4 renders `0%` opacity stops gray; use `/1` (e.g. `to-primary/1`).

`motion` on marks, Highlight, Tooltip and `Chart` (scale transitions):

```svelte
<Bars motion="spring" />
<Spline motion={{ type: 'tween', duration: 300, easing: cubicInOut }} />
<Bars motion={false} />
```

## Styling

- Components inherit `currentColor` and expose `lc-*` classes with zero-specificity `:where()` selectors inside cascade layers (`base`, `components`), so your classes win.
- Theme variables on `.lc-root-container`: `--color-primary`, `--color-surface-100/200/300`, `--color-surface-content`. Redefine under `prefers-color-scheme: dark` or `.dark`.
- Presets: `@import 'layerchart/shadcn-svelte.css'`, `skeleton-3.css`, `skeleton-4.css`, `daisyui-5.css`. Svelte UX works as is.
- Without Tailwind or a preset, `@import 'layerchart/core.css'` (or declare `@layer theme, base, components, utilities;`), or prod builds may order layers wrongly.
- Nested parts: `classes={{ root, rule, tickLabel }}` on `Axis`, `classes={{ root, item, swatch, label }}` on `Legend` (v1: `swatches` is now `item`).
- Charts set `user-select: none`; re-enable with `--lc-user-select: text`.

## SSR

The docs cover server rendering only as images (OG cards, email, bots), via `layerchart/server`:

```svelte
<!-- #lib/charts/Line.svelte -->
<script lang="ts">
	import { ServerChart, type CaptureTarget } from 'layerchart/server';
	import { Axis, Spline } from 'layerchart';
	let { data, width, height, capture }: { data: any[]; width: number; height: number; capture?: CaptureTarget } = $props();
</script>

<ServerChart {capture} {width} {height} {data} x="date" y="value">
	<Axis placement="bottom" stroke="rgba(0,0,0,0.3)" fill="rgba(0,0,0,0.5)" />
	<Spline stroke="rgb(59, 130, 246)" strokeWidth={2} />
</ServerChart>
```

```ts
// +server.ts
import { createCanvas, Path2D } from "@napi-rs/canvas";
import { renderChart } from "layerchart/server";
import Line from "#lib/charts/Line.svelte";

const data = [
	{ date: 0, value: 50 },
	{ date: 1, value: 80 },
];

if (typeof globalThis.Path2D === "undefined")
	(globalThis as any).Path2D = Path2D;

export const GET = async () => {
	const buffer = renderChart(Line, {
		width: 800,
		height: 400,
		props: { data },
		createCanvas: (w, h) => createCanvas(w, h) as any,
	});
	return new Response(buffer, { headers: { "Content-Type": "image/png" } });
};
```

- Inline `fill`/`stroke` only: no CSS classes or variables on the server.
- Canvas-capable components only. `Tooltip`, `Legend`, `Highlight` do not render.
- Options also take `format` (`png`/`jpeg`), `background` (JPEG renders black without it) and `devicePixelRatio`.
- Native canvas libraries do not run on edge runtimes; prerender the endpoint there.

Source: https://www.layerchart.com/docs/guides/structure, https://www.layerchart.com/docs/guides/layers, https://www.layerchart.com/docs/guides/primitives, https://www.layerchart.com/docs/guides/scales, https://www.layerchart.com/docs/guides/data, https://www.layerchart.com/docs/guides/state, https://www.layerchart.com/docs/guides/series, https://www.layerchart.com/docs/guides/tooltip, https://www.layerchart.com/docs/guides/brush, https://www.layerchart.com/docs/guides/transform, https://www.layerchart.com/docs/guides/animation, https://www.layerchart.com/docs/guides/styles, https://www.layerchart.com/docs/guides/ssr-images, https://www.layerchart.com/docs/guides/bundle-size, https://www.layerchart.com/docs/guides/migrations/v1-to-v2, https://www.layerchart.com/docs/components/Chart, https://www.layerchart.com/docs/components/Axis, https://www.layerchart.com/docs/components/Spline, https://www.layerchart.com/docs/components/Area, https://www.layerchart.com/docs/components/Bars, https://www.layerchart.com/docs/components/Rule, https://www.layerchart.com/docs/components/Labels, https://www.layerchart.com/docs/components/Highlight, https://www.layerchart.com/docs/components/Legend, https://www.layerchart.com/docs/components/LinearGradient, https://www.layerchart.com/docs/components/BarChart, https://www.layerchart.com/docs/components/LineChart, https://www.layerchart.com/docs/components/PieChart
