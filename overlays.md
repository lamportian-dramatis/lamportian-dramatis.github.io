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

A diagram is drawn in a fixed sequence of passes: the arrows first, then the backdrops that erase them wherever a lane crosses, then the timelines, then the marks, then the labels.  Each pass is a **layer**, and each key of `overlays` names one.

A drawing given for a layer is **appended to that layer's pass** — after everything the diagram itself draws there, and before anything in any later pass.  So `arrows: ...` draws with the arrows: over them, under everything that follows.  That is the whole rule.

`background` and `foreground` are not passes of the diagram.  They are bookends that exist only for overlays, one before the first pass and one after the last, and whatever you put there is all they hold.

Bottom to top:

| Layer | Content | Usage in `overlays` |
| --- | --- | --- |
| `background` | -- | a wash behind the whole diagram, striped by the backdrops like everything under them |
| `arrows` | the message and `sync` arrows, and their labels | annotating one arrow, with the lanes still passing over your drawing the way they pass over its arrow |
| `backdrops` | the near-white paint that hides an arrow wherever a lane crosses it | a band that comes out even rather than striped, still under every lane |
| `timelines` | the lane lines and the replica names | something along a lane that the lane's own dots sit on top of |
| `marks` | the dots | a ring round a dot that the dot's own label stays readable over |
| `foreground` | -- | annotation meant to be read over the whole drawing |

The order is the table's, never the dictionary's: a dictionary that happens to list `foreground` first still draws it last.  A key that is not one of the six fails compilation, and says which six.

There is no `labels` key, though labels are a pass of the diagram like the rest.  Appending to it would put a drawing after the last thing the diagram draws, which is where `foreground` already is; one place does not need two names.

### `arrows` and `backdrops` are not the same place

They sound like one place — "just above the arrows", "just under the lanes" — and the difference between them is most of why the layers are worth having.

The erasing that makes an arrow pass *behind* a lane is done with paint, not with transparency.  Before any lane is drawn, the diagram strokes a near-white line five points wide along every lane, and lays a disc of the same near-white under every mark.  That is the `backdrops` pass.  On a white page the paint shows nowhere it has nothing to cover; where an arrow crosses a lane it covers the arrow, and the arrow reads as running underneath.

So nothing is washed by *the lanes*.  Things are washed by that paint, and whether yours is washed depends only on which side of it you drew:

- At `background` or `arrows` you draw first and the paint goes down over you.  A fill comes out with a pale five-point stripe along every lane, exactly as the arrows do.
- At `backdrops` the paint is already down and you draw over it.  A fill covers page and paint alike, so it comes out even — and still sits under the timelines, the marks and the labels, all of which come later.

Which you want depends on what the drawing means.  A note belonging to one arrow reads better at `arrows`, breaking around the lanes the way its own arrow does.  A band standing for a stretch of time belongs at `backdrops`: it is not something the lanes should be in front of, it is the ground they stand on.

(The paint is white whatever the page is.  Give the page a `fill` other than white and the lanes will show as white stripes over anything behind them — including a `background` drawing — because the erasure was never transparency in the first place.)

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

Four kinds of value pass through the locator, and it is worth keeping them apart.

- A **time** is a position along logical time, measured in columns.  It is a real number and may be any of them: `2.5` falls halfway between two columns, `-0.09` falls before the diagram's first one.
- A **column** is one of the whole times the solver hands out, `0` up to `ncols - 1`.  Every column is a time; most times are not columns.  This is the discrete thing the layout reasons about, and the only kind that can answer "did these two land at the same moment".
- A **lane** is a position across the replicas, measured in lanes, and likewise a real number: `0` is the first replica, `1` the second, `0.5` between them.  A replica id is accepted wherever a lane is.
- A **coordinate** is a CeTZ point, `(x, y)` in canvas centimetres.  It is what every CeTZ function wants, and the only kind here that knows which way the diagram runs.

A time and a lane together make a coordinate, and `point` is the one entry that does that conversion.  Everything else either hands you a coordinate outright or stays in times and lanes, where it survives a change of orientation.

| Entry | Gives | |
| --- | --- | --- |
| `mark(replica, id-or-index)` | a coordinate | Where that point's mark is drawn, including the sub-column `displacement` that leans its arrow. |
| `column(replica, id-or-index)` | a column | Which column the solver put that point in.  Carries no lane and no displacement. |
| `point(time, lane)` | a coordinate | The page position of a time on a lane. |
| `span` | two times | The time each lane's line starts at, and the time it ends at.  The first is slightly negative, because a lane leads in a little before column `0`; the second is past `ncols - 1`, because the line runs on beyond the last mark to carry its arrowhead.  Neither is a column, which is what the distinction above is for.  Every lane is drawn over the same stretch, so there is one pair for the whole diagram and no replica to ask about. |
| `replicas` | strings | The replica ids, in order.  The id at index `n` is the replica on lane `n`. |
| `ncols` | a count | How many columns the diagram was solved into, so the last of them is `ncols - 1`. |
| `orientation` | a string | Which way this diagram runs, as its canonical name. |
| `col-gap`, `row-gap`, `dot` | lengths | The diagram's own measurements, in canvas centimetres — one column of time, one lane, and the radius of an event's dot. |

`mark` and `column` ask the same question and answer in different kinds, and that is the whole distinction.  You want the column whenever what you are drawing crosses lanes, because a coordinate has a lane baked into it — the lane of the replica you named.  A column is a time, so it goes straight into `point`:

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

`point(time, lane)` is stated in the diagram's own axes — logical time along the lanes, and lanes across it — so a drawing written in terms of it survives a flip from `horizontal` to `vertical`.  One written against raw `(x, y)` arithmetic does not:

```typ
let (point, ..) = d
line(point(2, "A"), point(2, "C"))   // flips cleanly
line((4, 0), (4, -3))                // does not
```

Fractional lanes are what make this work for nudges too.  "Just off the lane, towards the next one" is `point(c, 0.15)` whichever way the diagram runs, where a page-space `(0, -0.3)` would point the wrong way the moment it turned.

`span` stays in times for the same reason, and it is what lets a drawing run the full length of a lane without knowing where on the page that lane falls:

```typ
overlays: (
  timelines: d => {
    let (span, point, ..) = d
    let (s, e) = span
    line(point(s, "B"), point(e, "B"), stroke: (paint: red, dash: "dashed"))
  },
)
```

That line lies along the lane, so the layer decides whether it shows at all: at `backdrops` the lane's own stroke would cover it, at `timelines` it is drawn over that stroke instead.  To sit *beside* the lane rather than on it, feed the same span to a fractional lane — `point(s, 1.12)` to `point(e, 1.12)` — which is the pairing coordinates would not have allowed.

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

- **`backdrops` as a name.**  It is the word the code uses, which makes it an implementation detail showing through the API.  `under-lanes` says the position instead of the mechanism, at the cost of no longer naming the layer it sits above, as every other key does.
- **Is `timelines` pulling its weight?**  `backdrops` and `marks` bracket it closely, and the dashed line above is the only use I can name.  If nothing else wants it, five layers are easier to hold in the head than six.
- **Arrays per layer.**  Should `(foreground: (a, b))` be two independent drawings, or is one value per layer enough, leaving the caller to concatenate?
- **Labels.**  Should the locator reach a point's *label* as well as its mark, so a drawing can box one or point at it?  The diagram measures every label already, so the size is there for the taking; the question is whether it earns another entry.
- **`band`.**  Is a `band(from, to)` convenience — the rectangle in the example, across every lane — worth having, or is `point` twice clear enough?
- **Naming `mark`.**  It is the library's own word for the dot, but it reads oddly next to CeTZ's own `mark:` argument on `line`.  `at` is unavailable, since a dictionary already answers to it; `pos` and `locate` are the other candidates.

## What this costs to build

Today each lane draws its line, its name, its marks *and* its labels before the next lane starts.  For `timelines` and `marks` to be real seams, that loop has to split into three passes over all lanes.

Worth knowing, because it changes existing output — slightly, and for the better.  At present a lower lane's timeline can paint over an upper lane's label where the two overlap, the lower lane being drawn later; after the split every label is above every line.
