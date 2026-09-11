window.__ModuleLoader__.load({
	id: "dsh-workbuddy-connect",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/status-paths.ts
		/** Node-free constants and types shared by the Host and browser halves. */
		/** Plugin-owned status endpoint consumed by its browser half. */
		const WORKBUDDY_STATUS_PATH = "/plugins/dsh-workbuddy-connect/status";
		/**
		* Plugin-owned probe control endpoint.
		*
		* Separate from the status route because it accepts writes: the status route's
		* loopback Host/Origin guard protects against a DNS-rebinding *page*, which is
		* not the same as authorizing a state-changing action. This route therefore
		* also requires the in-process key the browser half receives with the status
		* document.
		*/
		const WORKBUDDY_PROBE_PATH = "/plugins/dsh-workbuddy-connect/probe";
		//#endregion
		//#region src/client/WorkBuddyProbeControl.tsx
		/**
		* Per-model reasoning-effort entry beside the Composer's model selector.
		*
		* Interaction follows the Fast Mode control `dsh-codex-connect` ships in this
		* same seat, which is the established shape for composer chrome here:
		*
		* - a **static inline label** next to the icon names the feature ("Reasoning
		*   levels"), set smaller and dimmer than the surrounding chrome so it reads as
		*   an annotation on the icon. It never carries state: the verified levels
		*   already appear in the model dropdown (the adapter exposes them as
		*   selectable efforts), so repeating them here would duplicate the real answer
		*   and make the label's width jump as results change.
		* - a **hover/focus tooltip** carries the state and the click's purpose, the way
		*   Fast Mode's tooltip explains its current speed.
		* - the **confirmation** is a small bubble anchored to the control, not a
		*   `window.confirm`. Probing spends real credit, so a confirmation stays — but
		*   it belongs next to the thing it acts on, sized to one line plus two small
		*   buttons.
		*
		* @module dsh-workbuddy-connect/client/probe-control
		*/
		/** How often the control re-checks state when the window regains focus. */
		const RECONCILE_MS = 6e4;
		const wrapperStyle = {
			display: "inline-flex",
			position: "relative",
			alignItems: "center",
			transform: "translateY(2px)",
			marginRight: -8
		};
		const buttonStyle$1 = {
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			gap: 2,
			height: 30,
			padding: "0 6px",
			border: 0,
			borderRadius: 8,
			background: "transparent",
			color: "var(--dsw-alias-label-secondary)",
			font: "inherit",
			whiteSpace: "nowrap",
			cursor: "pointer"
		};
		/**
		* The inline label. Smaller and dimmer than the surrounding chrome on purpose:
		* it names the feature, so it should read as an annotation attached to the icon
		* rather than compete with the adjacent model selector.
		*/
		const labelStyle = {
			fontSize: 11,
			lineHeight: "16px",
			color: "var(--dsw-alias-label-tertiary)"
		};
		/** Tooltip bubble: the Fast Mode shape (nowrap, one line, above the control). */
		const tooltipStyle = {
			position: "absolute",
			left: "50%",
			bottom: "calc(100% + 8px)",
			zIndex: 1e3,
			transform: "translateX(-50%)",
			padding: "4px 8px",
			borderRadius: 6,
			background: "var(--dsw-specific-tip, #1f2329)",
			boxShadow: "var(--dsw-shadow-lv2)",
			color: "var(--dsw-alias-label-primary, #fff)",
			fontSize: 12,
			lineHeight: "18px",
			whiteSpace: "nowrap",
			pointerEvents: "none"
		};
		/** Confirmation bubble: same anchor, but interactive and allowed to wrap. */
		const confirmStyle = {
			position: "absolute",
			right: 0,
			bottom: "calc(100% + 8px)",
			zIndex: 1001,
			display: "flex",
			flexDirection: "column",
			gap: 8,
			width: 260,
			padding: "10px 12px",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: 8,
			background: "var(--dsw-alias-bg-layer-1, #fff)",
			boxShadow: "var(--dsw-shadow-lv2)",
			color: "var(--dsw-alias-label-primary)",
			fontSize: 12,
			lineHeight: "18px"
		};
		const confirmRowStyle$1 = {
			display: "flex",
			justifyContent: "flex-end",
			gap: 8
		};
		const confirmButtonStyle = {
			padding: "3px 10px",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: 6,
			background: "transparent",
			color: "inherit",
			font: "inherit",
			fontSize: 12,
			cursor: "pointer"
		};
		/**
		* Primary action inside the confirmation bubble.
		*
		* The fill and its text colour must come as a pair: `brand-primary` resolves to
		* a light accent in this theme, so hardcoding `color: #fff` on top of it renders
		* white-on-white. `button-primary-fill` + `label-primary-foreground` is the
		* theme's own pair for exactly this, and is what `dsh-codex-connect` uses for
		* the same job.
		*/
		const primaryButtonStyle$1 = {
			...confirmButtonStyle,
			border: "1px solid var(--dsw-alias-button-primary-fill)",
			background: "var(--dsw-alias-button-primary-fill)",
			color: "var(--dsw-alias-label-primary-foreground)"
		};
		/**
		* Result note: a single line + a dismiss button, anchored to the control's
		* right side. Smaller than the confirmation bubble because it carries an
		* *outcome*, not a *decision* — the work is done, the user only has to read
		* and dismiss.
		*/
		const noteStyle = {
			position: "absolute",
			right: 0,
			bottom: "calc(100% + 8px)",
			zIndex: 1001,
			display: "flex",
			alignItems: "center",
			gap: 12,
			padding: "6px 10px",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: 8,
			background: "var(--dsw-alias-bg-layer-1)",
			boxShadow: "var(--dsw-shadow-lv2)",
			color: "var(--dsw-alias-label-primary)",
			fontSize: 12,
			lineHeight: "18px",
			whiteSpace: "nowrap"
		};
		/**
		* The note's dismiss action. Outlined rather than bare text: inside an already
		* bordered bubble, an unbordered word does not read as something you can click.
		* Matches the outlined pill convention the plugin's other secondary actions use.
		*/
		const noteDismissStyle = {
			padding: "2px 8px",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: 6,
			background: "transparent",
			color: "var(--dsw-alias-label-secondary)",
			font: "inherit",
			fontSize: 12,
			lineHeight: "18px",
			cursor: "pointer"
		};
		/**
		* The feature's static inline label. Deliberately not a state readout — see the
		* module comment.
		*/
		function useLabel(t) {
			return t("probeLabel");
		}
		/** Pick the model's recorded observation out of the probe section. */
		function resultFor(status, model) {
			if (status.status !== "signed-in") return void 0;
			return status.probe?.results.find((result) => result.id === model);
		}
		/**
		* The one-line tooltip: current state first, then what a click does — the same
		* two-part shape Fast Mode uses.
		*/
		function tooltipText(t, model, state) {
			if (state.busy) return t("probeRunning", { model });
			if (state.failed) return t("probeTooltipRetry");
			const result = state.result;
			if (result === void 0) return t("probeTooltipIdle", { model });
			if (result.validation === "validating" && result.efforts.length > 0) return t("probeTooltipVerified", { levels: result.efforts.join(" / ") });
			if (result.validation === "non-validating") return t("probeTooltipNotValidating");
			return t("probeTooltipRetry");
		}
		/** Model-independent shell: resolves the selection, then delegates per model. */
		function WorkBuddyProbeControl({ directory, t }) {
			const subscribe = (0, react.useCallback)((listener) => directory.subscribe(listener), [directory]);
			const snapshot = (0, react.useCallback)(() => directory.getSnapshot(), [directory]);
			const selection = (0, react.useSyncExternalStore)(subscribe, snapshot, snapshot).current;
			const model = selection?.provider === "workbuddy" ? selection.model : void 0;
			const label = useLabel(t);
			return model === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelProbe, {
				model,
				label,
				t
			}, model);
		}
		function ModelProbe({ model, label, t }) {
			const [status, setStatus] = (0, react.useState)();
			const [busy, setBusy] = (0, react.useState)(false);
			const [confirming, setConfirming] = (0, react.useState)(false);
			const [tooltipVisible, setTooltipVisible] = (0, react.useState)(false);
			const [failed, setFailed] = (0, react.useState)(false);
			const [note, setNote] = (0, react.useState)();
			const inFlight = (0, react.useRef)(false);
			const mounted = (0, react.useRef)(false);
			const tooltipId = (0, react.useId)();
			const refresh = (0, react.useCallback)(async (signal) => {
				const response = await fetch(WORKBUDDY_STATUS_PATH, {
					credentials: "same-origin",
					headers: { accept: "application/json" },
					...signal === void 0 ? {} : { signal }
				});
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const value = await response.json();
				if (mounted.current && !signal?.aborted) setStatus(value);
			}, []);
			(0, react.useEffect)(() => {
				mounted.current = true;
				const controller = new AbortController();
				const load = () => {
					refresh(controller.signal).catch(() => {});
				};
				load();
				const timer = window.setInterval(load, RECONCILE_MS);
				window.addEventListener("focus", load);
				return () => {
					mounted.current = false;
					controller.abort();
					window.clearInterval(timer);
					window.removeEventListener("focus", load);
				};
			}, [refresh]);
			const probe = status?.status === "signed-in" ? status.probe : void 0;
			const key = status?.status === "signed-in" ? status.probeKey : void 0;
			const result = status === void 0 ? void 0 : resultFor(status, model);
			const visible = probe?.candidates.includes(model) === true || result !== void 0;
			(0, react.useEffect)(() => {
				setConfirming(false);
				setNote(void 0);
			}, [model]);
			const detect = async () => {
				if (key === void 0 || inFlight.current || probe?.running === true) return;
				inFlight.current = true;
				setNote(void 0);
				setConfirming(false);
				setBusy(true);
				setFailed(false);
				try {
					const response = await fetch(WORKBUDDY_PROBE_PATH, {
						method: "POST",
						credentials: "same-origin",
						headers: {
							"Content-Type": "application/json",
							"X-WorkBuddy-Probe-Key": key
						},
						body: JSON.stringify({
							action: "probe",
							model
						})
					});
					const body = await response.json();
					if (!response.ok || body.state !== "ok" || body.validation !== "validating" && body.validation !== "non-validating" || !Array.isArray(body.efforts) || !body.efforts.every((effort) => typeof effort === "string")) throw new Error("probe failed");
					if (mounted.current) {
						const completed = {
							id: model,
							name: model,
							validation: body.validation,
							efforts: body.efforts,
							probedAt: Date.now()
						};
						setNote(completed);
					}
					refresh().catch(() => {});
				} catch {
					if (mounted.current) setFailed(true);
				} finally {
					inFlight.current = false;
					if (mounted.current) setBusy(false);
				}
			};
			if (!visible) return null;
			const text = tooltipText(t, model, {
				busy,
				result,
				failed
			});
			const disabled = busy || probe?.running === true || key === void 0;
			const showTooltip = tooltipVisible && !confirming && note === void 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				style: wrapperStyle,
				onMouseEnter: () => {
					setTooltipVisible(true);
				},
				onMouseLeave: () => {
					setTooltipVisible(false);
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						"aria-label": text,
						"aria-describedby": showTooltip ? tooltipId : void 0,
						"aria-busy": busy,
						"aria-expanded": confirming,
						disabled,
						onClick: () => {
							setConfirming(true);
						},
						onFocus: () => {
							setTooltipVisible(true);
						},
						onBlur: () => {
							setTooltipVisible(false);
						},
						style: {
							...buttonStyle$1,
							opacity: disabled && !confirming ? .6 : 1,
							cursor: disabled ? "default" : "pointer"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
							width: "16",
							height: "16",
							viewBox: "0 0 24 24",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.6",
							"aria-hidden": "true",
							focusable: "false",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									cx: "12",
									cy: "12",
									r: "9"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									cx: "12",
									cy: "12",
									r: "4"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 12 20 4" }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									cx: "12",
									cy: "12",
									r: "1"
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: labelStyle,
							children: label
						})]
					}),
					showTooltip && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						id: tooltipId,
						role: "tooltip",
						style: tooltipStyle,
						children: text
					}),
					confirming && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: confirmStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("probeBubbleBody") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							style: confirmRowStyle$1,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: confirmButtonStyle,
								onClick: () => {
									setConfirming(false);
								},
								children: t("cancel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: primaryButtonStyle$1,
								onClick: () => {
									detect();
								},
								children: t("probeConfirmAction")
							})]
						})]
					}),
					note === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						role: "status",
						"aria-live": "polite",
						style: noteStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: noteText(t, note) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: noteDismissStyle,
							onClick: () => {
								setNote(void 0);
							},
							children: t("probeNoteDismiss")
						})]
					})
				]
			});
		}
		/** Compose the one-line outcome string the note bubble shows. */
		function noteText(t, result) {
			if (result.validation === "validating" && result.efforts.length > 0) return t("probeNoteVerified", { levels: result.efforts.join(" / ") });
			if (result.validation === "non-validating") return t("probeNoteNotValidating");
			return t("probeNoteUnknown");
		}
		//#endregion
		//#region src/client/WorkBuddyPluginCard.tsx
		/** WorkBuddy status card contributed to Harness Plugin configuration. */
		const POLL_INTERVAL_MS = 6e4;
		const cardStyle = {
			overflow: "hidden",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: 10,
			background: "var(--dsw-alias-bg-module-platform)"
		};
		const headerStyle = {
			boxSizing: "border-box",
			width: "100%",
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 16,
			border: 0,
			padding: "13px 14px",
			background: "transparent",
			color: "var(--dsw-alias-label-primary)",
			font: "inherit",
			textAlign: "left",
			cursor: "pointer"
		};
		const headTextStyle = {
			display: "flex",
			minWidth: 0,
			flexDirection: "column",
			gap: 3
		};
		const nameStyle = {
			fontSize: 14,
			lineHeight: "20px",
			fontWeight: 600
		};
		const descriptionStyle = {
			fontSize: 13,
			lineHeight: "18px",
			color: "var(--dsw-alias-label-tertiary)"
		};
		const chevronStyle = {
			flex: "0 0 auto",
			fontSize: 18,
			lineHeight: 1,
			transition: "transform 120ms ease"
		};
		const cardBodyStyle = {
			borderTop: "1px solid var(--dsw-alias-border-l2)",
			padding: "16px 14px 18px"
		};
		const bodyStyle = {
			margin: 0,
			fontSize: 14,
			lineHeight: "22px",
			color: "var(--dsw-alias-label-secondary)"
		};
		const rowStyle = {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			flexWrap: "wrap",
			gap: 12
		};
		const statusStyle = {
			display: "flex",
			alignItems: "center",
			gap: 9,
			fontSize: 15,
			fontWeight: 500,
			color: "var(--dsw-alias-label-primary)"
		};
		const buttonStyle = {
			boxSizing: "border-box",
			minHeight: 34,
			padding: "6px 14px",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: 18,
			background: "var(--dsw-alias-bg-layer-1)",
			color: "var(--dsw-alias-label-primary)",
			font: "inherit",
			fontSize: 14,
			cursor: "pointer"
		};
		const errorStyle = {
			...bodyStyle,
			color: "var(--dsw-alias-state-error-primary)"
		};
		const quotaListStyle = {
			display: "flex",
			flexDirection: "column",
			gap: 18,
			paddingTop: 2
		};
		const quotaGroupStyle = {
			display: "flex",
			flexDirection: "column",
			gap: 10
		};
		const quotaTitleStyle = {
			margin: 0,
			fontSize: 14,
			lineHeight: "20px",
			fontWeight: 600,
			color: "var(--dsw-alias-label-primary)"
		};
		const quotaLabelStyle = {
			display: "flex",
			justifyContent: "space-between",
			gap: 12,
			fontSize: 13,
			lineHeight: "20px",
			color: "var(--dsw-alias-label-secondary)"
		};
		const modelBadgeStyle = {
			display: "flex",
			alignItems: "center",
			gap: 6,
			flexWrap: "wrap"
		};
		const modelOfferStyle = {
			display: "flex",
			flexDirection: "column",
			gap: 2
		};
		const modelRateStyle = {
			fontSize: 12,
			lineHeight: "18px",
			color: "var(--dsw-alias-label-tertiary)"
		};
		const modelBadgeChipStyle = {
			padding: "1px 8px",
			borderRadius: 999,
			fontSize: 11,
			lineHeight: "18px",
			background: "var(--dsw-alias-state-success-subtle, rgba(34, 160, 107, 0.12))",
			color: "var(--dsw-alias-state-success-primary, #22a06b)"
		};
		/** Localize an upstream promotional badge label, with an unknown-badge fallback. */
		function modelBadgeLabel(badge, t) {
			if (badge === "限时免费") return t("badgeLimitedFree");
			if (badge === "夜间折扣") return t("badgeNightDiscount");
			return badge;
		}
		const progressTrackStyle = {
			height: 8,
			overflow: "hidden",
			borderRadius: 999,
			background: "var(--dsw-alias-bg-layer-2, rgba(0, 0, 0, 0.08))"
		};
		/**
		* Inline confirmation box for a paid detection. Replaces the previous
		* `window.confirm`: the decision is one line plus two buttons, and a modal
		* alert for that is heavier than the action it guards.
		*/
		const confirmBoxStyle = {
			display: "flex",
			flexDirection: "column",
			gap: 10,
			padding: "10px 12px",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: 8,
			background: "var(--dsw-alias-bg-layer-1)"
		};
		const confirmRowStyle = {
			display: "flex",
			justifyContent: "flex-end",
			gap: 8
		};
		/** One probeable model's row: name on the left, state and action on the right. */
		const probeRowStyle = {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 12
		};
		const probeRowEndStyle = {
			display: "inline-flex",
			alignItems: "center",
			gap: 8,
			flex: "0 0 auto"
		};
		/**
		* Tab strip for the card body. Kept visually light — a full pill would compete
		* with the section headings, and the card is already the densest surface the
		* plugin owns.
		*/
		const tabBarStyle = {
			display: "flex",
			gap: 4,
			marginTop: 4,
			borderBottom: "1px solid var(--dsw-alias-border-l2)"
		};
		const tabStyle = {
			padding: "6px 12px",
			border: 0,
			borderBottom: "2px solid transparent",
			background: "transparent",
			color: "var(--dsw-alias-label-tertiary)",
			font: "inherit",
			fontSize: 13,
			lineHeight: "20px",
			cursor: "pointer"
		};
		const tabActiveStyle = {
			borderBottom: "2px solid var(--dsw-alias-brand-primary)",
			color: "var(--dsw-alias-label-primary)",
			fontWeight: 600
		};
		const tabPanelStyle = {
			display: "flex",
			flexDirection: "column",
			gap: 18,
			paddingTop: 16
		};
		/**
		* Primary action of the inline confirmation. Fill and text colour come from the
		* theme as a pair: `brand-primary` is a light accent here, so pairing it with a
		* hardcoded white would render white-on-white.
		*/
		const primaryButtonStyle = {
			...buttonStyle,
			border: "1px solid var(--dsw-alias-button-primary-fill)",
			background: "var(--dsw-alias-button-primary-fill)",
			color: "var(--dsw-alias-label-primary-foreground)"
		};
		function progressFillStyle(percent) {
			return {
				width: `${Math.max(0, Math.min(100, percent))}%`,
				height: "100%",
				borderRadius: "inherit",
				background: "var(--dsw-alias-brand-primary, #1677ff)"
			};
		}
		function dotStyle(status) {
			return {
				width: 9,
				height: 9,
				borderRadius: "50%",
				flex: "0 0 auto",
				background: status === "signed-in" ? "var(--dsw-alias-state-success-primary, #22a06b)" : status === "error" ? "var(--dsw-alias-state-error-primary, #d92d20)" : "var(--dsw-alias-label-dimmed, #9aa0a6)"
			};
		}
		function formatNumber(value) {
			return new Intl.NumberFormat(void 0).format(value);
		}
		function formatTime(ms) {
			return new Intl.DateTimeFormat(void 0, {
				dateStyle: "medium",
				timeStyle: "short"
			}).format(new Date(ms));
		}
		/** One billing package as a labeled progress bar. */
		function CreditBar({ label, remain, size, t }) {
			const detail = size > 0 ? t("exactRemaining", {
				remain: formatNumber(remain),
				size: formatNumber(size)
			}) : t("creditPackageUnknownSize", { remain: formatNumber(remain) });
			const percent = size > 0 ? remain / size * 100 : 100;
			const display = new Intl.NumberFormat(void 0, { maximumFractionDigits: 1 }).format(percent);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: quotaGroupStyle,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: quotaLabelStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("percentRemaining", { percent: display }) })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: progressTrackStyle,
						role: "progressbar",
						"aria-label": label,
						"aria-valuemin": 0,
						"aria-valuemax": 100,
						"aria-valuenow": percent,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: progressFillStyle(percent) })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: bodyStyle,
						children: detail
					})
				]
			});
		}
		/**
		* One model offer row: name, promotional badges, and the billing rate.
		*
		* The rate sits under the name rather than beside it because the row already
		* spends its horizontal budget on badges; stacking keeps long model names and
		* several badges from squeezing the rate into an ellipsis.
		*/
		function ModelOfferRow({ model, t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: modelOfferStyle,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: quotaLabelStyle,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: model.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: modelBadgeStyle,
						children: [model.badges?.map((badge) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: modelBadgeChipStyle,
							children: modelBadgeLabel(badge, t)
						}, badge)), model.free === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: modelBadgeChipStyle,
							children: t("freeModel")
						}) : null]
					})]
				}), model.credits === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: modelRateStyle,
					children: t("rate", { rate: model.credits })
				})]
			});
		}
		/**
		* Context capacity, listed in full.
		*
		* Every model the upstream reports a capacity for, largest first. A one-line
		* summary with the exceptions on hover was tried and rejected: capacity is
		* reference data you scan by model, and hiding most of it behind a hover made
		* the common case (a model you already have in mind) the hard one to look up.
		*
		* Purely a report of the upstream's own number. The plugin offers no tier
		* picker: the catalog declares one capacity per model and publishes no
		* alternatives, so a menu would mean inventing client-side policy. (The
		* desktop app's "300K / 1M" selector appears nowhere in the API.)
		*/
		function ContextTable({ models, t }) {
			const known = (models ?? []).filter((model) => model.contextWindow !== void 0).sort((a, b) => b.contextWindow - a.contextWindow);
			if (known.length === 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: quotaListStyle,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
					style: quotaTitleStyle,
					children: t("contextHeading")
				}), known.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: quotaLabelStyle,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: model.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: formatTokens(model.contextWindow) })]
				}, model.id))]
			});
		}
		/**
		* Compact token count for display: the catalog's own round numbers (`200000`,
		* `1000000`) read better as `200K` / `1M`, and no precision is lost because
		* these values are always whole thousands.
		*/
		function formatTokens(tokens) {
			if (tokens >= 1e6 && tokens % 1e6 === 0) return `${tokens / 1e6}M`;
			if (tokens >= 1e3 && tokens % 1e3 === 0) return `${tokens / 1e3}K`;
			return String(tokens);
		}
		/**
		* Reasoning-effort detection section: consent switches, per-model detection,
		* and the recorded observations.
		*
		* Two deliberate UX rules from the plan (§3.1, §3.2):
		* - the confirmation is shown *before* any request, and its copy states the
		*   credit caveat;
		* - a `non-validating` result is presented as an observation about the
		*   parameter ("this model does not check it"), never as a statement that a
		*   level is unsupported.
		*/
		function ProbeSection({ probe, t, onDetect, onClear, busy }) {
			const [pending, setPending] = (0, react.useState)();
			const [runningModel, setRunningModel] = (0, react.useState)();
			(0, react.useEffect)(() => {
				if (pending !== void 0 && !probe.candidates.includes(pending)) setPending(void 0);
			}, [pending, probe.candidates]);
			const runningArmed = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				if (runningModel === void 0) return;
				if (busy || probe.running) {
					runningArmed.current = true;
					return;
				}
				if (!runningArmed.current) return;
				runningArmed.current = false;
				setRunningModel(void 0);
			}, [
				runningModel,
				busy,
				probe.running
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: quotaListStyle,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						style: quotaTitleStyle,
						children: t("probeHeading")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: bodyStyle,
						children: t("probeIntro")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: bodyStyle,
						children: t("probeConsentHint")
					}),
					probe.running ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: bodyStyle,
						children: t("probeRunningGeneric")
					}) : null,
					probe.candidates.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: bodyStyle,
						children: t("probeResultEmpty")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: quotaGroupStyle,
						children: probe.candidates.map((id) => {
							const result = probe.results.find((entry) => entry.id === id);
							const name = result?.name ?? id;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: modelOfferStyle,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: probeRowStyle,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: name }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											style: probeRowEndStyle,
											children: [result === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: modelBadgeChipStyle,
												children: result.validation === "validating" && result.efforts.length > 0 ? result.efforts.join(" / ") : t(result.validation === "non-validating" ? "probeResultNotValidating" : "probeResultUnknown")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												style: buttonStyle,
												disabled: probe.running || busy,
												onClick: () => {
													setPending(id);
												},
												children: runningModel === id ? t("probeRunning", { model: id }) : t(result === void 0 ? "probeStart" : "probeRedetect")
											})]
										})]
									}),
									result === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: modelRateStyle,
										children: t("probeResultAt", { time: formatTime(result.probedAt) })
									}),
									pending === id ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: confirmBoxStyle,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											style: bodyStyle,
											children: t("probeConfirmBody", { model: name })
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: confirmRowStyle,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												style: buttonStyle,
												onClick: () => {
													setPending(void 0);
												},
												children: t("cancel")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												style: primaryButtonStyle,
												disabled: probe.running || busy,
												onClick: () => {
													setRunningModel(id);
													setPending(void 0);
													onDetect(id);
												},
												children: t("probeConfirmAction")
											})]
										})]
									}) : null
								]
							}, id);
						})
					}),
					probe.results.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						style: buttonStyle,
						disabled: busy,
						onClick: () => {
							onClear();
						},
						children: t("probeClear")
					})
				]
			});
		}
		/** Render WorkBuddy sign-in state and credit as one expandable card. */
		function WorkBuddyPluginCard({ t }) {
			if (t === void 0) throw new Error("WorkBuddy plugin card requires its translation function");
			const [open, setOpen] = (0, react.useState)(false);
			const [status, setStatus] = (0, react.useState)({ status: "signed-out" });
			const [busy, setBusy] = (0, react.useState)(false);
			const [tab, setTab] = (0, react.useState)("status");
			const mounted = (0, react.useRef)(true);
			(0, react.useEffect)(() => {
				mounted.current = true;
				return () => {
					mounted.current = false;
				};
			}, []);
			const refresh = (0, react.useCallback)(async (signal) => {
				try {
					const response = await fetch(WORKBUDDY_STATUS_PATH, {
						headers: { accept: "application/json" },
						credentials: "same-origin",
						...signal === void 0 ? {} : { signal }
					});
					const value = await response.json().catch(() => void 0);
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					if (mounted.current && signal?.aborted !== true) setStatus(value);
				} catch (error) {
					if (mounted.current && signal?.aborted !== true) setStatus({
						status: "error",
						message: error instanceof Error ? error.message : t("requestFailed")
					});
				}
			}, [t]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const controller = new AbortController();
				refresh(controller.signal);
				return () => {
					controller.abort();
				};
			}, [open, refresh]);
			(0, react.useEffect)(() => {
				if (!open || status.status !== "signed-in") return;
				const controller = new AbortController();
				const timer = window.setInterval(() => {
					refresh(controller.signal);
				}, POLL_INTERVAL_MS);
				return () => {
					window.clearInterval(timer);
					controller.abort();
				};
			}, [
				open,
				refresh,
				status.status
			]);
			const manualRefresh = async () => {
				setBusy(true);
				try {
					await refresh();
				} finally {
					if (mounted.current) setBusy(false);
				}
			};
			/**
			* Run one control action and refresh the card's state afterwards.
			*
			* The key travels in a header, not the body: it authorizes the write, and
			* the host never accepts a prompt, a sentinel, or a model outside its own
			* catalog from here.
			*/
			const control = (0, react.useCallback)(async (action) => {
				const key = status.status === "signed-in" ? status.probeKey : void 0;
				if (key === void 0) return;
				setBusy(true);
				try {
					const response = await fetch(WORKBUDDY_PROBE_PATH, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"X-WorkBuddy-Probe-Key": key
						},
						credentials: "same-origin",
						body: JSON.stringify(action)
					});
					const value = await response.json().catch(() => void 0);
					if (!response.ok) {
						const message = typeof value === "object" && value !== null && "error" in value ? String(value["error"]) : `HTTP ${response.status}`;
						throw new Error(message);
					}
					await refresh();
				} catch (error) {
					if (mounted.current) setStatus((previous) => ({
						status: "error",
						message: error instanceof Error ? error.message : t("requestFailed")
					}));
				} finally {
					if (mounted.current) setBusy(false);
				}
			}, [
				refresh,
				status,
				t
			]);
			/**
			* Start a detection. Confirmation happens inline in the section, so this is
			* only ever called after the user has already agreed.
			*/
			const confirmDetect = (0, react.useCallback)((modelId) => {
				control({
					action: "probe",
					model: modelId
				});
			}, [control]);
			const title = t("title");
			const label = status.status === "signed-in" ? status.nickname === void 0 ? t("signedInAs", { nickname: "" }).replace(/[:：]\s*$/, "") : t("signedInAs", { nickname: status.nickname }) : status.status === "error" ? t("requestFailed") : t("signedOut");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				style: cardStyle,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					style: headerStyle,
					"aria-expanded": open,
					"aria-label": `${t(open ? "collapse" : "expand")}: ${title}`,
					onClick: () => {
						setOpen(!open);
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: headTextStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: nameStyle,
							children: title
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: descriptionStyle,
							children: t("intro")
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						style: {
							...chevronStyle,
							transform: open ? "rotate(180deg)" : "none"
						},
						children: "⌄"
					})]
				}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: cardBodyStyle,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
							style: quotaTitleStyle,
							children: t("accountHeading")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: rowStyle,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: statusStyle,
								role: "status",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									"aria-hidden": "true",
									style: dotStyle(status.status)
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label })]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: buttonStyle,
								disabled: busy,
								onClick: () => {
									manualRefresh();
								},
								children: busy ? t("refreshing") : t("refresh")
							})]
						}),
						status.status === "signed-in" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							status.expiresAt === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								style: bodyStyle,
								children: t("accessTokenExpires", { time: formatTime(status.expiresAt) })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								role: "tablist",
								style: tabBarStyle,
								children: [
									"status",
									"context",
									"details"
								].map((id) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									role: "tab",
									"aria-selected": tab === id,
									onClick: () => {
										setTab(id);
									},
									style: {
										...tabStyle,
										...tab === id ? tabActiveStyle : {}
									},
									children: t(id === "status" ? "tabStatus" : id === "context" ? "tabContext" : "tabDetails")
								}, id))
							}),
							tab === "status" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: tabPanelStyle,
								children: [
									status.credits === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: quotaListStyle,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: rowStyle,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
												style: quotaTitleStyle,
												children: t("creditsHeading")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: bodyStyle,
												children: t("creditsTotal", { total: formatNumber(status.credits.total) })
											})]
										})
									}),
									status.creditsError === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										style: errorStyle,
										children: t("creditsError", { message: status.creditsError })
									}),
									status.probe === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProbeSection, {
										probe: status.probe,
										t,
										busy,
										onDetect: confirmDetect,
										onClear: () => {
											control({ action: "clear" });
										}
									})
								]
							}) : tab === "context" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: tabPanelStyle,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ContextTable, {
									models: status.models,
									t
								})
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: tabPanelStyle,
								children: [status.credits === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: quotaListStyle,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
										style: quotaTitleStyle,
										children: t("creditsDetailHeading")
									}), status.credits.accounts.filter((account) => account.remain > 0).map((account, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CreditBar, {
										label: account.packageName,
										remain: account.remain,
										size: account.size,
										t
									}, `${account.packageName}-${String(index)}`))]
								}), status.models === void 0 || status.models.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: quotaListStyle,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
										style: quotaTitleStyle,
										children: t("modelsHeading")
									}), status.models.filter((model) => model.free === true || (model.badges?.length ?? 0) > 0).map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelOfferRow, {
										model,
										t
									}, model.id))]
								})]
							})
						] }) : null,
						status.status === "signed-out" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							style: bodyStyle,
							children: t("signedOutHint")
						}) : null,
						status.status === "error" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							style: errorStyle,
							children: status.message
						}) : null
					]
				}) : null]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** Plugin-card copy registered under the settings.workbuddy locale namespace. */
		const en = {
			title: "DSH WorkBuddy Connect",
			intro: "Use the models in the WorkBuddy desktop app directly in DSH — zero configuration, ready out of the box.",
			expand: "Expand",
			collapse: "Collapse",
			loading: "Loading account…",
			signedOut: "Not signed in",
			signedOutHint: "Sign in once in the WorkBuddy desktop app; this plugin follows that sign-in automatically.",
			signedInAs: "Signed in as {nickname}",
			accessTokenExpires: "Access token expires {time} (refresh is automatic)",
			creditsHeading: "Remaining credit",
			tabStatus: "Status",
			tabContext: "Context window",
			tabDetails: "Credit details",
			creditsDetailHeading: "By package",
			creditsTotal: "Total: {total}",
			percentRemaining: "{percent}% remaining",
			exactRemaining: "{remain} / {size} remaining",
			creditPackageUnknownSize: "{remain} remaining",
			creditsError: "Credit unavailable: {message}",
			refresh: "Refresh",
			refreshing: "Refreshing…",
			requestFailed: "Request failed",
			accountHeading: "Account",
			modelsHeading: "Model offers",
			contextHeading: "Context window",
			freeModel: "Free",
			badgeLimitedFree: "Limited-time free",
			badgeNightDiscount: "Night discount",
			rate: "{rate} credits per message",
			probeLabel: "Reasoning levels",
			probeTooltipIdle: "Detect the reasoning levels {model} accepts",
			probeTooltipVerified: "Accepted levels: {levels} · click to detect again",
			probeTooltipNotValidating: "This model does not check the effort parameter",
			probeTooltipRetry: "Detection did not complete · click to retry",
			probeBubbleBody: "Send test requests to confirm the available reasoning levels. May consume a small amount of credit.",
			probeConfirmAction: "Confirm",
			probeNoteVerified: "Detected: {levels}",
			probeNoteNotValidating: "This model does not check the effort parameter",
			probeNoteUnknown: "Detection did not complete",
			probeNoteDismiss: "Got it",
			probeHeading: "Reasoning effort detection",
			probeResultNoLevels: "No tested levels were accepted.",
			probeIntro: "Some models reason but declare no selectable effort levels. Detecting which levels a model accepts sends a few real requests that may consume credit.",
			probeConsent: "Authorize detection",
			probeConsentHint: "Each detection sends test requests to one model to confirm its available reasoning levels, and may consume a small amount of credit.",
			probeStart: "Detect",
			probeRedetect: "Detect again",
			probeRunning: "Detecting {model}…",
			probeRunningGeneric: "Detecting…",
			probeClear: "Clear detected results",
			probeCandidates: "Detectable models: {count}",
			probeConfirmBody: "Send test requests to {model} to confirm its available reasoning levels. May consume a small amount of credit.",
			cancel: "Cancel",
			probeResultVerified: "Verified levels: {levels}",
			probeResultNotValidating: "This model does not check the effort parameter",
			probeResultUnknown: "Detection did not complete",
			probeResultAt: "Detected {time}",
			probeResultEmpty: "No detectable models right now.",
			probeFailed: "Detection failed: {message}"
		};
		const zh = {
			title: "DSH WorkBuddy Connect",
			intro: "在 DSH 中直接使用 WorkBuddy 桌面 App 包含的模型，开箱即用，无需额外配置。",
			expand: "展开",
			collapse: "收起",
			loading: "正在读取账号…",
			signedOut: "未登录",
			signedOutHint: "在 WorkBuddy 桌面 App 里登录一次即可，插件会自动跟随当前登录的账号。",
			signedInAs: "已登录：{nickname}",
			accessTokenExpires: "访问令牌 {time} 过期（自动续期）",
			creditsHeading: "剩余积分",
			tabStatus: "状态",
			tabContext: "上下文窗口",
			tabDetails: "积分详情",
			creditsDetailHeading: "按套餐",
			creditsTotal: "合计：{total}",
			percentRemaining: "剩余 {percent}%",
			exactRemaining: "剩余 {remain} / {size}",
			creditPackageUnknownSize: "剩余 {remain}",
			creditsError: "积分查询失败：{message}",
			refresh: "刷新",
			refreshing: "正在刷新…",
			requestFailed: "请求失败",
			accountHeading: "账号",
			modelsHeading: "模型优惠",
			contextHeading: "上下文窗口",
			freeModel: "免费",
			badgeLimitedFree: "限时免费",
			badgeNightDiscount: "夜间折扣",
			rate: "{rate} 积分/次",
			probeLabel: "推理等级",
			probeTooltipIdle: "检测 {model} 可用的推理档位",
			probeTooltipVerified: "已接受：{levels} · 点击可重新检测",
			probeTooltipNotValidating: "该模型不校验该参数",
			probeTooltipRetry: "检测未完成 · 点击重试",
			probeBubbleBody: "发送探测请求以确认可用推理档位。可能消耗少量积分。",
			probeConfirmAction: "确认检测",
			probeNoteVerified: "已检测：{levels}",
			probeNoteNotValidating: "该模型不校验该参数",
			probeNoteUnknown: "检测未完成",
			probeNoteDismiss: "知道了",
			probeHeading: "推理档位检测",
			probeResultNoLevels: "本次测试的档位均未被接受。",
			probeIntro: "部分模型具备思考能力，但没有声明可选档位。检测会发送少量真实请求，可能消耗积分。",
			probeConsent: "授权检测",
			probeConsentHint: "每次检测会向该模型发送探测请求，以确认可用推理档位，可能消耗少量积分。",
			probeStart: "开始检测",
			probeRedetect: "重新检测",
			probeRunning: "正在检测 {model}…",
			probeRunningGeneric: "正在检测…",
			probeClear: "清除已探测结果",
			probeCandidates: "可检测模型：{count} 个",
			probeConfirmBody: "向 {model} 发送探测请求，以确认可用推理档位。可能消耗少量积分。",
			cancel: "取消",
			probeResultVerified: "已验证接受的档位：{levels}",
			probeResultNotValidating: "该模型不校验该参数",
			probeResultUnknown: "检测未完成",
			probeResultAt: "检测于 {time}",
			probeResultEmpty: "当前没有可检测的模型。",
			probeFailed: "检测失败：{message}"
		};
		//#endregion
		//#region src/client/index.tsx
		/** Stable browser-plugin name. */
		const name = "dsh-workbuddy-connect-client";
		/**
		* Client services required by the Plugin configuration contribution.
		*
		* DSH 0.1.2 removed `@deepseek-ai/dsh-client-runtime` (the package that used to
		* hold the browser `ClientContext` alias and the `slots` service). The services
		* this card relies on now come from narrower packages: the `slots` registry
		* moved to `@deepseek-ai/dsh-client-ui-renderer`, `locale` stayed in
		* `@deepseek-ai/dsh-client-locale`, and the `settings.plugin.item` slot is
		* declared by `@deepseek-ai/dsh-client-ui-settings-plugins`. All three are
		* named in the package's `dsh.client.inject` list, so cordis has activated
		* them before this plugin's fiber starts.
		*/
		const inject = ["slots", "locale"];
		/**
		* Register card copy and the WorkBuddy card under Plugin configuration.
		*
		* The entire body is wrapped so that a DSH slot-API breaking change (for
		* example the rc.6→rc.7 `id`→`key` / `order`→`priority` rename) degrades
		* to a `console.error` instead of throwing into the DSH loader and raising
		* the red "Failed to load plugins" banner. The host provider keeps working:
		* the `workbuddy` model channel is unaffected, and `dsh-workbuddy-connect
		* status` reports host health via the heartbeat file.
		*
		* NOTE: the try/catch boundary of this function is mirrored (duplicated) in
		* `tests/client-fallback.spec.ts`, because the real client entry imports
		* browser-only DSH packages that cannot load in the Node test environment.
		* That test therefore does not import this function — it replicates its
		* shape. If you change the guarded body or the `console.error` message here,
		* update the mirrored `apply()` in that spec too, or the fallback test will
		* silently diverge from this real implementation.
		*/
		function apply(ctx) {
			try {
				const namespace = "settings.workbuddy";
				ctx.effect(() => ctx.locale.register(namespace, {
					zh,
					en
				}), "dsh-workbuddy-connect: settings copy");
				const t = ctx.locale.bind(namespace);
				ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
					name: "settings.plugin.item",
					key: "workbuddy",
					priority: 30,
					inject: () => ({ t })
				}, WorkBuddyPluginCard));
				ctx.inject(["modelDirectories"], (scope) => {
					scope.slots.inject("conversation.input.right", () => scope.slots.register({
						name: "conversation.input.right",
						id: "workbuddy-probe",
						order: 10,
						inject: (sessionId) => ({
							directory: scope.modelDirectories.directoryFor(sessionId).store,
							t
						})
					}, WorkBuddyProbeControl));
				});
			} catch (error) {
				console.error("[dsh-workbuddy-connect] client card failed to load (host provider unaffected):", error);
			}
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
