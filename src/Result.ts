export {
  Result,
  Ok,
  Err,
  match,
  matchC,
  withDefault,
  map,
  map2,
  map3,
  andThen,
  mapErr,
  mapBoth,
  toMaybe,
  fromMaybe,
};

import * as Maybe from './Maybe';

// TYPES

type Result<Error, Value> = Ok<Value> | Err<Error>;

type Ok<Value> = {$: 'Ok'; a: Value};

type Err<Error> = {$: 'Err'; a: Error};

// TYPE CONSTRUCTORS

const Ok = <X, V>(value: V): Result<X, V> => ({
  $: 'Ok',
  a: value,
});

// TODO: Decide if we want Err() or Err
const Err = <X, V>(error: X): Result<X, V> => ({
  $: 'Err',
  a: error,
});

// PATTERN MATCHING

// Object that encodes a match
type MatchDefinition<Error, Value, ReturnType> = {
  Ok: (value: Value) => ReturnType;
  Err: (error: Error) => ReturnType;
};

/** Function that allows pattern-matching on the tag of Result
 */
const match = <E, V, RT>(result: Result<E, V>, matchDef: MatchDefinition<E, V, RT>) => {
  switch (result.$) {
    case 'Ok':
      return matchDef.Ok(result.a);
    case 'Err':
      return matchDef.Err(result.a);
  }
};

/** Curried version of match. Useful for separating behaviour from data.
 * @todo: Perhaps there is a nice way to merge this with match?
 */
const matchC = <E, V, RT>(matchDef: MatchDefinition<E, V, RT>) => (result: Result<E, V>) =>
  match<E, V, RT>(result, matchDef);

// HELPERS

// NOTE: withDefault can also be `def => result => either(identity, err => def)`

/** Return the value if Ok, otherwise return a default value. */
const withDefault = <V>(def: V, result: Result<any, V>): V =>
  match(result, {
    Ok: a => a,
    Err: _err => def,
  });

// MAPPING

/** Apply function a -> b if the result is Ok, and propagate Err otherwise
 *  (a -> value) -> Result x a -> Result x value
 */
const map = <E, VA, VB>(fn: (a: VA) => VB, result: Result<E, VA>): Result<E, VB> =>
  match(result, {
    Ok: a => Ok(fn(a)),
    Err: e => Err(e),
  });

/** Apply a function if all the arguments are Ok.
 *  If not, the first `Err` will propagate through.
 */
const map2 = <A, B, E, V>(
  fn: (a: A, b: B) => V,
  ra: Result<E, A>,
  rb: Result<E, B>
): Result<E, V> =>
  match(ra, {
    Err: e => Err(e),
    Ok: a =>
      match(rb, {
        Ok: b => Ok(fn(a, b)),
        Err: e => Err(e),
      }),
  });

const map3 = <A, B, C, E, V>(
  fn: (a: A, b: B, c: C) => V,
  ra: Result<E, A>,
  rb: Result<E, B>,
  rc: Result<E, C>
): Result<E, V> =>
  match(ra, {
    Err: e => Err(e),
    Ok: a =>
      match(rb, {
        Ok: b =>
          match(rc, {
            Ok: c => Ok(fn(a, b, c)),
            Err: e => Err(e),
          }),
        Err: e => Err(e),
      }),
  });

/** Transform the Err branch. Useful for converting between error types.
 */
const mapErr = <EA, EB, V>(fn: (errA: EA) => EB, result: Result<EA, V>): Result<EB, V> =>
  match(result, {
    Ok: a => Ok(a),
    Err: e => Err(fn(e)),
  });

/** Apply functions to both parts of Result, transforming the types.
 * Also known as bimap.
 */
const mapBoth = <EA, VA, EB, VB>(
  mapErr: (err: EA) => EB,
  mapOk: (value: VA) => VB,
  resA: Result<EA, VA>
): Result<EB, VB> =>
  match(resA, {
    Ok: value => Ok(mapOk(value)),
    Err: err => Err(mapErr(err)),
  });

/** Chain together computations that may fail.
 *
 * Aside: It is interesting to see this in relation to match, since it is the case where
 * we propagate Err on the Err case, instead of something custom.
 */
const andThen = <E, VA, VB>(fn: (va: VA) => Result<E, VB>) => (
  result: Result<E, VA>
): Result<E, VB> =>
  match(result, {
    Ok: value => fn(value),
    Err: err => Err(err),
  });

/** Convert to a simpler `Maybe` if the actual error message is not needed or
 * you need to interact with some code that primarily uses maybes.
 */
const toMaybe = <E, V>(result: Result<E, V>): Maybe.Maybe<V> =>
  match(result, {
    Ok: a => Maybe.Just(a),
    Err: _err => Maybe.Nothing(),
  });

/** Convert from a simple `Maybe` to interact with some code that primarily
 * uses results
 */
const fromMaybe = <E, V>(err: E, maybe: Maybe.Maybe<V>): Result<E, V> =>
  Maybe.match<V, Result<E, V>>(maybe, {
    Just: a => Ok(a),
    Nothing: () => Err(err),
  });

// TODO: GUARDS
