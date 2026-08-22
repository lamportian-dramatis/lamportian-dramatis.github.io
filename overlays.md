---
title: Overlays
---

# `overlays`

An escape hatch for drawing arbitrary [CeTZ](https://typst.app/universe/package/cetz/) into a diagram, in the diagram's own coordinates, addressing the diagram's own points — and at a chosen depth, so a drawing can sit behind what the diagram draws as readily as in front of it.

```typ
lamport-diagram(
  caption: none,
  replicas: (),
  events: (:),
  orientation: horizontal,
  overlays: none,
  ...
)
```

## Shape

`overlays` takes `none`, a bare CeTZ body, a function of one argument — the *locator* — returning a CeTZ body, or a dictionary from layer name to either of those.  A body or a function on its own goes in the `foreground`, that being what you want when you have not thought about depth.

```typ
overlays: none                                // nothing

overlays: { grid((0, 0), (8, -3)) }           // a bare body, for when you need no points

overlays: d => {                              // a function, for when you want the diagram's points
  let (mark, ..) = d
  circle(mark("A", "bad"), radius: 0.3, stroke: red)
}

overlays: (                                   // a dictionary, for when depth matters
  backdrops: d => { ... },
  marks: d => { ... },
)
```

Everything is spliced into the diagram's own `cetz.canvas`, so a coordinate is a canvas centimetre and every CeTZ coordinate form — `rel:`, `to:`, anchors on elements you name yourself — works as it does anywhere else.  It all runs inside the same `context` the diagram uses, so `measure` is available.

The locator is a dictionary; unpack the entries a layer needs and call them.

## Layers

Each key names the stratum your drawing goes **on top of**.  `background` is the bookend below all of them, `foreground` the one above.

| Layer | Above | Below | For |
| --- | --- | --- | --- |
| `background` | — | everything | a wash behind the whole diagram |
| `arrows` | the message and `sync` arrows, and their labels | the lane backdrops | annotating an arrow, with the lanes still passing in front |
| `backdrops` | the backdrops that erase an arrow crossing a lane | the timelines | a band behind the lanes and *not* washed by them |
| `timelines` | the lane lines and the replica names | the marks | something along a lane that its own dots sit on top of |
| `marks` | the dots | the event labels | a ring round a dot that its label stays readable over |
| `foreground` | everything | — | annotation meant to be read over the drawing |

The order is the table's, never the dictionary's: a dictionary that happens to list `foreground` first still draws it last.  A key that is not one of the six fails compilation, and says which six.

### `arrows` and `backdrops` are not the same place

They sound like one place — "just above the arrows", "just under the lanes" — and the difference between them is most of why the layering is worth having.

A lane occupies a strip, not a line, and that whole strip erases what runs behind it, so an arrow crossing a lane it has no endpoint on reads as passing *under* that lane.  The eraser is a near-white backdrop five points wide, laid along every lane before any lane is drawn.

A drawing at `arrows` is erased by it, exactly as the arrows are.  A drawing at `backdrops` is not.  Put a heavy fill at `arrows` and it comes out with a pale stripe washed through it at each lane; put the same fill at `backdrops` and it comes out whole, still behind the timelines.

Which one is right depends on what you meant.  A note belonging to one arrow reads better at `arrows`, breaking around the lanes the way its arrow does.  A band standing for a stretch of time belongs at `backdrops`: it is not something the lanes should be in front of, it is the ground they stand on.

## Addressing a point

Every point on a lane is `(replica, id)`.  An id need only be unique *within its own lane*, which is what lets a `sync`'s two ends and a message's two ends keep the name that pairs them:

```typ
mark("A", "bad")        // an event, by the id it was given
mark("S", "a-pushes")   // this end of the sync;  mark("A", "a-pushes") is the other
mark("C", "c-pushes")   // the send;  mark("S", "c-pushes") is its recv
```

`send`, `recv` and `sync` already carry a name, and that name is their id.  A local `event` has none, so it takes one:

```typ
"A": ([`A.1`], event(id: "bad")[`A.2`], sync("a-pushes")),
```

Ids are opt-in on purpose.  The alternative — addressing an event by where it sits, `A.0`, `A.1`, … — would put back exactly the fragility that solving the columns removed: insert one event and every drawing below it points silently at the wrong dot.  An id you wrote survives the insert.

Two points on one lane may not share an id, and that is an error rather than a silent win for whichever came first.

### By index

Anywhere an id is taken an integer is taken too, addressing the lane positionally, **1-based**, counting *every* item in the lane's array including `gap` and `idle`:

```typ
mark("A", 1)      // the lane's opening item
mark("A", 3)
mark("A", -1)     // the last item -- the one index that survives an insert
column("B", 2)    // and the same wherever else a point is asked for
```

Ids are strings and indices are integers, so the two never need telling apart by hand.  An index is what to reach for when naming a one-off is not worth it — bearing in mind that it moves when you insert an event above it, which is exactly what an id does not do.

## What the locator holds

| | |
| --- | --- |
| `mark(replica, id-or-index)` | The **coordinate** of that point's mark, including the sub-column `displacement` that leans its arrow.  Where to draw. |
| `column(replica, id-or-index)` | The **column** the solver put that point in, as an integer.  A moment in logical time, carrying no lane and no displacement. |
| `point(col, lane)` | The coordinate of a column on a lane.  Both are fractional: `point(2.5, 0.5)` is half a column on, halfway between lanes 0 and 1.  `lane` may also be a replica id. |
| `lane(replica)` | The two ends of that replica's drawn timeline, as `(start, end)` — where the line actually begins and ends, which is a nudge before the first column and a fraction of `col-gap` past the last mark. |
| `replicas` | The replica ids, in order. |
| `ncols` | How many columns the diagram was solved into. |
| `orientation` | Which way this diagram runs, as its canonical name. |
| `col-gap`, `row-gap`, `dot` | The diagram's own measurements, in canvas centimetres. |

`mark` and `column` differ by type, and that is the whole distinction.  You need the integer whenever what you are drawing spans lanes, because `mark` bakes in the lane of the replica you asked about:

```typ
overlays: (
  backdrops: d => {
    let (column, point, ..) = d
    rect(
      point(column("C", "c-reads"), 0),
      point(column("A", "a-catches-up"), -1),
      fill: yellow.transparentize(85%),
      stroke: none,
    )
  },
)
```

`mark("C", "c-reads")` cannot start that rectangle: it sits on C's lane, not on the first one.  So the two compose — `column` gets the moment, `point` puts it on whichever lane you meant.

`column` is also what to reach for when you want to *reason* rather than draw.  `column("A", "x") == column("B", "y")` is "the solver found nothing ordering these two", which is a real question to ask of a Lamport diagram.

The measurements are there so a drawing can speak the diagram's own language.  A brace half a column clear of the last mark stays half a column clear when you retune `col-gap`; one written as `+1.0` does not.

## Staying orientation-independent

`point(col, lane)` is stated in the diagram's own axes — columns of logical time, and lanes across them — so a drawing written in terms of it survives a flip from `horizontal` to `vertical`.  One written against raw `(x, y)` arithmetic does not:

```typ
let (point, ..) = d
line(point(2, "A"), point(2, "C"))   // flips cleanly
line((4, 0), (4, -3))                // does not
```

Fractional lanes are what make this work for nudges too.  "Just off the lane, towards the next one" is `point(c, 0.15)` whichever way the diagram runs, where a page-space `(0, -0.3)` would point the wrong way the moment it turned.

`lane` hands back two plain coordinates rather than trying to be clever about sides, for the same reason a caller usually wants to nudge them:

```typ
overlays: (
  timelines: d => {
    let (lane, ..) = d
    let (s, e) = lane("B")
    line(s, e, stroke: (paint: red, dash: "dashed"))
  },
)
```

That line lies along the lane, so the layer is what decides whether it shows: at `backdrops` the lane's own stroke would cover it, at `timelines` it is drawn over that stroke instead.  To sit *beside* the lane rather than on it, give it a fractional lane of its own — `point(0, 1.12)` to `point(ncols - 1, 1.12)`.

## Errors

- An unknown replica id, an unknown point id, or an index past the end of a lane fails compilation, naming what was asked for and what that lane actually holds.
- Two points on one lane sharing an id fails compilation.
- A layer name that is not one of the six fails compilation, and says which six.
- An `overlays` that is none of `none`, a dictionary, a function of one argument, or a CeTZ body fails compilation.

## Worked example

```typ
#lamport-diagram(
  replicas: (replica("S", above, color: luma(0)), replica("A", below), replica("C", below)),
  events: (
    "S": (sync("boot"), send("c-reads"), sync("a-pushes"), recv("c-pushes"), sync("a-catches-up")),
    "C": (recv("c-reads"), event(id: "c1")[`C.1`], send("c-pushes")),
    "A": ([`A.1`], sync("boot"), event(id: "a2")[`A.2`], sync("a-pushes"), sync("a-catches-up")),
  ),
  overlays: (
    // The window in which the two clients disagree.  Behind the lanes, but in front of the
    // backdrops, so the lanes do not wash a stripe through it.
    backdrops: d => {
      let (column, point, ..) = d
      rect(
        point(column("C", "c1"), 0),
        point(column("A", "a-catches-up"), -1),
        fill: red.transparentize(93%),
        stroke: none,
      )
    },
    // Over the dot, under its label.
    marks: d => {
      let (mark, dot, ..) = d
      circle(mark("A", "a2"), radius: dot * 3, stroke: red + 0.7pt)
    },
  ),
)
```

## Open questions

- **`backdrops` as a name.**  It is the word the code uses, which makes it an implementation detail showing through the API.  `under-lanes` says the position instead of the mechanism, at the cost of no longer naming the stratum it sits above, as every other key does.
- **Is `timelines` pulling its weight?**  `backdrops` and `marks` bracket it closely, and the dashed line above is the only use I can name.  If nothing else wants it, five layers are easier to hold in the head than six.
- **Arrays per layer.**  Should `(foreground: (a, b))` be two independent drawings, or is one value per layer enough, leaving the caller to concatenate?
- **Labels.**  Should the locator reach a point's *label* as well as its mark, so a drawing can box one or point at it?  The diagram measures every label already, so the size is there for the taking; the question is whether it earns another entry.
- **`band`.**  Is a `band(from, to)` convenience — the rectangle in the example, across every lane — worth having, or is `point` twice clear enough?
- **Naming `mark`.**  It is the library's own word for the dot, but it reads oddly next to CeTZ's own `mark:` argument on `line`.  `at` is unavailable, since a dictionary already answers to it; `pos` and `locate` are the other candidates.

## What this costs to build

Today each lane draws its line, its name, its marks *and* its labels before the next lane starts.  For `timelines` and `marks` to be real seams, that loop has to split into three passes over all lanes.

Worth knowing, because it changes existing output — slightly, and for the better.  At present a lower lane's timeline can paint over an upper lane's label where the two overlap, the lower lane being drawn later; after the split every label is above every line.
