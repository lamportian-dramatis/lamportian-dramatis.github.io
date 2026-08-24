---
title: Gallery
---

# Gallery

Every example that ships with the package, each one a complete standalone document.  The pictures on the other pages are drawn by these, and this is where their source lives.

They compile against the published package by its exact version, the way the [Typst Universe](https://typst.app/universe/package/lamportian-dramatis/) linter asks an example to.  Four of the six stand on their own; the two vertical ones import the arguments their horizontal sibling declares and override the orientation, that being the whole of the difference between the two pictures.

## [`gorgeous.typ`](https://github.com/mvaled/lamportian-dramatis/blob/main/gallery/gorgeous.typ)

![A fictional scenario showing a convergence bug in a fictional system](gallery/gorgeous.png)

Three replicas, two-way exchanges, a one-way message and a label saying what went wrong.  It is the diagram the [front page]({% link index.md %}) leads with, and the one whose code is printed there.

## [`vertical.typ`](https://github.com/mvaled/lamportian-dramatis/blob/main/gallery/vertical.typ)

![The same scenario drawn vertically, the timelines running down the page](gallery/vertical.png)

The same scenario under `orientation: vertical`, and *nothing* else changed — the arguments are the ones `gorgeous.typ` declares:

```typ
#import "gorgeous.typ": diagram

#lamport-diagram(..diagram, orientation: vertical)
```

The timelines lay out as columns, the replicas stack rightwards, and the label sides that the horizontal diagram names are dropped back to the side a vertical lane has room for, rather than having to be restated.  See [`orientation`]({% link reference.md %}#orientation).

## [`overlays.typ`](https://github.com/mvaled/lamportian-dramatis/blob/main/gallery/overlays.typ)

![The future cone of one event, washed behind the lanes, with a ring round the event itself](gallery/overlays.png)

The future cone of `A.2`, drawn at `backdrops` so the lanes cross it without fading a stripe through it, and a ring at `marks` so `A.2`'s own label stays legible over it.  The [overlays]({% link overlays.md %}) page walks through the whole of it.

## [`vertical-overlays.typ`](https://github.com/mvaled/lamportian-dramatis/blob/main/gallery/vertical-overlays.typ)

![The same future cone in a vertical diagram, the cone opening downwards](gallery/vertical-overlays.png)

The same cone in a vertical diagram, imported from `overlays.typ` the same way — the overlay included.  The drawing is written in columns and lanes rather than in page coordinates, so it turns with the diagram instead of being redrawn for it, which is the point of [staying orientation-independent]({% link overlays.md %}#staying-orientation-independent).

## [`legend.typ`](https://github.com/mvaled/lamportian-dramatis/blob/main/gallery/legend.typ)

![A diagram with each of its parts named: a sync, a local event, a send and the receive it feeds, an elided stretch of time, and a timeline of its own](gallery/legend.png)

Every part of a diagram named, each with a rectangle from the locator round it — or a ring built out of `mark` and `dot` — and a note hung off that.  The callouts are drawn at `foreground`, so they read over the whole diagram; the rings at `marks`, so each dot's own label stays legible over the ring round it.  It is the picture the [guide]({% link guide.md %}) opens on.

## [`locators.typ`](https://github.com/mvaled/lamportian-dramatis/blob/main/gallery/locators.typ)

![Two replicas crossed by dotted guides: one at column 1, which is time 1 as well; a pair at the message, one on the column the solver settled on and one on the time the receiving end was drawn at, with the displacement between the two measured; and one running along lane 0.5, between the replicas](gallery/locators.png)

Dotted guides at a column, at a time and along a lane, with the gap between a message's column and the time its receiving end was drawn at measured out.  It draws the [kinds of value]({% link overlays.md %}#terminology-values-and-types) a locator answers in.
