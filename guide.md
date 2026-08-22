---
title: Guide
---

# Guide

## Columns are (mostly) solved, not authored

You list each replica's local events in order and name the messages.  The layout then puts every event in the earliest column that keeps it after its predecessor on the same replica *and* after the send of every message it receives.

Two things follow.  A diagram stays correct while you insert events — nothing needs re-padding, because no horizontal position was ever written by hand.  And a receive that would land before its own send is a causal cycle, which fails compilation instead of quietly drawing a backwards arrow.

## Reading a diagram

| Mark | Meaning |
| --- | --- |
| Solid dot | A purely local step. |
| Hollow dot | The replica touches the network here; the attached arrow says in which direction, and a two-headed one says both. |
| Small hollow dot | A send, drawn smaller than the receive it feeds, so the two ends of a message stay tellable apart without tracing the arrow.  The two ends of a `sync` are the same size, because neither of them is the sender. |
| Dotted timeline | Elided time — events the diagram does not show. |

A receive is drawn by default a centimeter to the right of its send, so every message arrow follows the standard direction of time without the diagram needing padding put in by hand.  `recv(..., displacement: none)` puts it in the send's own column instead, for a vertical arrow.

Labels are centred on their own mark and sit above the timeline — except a lane's opening label, nudged right so it does not read as belonging to the replica name at its left.  `event` overrides both for one event, `replica` for a whole lane.

Arrows are drawn first and everything else on top, so an arrow that crosses a lane it has no endpoint on passes *under* that lane rather than striking through it.  A lane erases across the whole strip it occupies, marks included: each mark clears the same annulus that an arrow landing on it would stop short of, so a passing arrow breaks around a dot instead of running into its edge.  Labels knock out the arrow behind them for the same reason.

## Figures and cross-references

Attach the `<label>` *after* the call.  With a `caption` the function returns a `figure`, so the reference resolves to it and it numbers alongside the document's other figures.

```typ
#lamport-diagram(
  caption: [`DeleteFile1` can be applied twice under concurrency],
  replicas: ("B", replica("A", below)),
  events: (
    "B": ([AddFile1], send("push"), [DeleteFile1], recv("pull", size: 0.8em)[now duplicated]),
    "A": (recv("push", displacement: none), [DeleteFile1], send("pull")),
  ),
) <fig-duplicated-delete>

As @fig-duplicated-delete shows, ...
```
