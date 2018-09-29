export {Maybe, Just, Nothing, match, withDefault, map, map2, map3, andThen};

// TYPES

type Maybe<A> = Just<A> | Nothing;

type Just<A> = {$: 'Just'; a: A};

type Nothing = {$: 'Nothing'};

// TYPE CONSTRUCTORS

const Just = <A>(data: A): Maybe<A> => ({
  $: 'Just',
  a: data,
});

// TODO: Decide if we want Nothing() or Nothing
const Nothing = (): Nothing => ({
  $: 'Nothing',
});

// PATTERN MATCHING

// Object that encodes a match
type MatchDefinition<DataType, ReturnType> = {
  Just: (a: DataType) => ReturnType;
  Nothing: () => ReturnType;
};

/** Function that allows pattern-matching on the tag of Maybe
 * @todo: Decide on whether to call this "case" or "switch" instead
 * Could be called "fold" I guess, but I like match more...
 * @todo: Add curried version?
 * @todo: Figure out if we can have some convenience on the parameters
 */
const match = <DT, RT>(maybe: Maybe<DT>, matchDef: MatchDefinition<DT, RT>) => {
  switch (maybe.$) {
    case 'Just':
      return matchDef.Just(maybe.a);
    case 'Nothing':
      return matchDef.Nothing();
  }
};

// TODO: Pipe helper, for readability

// HELPERS

const withDefault = <A>(def: A, maybe: Maybe<A>): A =>
  match(maybe, {
    Just: a => a,
    Nothing: () => def,
  });

// MAPPING
// TODO: Figure out how to avoid the pyramid of doom

/** Apply function a -> b if the data exists, and propagate Nothing otherwise
 * (a -> b) -> Maybe a -> Maybe b
 */
const map = <A, B>(fn: (a: A) => B, maybe: Maybe<A>): Maybe<B> =>
  match(maybe, {
    Just: a => Just(fn(a)),
    Nothing: Nothing,
  });

// TODO: GUARDS

/** Apply a function if all the arguments are Just a value.
 */
// const map2 = <A, B, V>(
//   fn: (a: A, b: B) => V,
//   maybeA: Maybe<A>,
//   maybeB: Maybe<B>
// ): Maybe<V> => andThen(a => andThen(b => Just(fn(a, b)), maybeB), maybeA);

const map2 = <A, B, V>(
  fn: (a: A, b: B) => V,
  ma: Maybe<A>,
  mb: Maybe<B>
): Maybe<V> =>
  match(ma, {
    Nothing: Nothing,
    Just: a =>
      match(mb, {
        Just: b => Just(fn(a, b)),
        Nothing: Nothing,
      }),
  });

const map3 = <A, B, C, V>(
  fn: (a: A, b: B, c: C) => V,
  ma: Maybe<A>,
  mb: Maybe<B>,
  mc: Maybe<C>
): Maybe<V> =>
  match(ma, {
    Nothing: Nothing,
    Just: a =>
      match(mb, {
        Just: b =>
          match(mc, {
            Just: c => Just(fn(a, b, c)),
            Nothing: Nothing,
          }),
        Nothing: Nothing,
      }),
  });

/** Chain together computations that may fail.
 *
 * Aside: It is interesting to see this in relation to match, since it is the case where
 * we propagate Nothing on the Nothing case, instead of something custom.
 */
const andThen = <A, B>(fn: (a: A) => Maybe<B>) => (maybe: Maybe<A>): Maybe<B> =>
  match(maybe, {
    Just: fn,
    Nothing: Nothing,
  });
